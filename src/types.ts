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

// TODO FIXME properties not inferred
export type ModelQueryInput<K extends keyof any> = {
  [P in K]: P extends "AND" | "OR"
    ? Array<ModelQueryTriple>
    : P extends "NOT"
    ? ModelQueryTriple | Array<ModelQueryTriple>
    : ModelQueryTripleValue
}
