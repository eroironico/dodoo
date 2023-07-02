import Op from "./lib/op"

export type Config = {
  url: URL | string
  port?: number
  db: string
  username: string
  password: string
}

export type InternalConfig = {
  host: string
  port: number
  secure: boolean
  db: string
  username: string
  password: string
}

export type ServerVersion = {
  server_version: string
  server_version_info: Array<string | number>
  server_serie: string
  protocol_version: number
}

export type ModelQueryMatcherSimpleValue = string | number | boolean | null

export type ModelQueryMatcherValue =
  | ModelQueryMatcherSimpleValue
  | Array<string | number | boolean | Array<any>>

export type ModelQueryMatcher = Partial<
  Record<keyof typeof Op, ModelQueryMatcherValue>
>

export type QueryTriple = [
  field: string,
  op: keyof typeof Op,
  value: ModelQueryMatcherValue
]

export type ModelQueryTripleValue =
  | ModelQueryMatcherSimpleValue
  | ModelQueryMatcher

export type ModelQueryTriple = Record<string, ModelQueryTripleValue>

export interface ModelBaseQueryInput {
  [k: string]:
    | ModelQueryTripleValue
    | ModelQueryTriple
    | Array<ModelQueryTriple>
    | undefined
}

export interface ModelQueryInput extends ModelBaseQueryInput {
  AND?: Array<ModelQueryTriple>
  OR?: Array<ModelQueryTriple>
  NOT?: ModelQueryTriple | Array<ModelQueryTriple>
}

export type ModelQueryOptions = Partial<{ offset: number; limit: number }>
