const createConfig = require('../createConfig')

const Config = createConfig({
  devCommand: 'react-scripts start',
  buildCommand: 'react-scripts build',
  hosts: [{
    name: 'A',
    message: 'Publish/Start at Host A',
  },{
    name: 'B',
    message: 'Publish/Start at Host B',
  }],
  options: [
    {
      name: 'protocol',
      message: 'Please Select Protocol',
      choices: ['http', 'https'],
      initial: 0,
      stages: ['development'],
    },
    {
      name: 'entries',
      message: 'Please Select Your Entry File',
      multiple: true,
      choices: [
        { name: 'home', message: 'Home' },
        { name: 'about', message: 'About' },
        { name: 'article', message: 'Article' },
      ],
      initial: 0,
    }
  ],
  buildDir: ({host, stage}) => `dist/${host}-${stage}`,
  buildHTML: 'index.html',
  beforeStart(config) {
    console.log('config data:\n', config)
  },
  afterBuild({ head, body, createLink, createScript, createStyle }) {
    const text = head.links.map(link => createLink(link))
    text.push(...head.styles.map(style => createStyle(style)))
    text.push(...body.scripts.map(script => createScript(script)))
    console.log(text.join('\n'))
  },
  // uploadCommand: ({host, stage }) => {
  //   return `scp -r ${host}-${stage}-build/static root@remote:/remote/static/path`
  // },
  common: {
    env: {
      // PUBLIC_URL: ({host, stage}) => `https://${host}.your.domain.com/${stage}/`,
      BUILD_PATH: ({ host, stage }) => `dist/${host}-${stage}`,
      // INLINE_RUNTIME_CHUNK: false,
    },
  },
  stages: {
    development: {
      env: {
        PORT: 3456,
      }
    },
    testing: {
      env: {
        PUBLIC_URL: 'https://your-test-env.domain.com/',
      }
    },
    'pre-release': {
      description: 'Pre Release Environment',
      env: {
        OS_PROJECT_TITLE: ({host}) => `Project-${host}`
      }
    },
    production: {},
  },
})

module.exports = Config
