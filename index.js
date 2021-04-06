#!/usr/bin/env node

const path = require('path')
const fs = require('fs')
const chalk = require('chalk')
const enquirer = require('enquirer')
const shell = require('shelljs')
const cheerio = require('cheerio')

const configFileName = 'one-start.config.js'

function readConfigFile() {
  const configFilePath = path.resolve(process.cwd(), configFileName)
  if (!fs.existsSync(configFilePath)) {
    console.log(`Config file is required! Please create file '${chalk.yellow(configFileName)}' in your project root directory.`)
    return
  }
  return require(configFilePath)
}

function createLink(linkAttributes) {
  const attrs = Object.keys(linkAttributes).map(key => `${key}="${linkAttributes[key]}"`).join(' ')
  return `<link ${attrs}/>`
}

function createScript(scriptAttributes) {
  const attrs = Object.keys(scriptAttributes).map(key => `${key}="${scriptAttributes[key]}"`).join(' ')
  return `<script ${attrs}></script>`
}

function extractHTML(html) {
  const $ = cheerio.load(html)
  const metas = []
  $('head meta').each(function () {
    metas.push({ ...this.attribs })
  })
  const headScripts = []
  $('head script').each(function () {
    headScripts.push({ ...this.attribs })
  })
  const headLinks = []
  $('head link').each(function () {
    headLinks.push({ ...this.attribs })
  })
  const bodyScripts = []
  $('body script').each(function () {
    bodyScripts.push({ ...this.attribs })
  })
  const bodyLinks = []
  $('body link').each(function () {
    bodyLinks.push({ ...this.attribs })
  })

  const head = {
    metas,
    scripts: headScripts,
    links: headLinks,
  }
  const body = {
    links: bodyLinks,
    scripts: bodyScripts,
  }
  return { head, body }
}

function getStageChoices(stageConfig) {
  if (!stageConfig) {
    return []
  }
  return Object.keys(stageConfig).map(stage => {
    if (stageConfig[stage].description) {
      return {
        name: stage,
        message: stageConfig[stage].description,
      }
    }
    return { name: stage }
  })
}

async function bootstrap() {
  const config = readConfigFile()

  const { mode } = await enquirer.prompt({
    type: 'select',
    name: 'mode',
    message: 'Select Start Mode',
    choices: [
      { name: 'start', message: 'Dev' },
      { name: 'build', message: 'Build' },
    ],
    initial: 'start'
  })

  const { host } = config.hosts && config.hosts.length ? await enquirer.prompt({
    type: 'select',
    name: 'host',
    message: 'Select Host',
    choices: config.hosts,
    initial: config.hosts[0].name,
  }) : { host: undefined }

  const stages = getStageChoices(config.stages)

  const { stage } = stages.length ? await enquirer.prompt({
    type: 'select',
    name: 'stage',
    message: 'Select Stage Environment Config',
    choices: stages,
    initial: stages[0].name,
  }) : { stage: undefined }

  const data = { mode, host, stage }
  // console.log(data)

  const { env: stageEnv } = stage ? config.stages[stage] : {}
  const { env: commonEnv } = config.common || {}

  const envFactory = {
    ...commonEnv,
    ...stageEnv,
  }

  const env = Object.keys(envFactory).reduce((acc, envKey) => {
    if (typeof envFactory[envKey] === 'function') {
      acc[envKey] = envFactory[envKey](data)
    } else {
      acc[envKey] = envFactory[envKey]
    }
    return acc
  }, {})

  // console.log(env)

  Object.keys(env).forEach((key) => {
    process.env[key] = env[key]
  })

  // before start
  if (typeof config.beforeStart === 'function') {
    config.beforeStart(data)
  }

  // start dev server
  if (mode === 'start') {
    console.log(`☕️ ${chalk.yellow('Start Dev Server...')}\n`)
    shell.exec(config.devCommand)
    return
  }

  // build
  console.log(`☕️ ${chalk.blue('Start Building...')}\n`)
  shell.exec(config.buildCommand)
  console.log(`🎉 ${chalk.green('Build Success!')}\n`)

  // exec upload command
  if (typeof config.uploadCommand !== 'undefined') {
    console.log(`🚀 ${chalk.blue('Start Uploading')}\n`)
    const uploadCommand = typeof config.uploadCommand === 'function' ? config.uploadCommand(data) : config.uploadCommand
    try {
      shell.exec(uploadCommand)
    } catch (e) {
      console.log(e)
    }
    console.log()
  }

  // extract elements from build html
  const buildDir = typeof config.buildDir === 'function' ? config.buildDir(data) : config.buildDir
  const buildHTML = typeof config.buildHTML === 'function' ? config.buildHTML(data) : (config.buildHTML || 'index.html')
  if (!buildDir) {
    console.log(chalk.yellowBright('Miss buildDir config.'))
    return
  }

  const htmlPath = path.resolve(process.cwd(), buildDir, buildHTML)
  if (!fs.existsSync(htmlPath)) {
    console.log(chalk.red(htmlPath, 'is not exist!'))
    return
  }
  const html = fs.readFileSync(htmlPath).toString()
  const { head, body } = extractHTML(html)

  // after build
  if (typeof config.afterBuild === 'function') {
    config.afterBuild({ ...data, head, body, html, createLink, createScript })
  }
}

bootstrap()
