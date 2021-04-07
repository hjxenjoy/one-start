type ConfigData = {
  mode: 'start' | 'build'
  host?: string
  stage?: string
  [x: string]: string | string[]
}

type TagAttribute = {
  code?: string
  [key: string]: string
}

type BodyTag = {
  links: TagAttribute[]
  scripts: TagAttribute[]
  styles: TagAttribute[]
}

type HeadTag = {
  metas: TagAttribute[]
} & BodyTag

type PropertyType = string | ((data: ConfigData) => string)
type EnvType = {
  [envKey: string]: string | number | boolean | ((data: ConfigData) => string | number | boolean)
}
type CreateElement = (attrs: TagAttribute) => string

type AfterBuild = (data: ConfigData & {
  head: HeadTag
  body: BodyTag
  html: string
  createLink: CreateElement
  createScript: CreateElement
  createStyle: CreateElement
}) => void

interface Choice {
  name: string
  message?: string
}

export interface ConfigType {
  devCommand: string
  buildCommand: string
  hosts?: {name: string, message?: string}[]
  buildDir?: PropertyType
  buildHTML?: PropertyType
  beforeStart?(data: ConfigData): void
  afterBuild?: AfterBuild
  uploadCommand?: PropertyType
  common?: { env: EnvType }
  stages: {
    [stage: string]: {
      description?: string
      env?: EnvType
    }
  }
  options: {
    name: string
    message?: string
    choices: string[] | Choice[]
    multiple?: boolean
    initial?: any
  }[]
}

export default function createConfig(config: ConfigType): ConfigType
