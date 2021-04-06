const Config = {
  devCommand: 'react-scripts start',
  buildCommand: 'react-scripts build',
  hosts: [{
    name: 'A',
    message: 'Publish/Start at Host A',
  },{
    name: 'B',
    message: 'Publish/Start at Host B',
  }],
  buildDir: ({host, stage}) => `dist/${host}-${stage}`,
  buildHTML: 'index.html',
  beforeStart(config) {
    console.log('ready', config)
  },
  afterBuild({ head, body, createLink, createScript }) {
    const text = head.links.map(link => createLink(link))
    text.push(...body.scripts.map(script => createScript(script)))
    console.log(text.join('\n'))
  },
  uploadCommand: ({host, stage }) => {
    return `scp -r ${host}-${stage}-build/static root@remote:/remote/static/path`
  },
  common: {
    env: {
      // PUBLIC_URL: ({host, stage}) => `https://${host}.your.domain.com/${stage}/`,
      BUILD_PATH: ({ host, stage }) => `dist/${host}-${stage}`,
      INLINE_RUNTIME_CHUNK: false,
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
        PUBLIC_URL: 'http://your-test-env.domain.com/',
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
}

module.exports = Config
