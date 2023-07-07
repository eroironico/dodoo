import modelGenerator from "./lib/model-generator"
import QueryParser from "./lib/query-parser"

export type Merge<A, B> = A & B

// ==================== Odoo ====================

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

// ==================== Odoo ====================

// ==================== Model ====================

export type Model = ReturnType<typeof modelGenerator>

export type ModelQueryMatcherSimpleValue = string | number | boolean | null

export type ModelQueryMatcherValue =
  | ModelQueryMatcherSimpleValue
  | Array<string | number | boolean | Array<any>>

export type ModelQueryMatcher = Partial<
  Record<keyof typeof QueryParser.Op, ModelQueryMatcherValue>
>

export type QueryTriple = [
  field: string,
  op: (typeof QueryParser.Op)[keyof typeof QueryParser.Op],
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

export type ModelQueryOptions = { offset: number; limit: number }

export type Fields = Record<string, true>

export type ModelReadOptions<F extends Fields> = {
  fields: F
}

export type ModelSearchInput = {
  where: ModelQueryInput
} & Partial<ModelQueryOptions>

export type ModelSearchCountInput = {
  where: ModelQueryInput
}

export type ModelSearchReadInput<F extends Fields> = {
  where: ModelQueryInput
} & Partial<Merge<ModelQueryOptions, ModelReadOptions<F>>>

// ==================== Model ====================

// ==================== Record ====================

export type MinimalRecord = { id: number }
