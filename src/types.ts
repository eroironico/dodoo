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

interface ModelInstanceMethods {
  /**
   * This method checks if a key (if passed) or the entire instance has changed since the first instantiation or the last `save` or `reload` call
   * @param key Optional, is passed the return value will refers to the key
   * @returns Whether `key` or the entire instance has changed or not
   */
  hasChanged(key?: string): boolean

  /**
   * This is a helper method to decrement certain fields, it accepts a list of fields or a list of objects, each of which specifies a key and an amount.
   *
   * Example:
   * ```js
   * await myRecord.decrement("counter_1", { key: "counter_2", by: 2 })
   * ```
   * The above call will decrement `counter_1` by 1 and `counter_2` by 2
   * @param keysMap The list of either keys or objects that specifies the behaviour of a single key
   * @returns A boolean indicating whether the the instance has been updated or not
   */
  decrement(
    ...keysMap: Array<string | { key: string; by: number }>
  ): Promise<boolean>

  /**
   * This is a helper method to increment certain fields, it accepts a list of fields or a list of objects, each of which specifies a key and an amount.
   *
   * Example:
   * ```js
   * await myRecord.increment("counter_1", { key: "counter_2", by: 2 })
   * ```
   * The above call will increment `counter_1` by 1 and `counter_2` by 2
   * @param keysMap The list of either keys or objects that specifies the behaviour of a single key
   * @returns A boolean indicating whether the the instance has been updated or not
   */
  increment(
    ...keysMap: Array<string | { key: string; by: number }>
  ): Promise<boolean>

  /**
   * This method saves the current instance in the db. If it has an id it updates it, otherwise, it creates a new record and set the id
   * @returns A number (id) if the instance has been created or a boolean if the instance has been updated
   */
  save(): Promise<number | boolean>

  /**
   * This method pulls the latest values of the local fields (and, if present, of the additionalKeys) from the db and reset the instance with those values
   * @param additionalKeys A list of keys to be pulled from odoo and added locally
   */
  reload(...additionalKeys: Array<string>): Promise<void>

  /**
   * This method deletes the instance's corresponding record in the db
   *
   * WARNINGS:
   * - After this method has been called you would not be able to call or access anything on this instance anymore
   * @returns A boolean indicating whether the record has been deleted or not
   */
  delete(): Promise<boolean>
}

interface ModelInstance extends ModelInstanceMethods {
  [k: string]: any
}

export interface Model {
  new (payload: Record<string, any>): ModelInstance
  setUID(uid: number): void

  /**
   * Records of a model are created using create()
   *
   * WARNINGS:
   * - Date, Datetime and Binary fields use string values
   * - One2many and Many2many use a special command protocol detailed in https://www.odoo.com/documentation/16.0/developer/reference/backend/orm.html#odoo.models.Model.write
   * @param record The record to be created
   * @returns The id of the newly created record
   */
  create(record: Record<string, any>): Promise<number>

  /**
   * Multiple records of a model are created using createMany()
   *
   * WARNINGS:
   * - Date, Datetime and Binary fields use string values
   * - One2many and Many2many use a special command protocol detailed in https://www.odoo.com/documentation/16.0/developer/reference/backend/orm.html#odoo.models.Model.write
   * @param records A list of records to be created
   * @returns The list of ids of the newly created records
   */
  createMany(records: Array<Record<string, any>>): Promise<Array<number>>

  /**
   * Finds only one record matching the id. It can also take a list of fields to be returned (if that list is not provided it will fetch all fields of matched records).
   * @param input Optional
   */
  findById<F extends Fields>(
    id: number,
    input?: Pick<ModelSearchReadInput<F>, "fields">
  ): Promise<Merge<MinimalRecord, Record<keyof F, any>> | undefined>

  /**
   * Finds only one record matching the input. It can also take a list of fields to be returned (if that list is not provided it will fetch all fields of matched records).
   * @param input Optional
   */
  findOne<F extends Fields>(
    input?: Pick<ModelSearchReadInput<F>, "where" | "fields">
  ): Promise<Merge<MinimalRecord, Record<keyof F, any>> | undefined>

  /**
   * Finds every record matching the input. It can also take a list of fields to be returned (if that list is not provided it will fetch all fields of matched records).
   * @param input Optional, if omitted all records will be returned
   */
  findMany<F extends Fields>(
    input?: ModelSearchReadInput<F>
  ): Promise<Array<Merge<MinimalRecord, Record<keyof F, any>>>>

  /**
   * It takes one record id to update and a mapping of updated fields to values
   *
   * WARNINGS:
   * - It is not possible to perform "computed" updates (where the value being set depends on an existing value of a record)
   * @param id The id of the record to update
   * @param payload The values to update
   * @returns A boolean indicating whether the records have been updated or not
   */
  update(id: number, payload: Record<string, any>): Promise<boolean>

  /**
   * It takes a list of records ids to update and a mapping of updated fields to values
   *
   * WARNINGS:
   * - Multiple records can be updated simultaneously, but they will all get the same values for the fields being set
   * - It is not possible to perform "computed" updates (where the value being set depends on an existing value of a record)
   * @param ids An array of ids of records to update
   * @param payload The values to update
   * @returns A boolean indicating whether the records have been updated or not
   */
  updateMany(ids: Array<number>, payload: Record<string, any>): Promise<boolean>

  /**
   * Returns number of records matching the query
   * @param input Optional, if omitted the number of all records will be returned
   */
  count(input?: ModelSimpleSearchInput): Promise<number>

  /**
   * A records can be deleted by providing its id
   * @param id The id of the record to delete
   * @returns A boolean indicating whether the records have been deleted or not
   */
  delete(id: number): Promise<boolean>

  /**
   * Records can be deleted in bulk by providing their ids
   * @param ids An array of ids of records to delete
   * @returns A boolean indicating whether the records have been deleted or not
   */
  deleteMany(ids: Array<number>): Promise<boolean>

  /**
   * This is a helper method that automatically runs a simple search and if a record that matches `input` is found then it updates it with `payload` values, otherwise it creates it
   *
   * For example, this:
   * ```js
   * const ResPartner = odoo.model("res.partner")
   *
   * ResPartner.upsert({ where: { id: 12 } }, { name: "Jhon" })
   * ```
   * Is the equivalent of:
   * ```js
   * const ResPartner = odoo.model("res.partner")
   *
   * ;(async () => {
   *     const partner = await ResPartner.findOne({ where: { id: 12 } })
   *
   *     if (partner) {
   *         await ResPartner.update(partner.id, { name: "Jhon" })
   *     } else {
   *         record.id = await ResPartner.create({ name: "Jhon" })
   *     }
   * })()
   * ```
   * @param input The query that should return one or zero items
   * @param payload The values to create or update depending on the result of `query`
   */
  upsert(
    input: ModelSimpleSearchInput,
    payload: Record<string, any>
  ): Promise<
    { record: Record<string, any> } & (
      | { created: true; updated: false }
      | { created: false; updated: boolean }
    )
  >
}

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

export type ModelSimpleSearchInput = {
  where: ModelQueryInput
}

export type ModelSearchReadInput<F extends Fields> = {
  where: ModelQueryInput
} & Partial<Merge<ModelQueryOptions, ModelReadOptions<F>>>

// ==================== Model ====================

// ==================== Record ====================

export type MinimalRecord = { id: number }
