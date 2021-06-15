#!/usr/bin/env node

const path = require('path')
const fs = require('fs')
const chalk = require('chalk')
const enquirer = require('enquirer')
const shell = require('shelljs')
const cheerio = require('cheerio')

const configFileName = 'one-start.config.js'

function getCommand(command, context) {
  return typeof command === 'function' ? command(context) : command
}

function readConfigFile() {
  const configFilePath = path.resolve(process.cwd(), configFileName)
  if (!fs.existsSync(configFilePath)) {
    console.log(`Config file is required! Please create file '${chalk.yellow(configFileName)}' in your project root directory.`)
    return
  }
  return require(configFilePath)
}

function stringifyAttributes(attrs) {
  const attrString = Object.keys(attrs).map(key => !attrs[key] ? key : `${key}="${attrs[key]}"`).join(' ')
  return attrString.length ? ` ${attrString}` : ''
}

function createLink(linkAttributes) {
  return `<link${stringifyAttributes(linkAttributes)}/>`
}

function createScript(scriptAttributes) {
  const { code = '', ...scriptAttrs } = scriptAttributes
  return `<script${stringifyAttributes(scriptAttrs)}>${code}</script>`
}

function createStyle(styleAttributes) {
  const { code = '', ...styleAttrs } = styleAttributes
  return `<style${stringifyAttributes(styleAttrs)}>${code}</style>`
}

function extractHTML(html) {
  const $ = cheerio.load(html)
  const metas = []
  $('head meta').each(function () {
    metas.push({ ...this.attribs })
  })
  const headScripts = []
  $('head script').each(function () {
    if (this.children.length) {
      headScripts.push({
        ...this.attribs,
        code: this.children.filter(node => node.type === 'text').map(node => node.data).join('\n'),
      })
    } else {
      headScripts.push({ ...this.attribs })
    }
  })
  const headLinks = []
  $('head link').each(function () {
    headLinks.push({ ...this.attribs })
  })
  const headStyles = []
  $('head style').each(function () {
    headStyles.push({
      ...this.attribs,
      code: this.children.filter(node => node.type === 'text').map(node => node.data).join('\n'),
    })
  })
  const bodyScripts = []
  $('body script').each(function () {
    if (this.children.length) {
      bodyScripts.push({
        ...this.attribs,
        code: this.children.filter(node => node.type === 'text').map(node => node.data).join('\n'),
      })
    } else {
      bodyScripts.push({ ...this.attribs })
    }
  })
  const bodyLinks = []
  $('body link').each(function () {
    bodyLinks.push({ ...this.attribs })
  })
  const bodyStyles = []
  $('body style').each(function () {
    bodyStyles.push({
      ...this.attribs,
      code: this.children.filter(node => node.type === 'text').map(node => node.data).join('\n'),
    })
  })

  const head = {
    metas,
    scripts: headScripts,
    links: headLinks,
    styles: headStyles,
  }
  const body = {
    links: bodyLinks,
    scripts: bodyScripts,
    styles: bodyStyles,
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

async function promptOptions(options, acc = {}, stage) {
  const option = options.shift()
  option.type = 'select'

  if (!stage || !option.stages || !option.stages.length || option.stages.includes(stage)) {
    const result = await enquirer.prompt(option)
    acc[option.name] = result[option.name]
  }

  if (options.length) {
    return promptOptions(options, acc, stage)
  }

  return acc
}

async function bootstrap() {
  const config = readConfigFile()

  // host
  const { host } = config.hosts && config.hosts.length ? await enquirer.prompt({
    type: 'select',
    name: 'host',
    message: 'Select Host',
    choices: config.hosts,
    initial: 0,
  }) : { host: undefined }

  // stage
  const stages = getStageChoices(config.stages)
  const { stage } = stages.length ? stages.length === 1 ? { stage: stages[0].name } : await enquirer.prompt({
    type: 'select',
    name: 'stage',
    message: 'Select Stage Environment Config',
    choices: stages,
    initial: 0,
  }) : { stage: undefined }

  let data = { host, stage }

  if (config.options) {
    data = await promptOptions(config.options, data, stage)
  }

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

  Object.keys(env).forEach((key) => {
    process.env[key] = env[key]
  })

  const { mode } = stage === 'development' ? { mode: 'start' } : await enquirer.prompt({
    type: 'select',
    name: 'mode',
    message: 'Select Start Mode',
    choices: [
      // { name: 'start', message: 'Dev(stage for development)' },
      { name: 'build', message: 'Build + Upload + Extract' },
      { name: 'buildOnly', message: 'Build + Confirm Next' },
      { name: 'extract', message: 'Extract Assets in Build Folder' },
      { name: 'upload', message: 'Upload Assets from Build Folder' },
    ],
    initial: 0,
  })

  // before start
  if (typeof config.beforeStart === 'function') {
    config.beforeStart(data)
  }

  // start dev server
  if (mode === 'start') {
    console.log(`☕️ ${chalk.yellowBright('Start Dev Server...')}\n`)
    shell.exec(getCommand(config.devCommand, data))
    return
  }

  if (mode === 'build') {
    doBuild()
    doUpload()
    doExtract()
    return
  }

  if (mode === 'extract') {
    doExtract()
    return
  }

  if (mode === 'upload') {
    doUpload()
    return
  }

  if (mode === 'buildOnly') {
    doBuild()

    const { next } = await enquirer.prompt({
      type: 'select',
      name: 'next',
      message: 'Do something after build',
      choices: [
        { name: 'upload', message: 'Upload assets' },
        { name: 'extract', message: 'Extract assets' },
        { name: 'both', message: 'Upload & Extract assets' },
        { name: 'exit', message: 'Exit' },
      ],
      initial: 2,
    })

    if (next === 'exit') {
      return
    }

    if (next === 'upload' || next === 'both') {
      doUpload()
    }

    if (next === 'extract' || next === 'both') {
      doExtract()
    }
  }

  function doBuild() {
    console.log(`☕️ ${chalk.blueBright('Start Building...')}\n`)
    shell.exec(getCommand(config.buildCommand, data))
    console.log(`🎉 ${chalk.greenBright('Build Success!')}\n`)
  }

  // exec upload command
  function doUpload() {
    const uploadCommand = getCommand(config.uploadCommand, data)
    if (typeof uploadCommand === 'undefined') {
      console.log(chalk.yellowBright('Miss uploadCommand config.'))
      console.log()
      return
    }
    console.log(`🚀 ${chalk.blueBright('Start Uploading')}\n`)
    try {
      shell.exec(uploadCommand)
    } catch (e) {
      console.log(e)
    }
    console.log()
  }

  function doExtract() {
    if (typeof config.afterBuild !== 'function') {
      console.log(chalk.yellowBright('Miss afterBuild config.'))
      return
    }
    // extract elements from build html
    const buildDir = getCommand(config.buildDir, data)
    const buildHTML = getCommand(config.buildHTML, data) || 'index.html'
    if (!buildDir) {
      console.log(chalk.yellowBright('Miss buildDir config.'))
      console.log()
      return
    }

    const htmlPath = path.resolve(process.cwd(), buildDir, buildHTML)
    if (!fs.existsSync(htmlPath)) {
      console.log(chalk.redBright(htmlPath, 'is not exist!'))
      console.log()
      return
    }
    const html = fs.readFileSync(htmlPath).toString()
    const { head, body } = extractHTML(html)
    config.afterBuild({ ...data, head, body, html, createLink, createScript, createStyle })
  }
}

bootstrap()
