export type ConfigData = {
  mode: 'start' | 'build'
  host?: string
  stage?: string
}

type TagAttribute = {
  code?: string
  [key: string]: string
}

export type BodyTag = {
  links: TagAttribute[]
  scripts: TagAttribute[]
  styles: TagAttribute[]
}

export type HeadTag = {
  metas: TagAttribute[]
} & BodyTag

export type PropertyType = string | ((data: ConfigData) => string)
export type EnvType = {
  [envKey: string]: string | number | boolean | ((data: ConfigData) => string | number | boolean)
}

export interface ConfigType {
  devCommand: string
  buildCommand: string
  hosts?: {name: string, message?: string}[]
  buildDir?: PropertyType
  buildHTML?: PropertyType
  beforeStart?(data: ConfigData): void
  afterBuild?(data: ConfigData & {
    head: HeadTag
    body: BodyTag
    createLink(attrs: TagAttribute): string
    createScript(attrs: TagAttribute): string
    createStyle(attrs: TagAttribute): string
    html: string
  }): void
  uploadCommand?: PropertyType
  common?: {
    env: EnvType
  }
  stages: {
    [stage: string]: {
      description?: string
      env: EnvType
    }
  }
}

export default function createConfig(config: ConfigType): ConfigType
