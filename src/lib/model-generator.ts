import {
  Fields,
  Merge,
  MinimalRecord,
  ModelSearchCountInput,
  ModelSearchReadInput,
} from "../types"
import QueryParser from "./query-parser"
import XMLRPCClient from "./xmlrpc-client"

export default function modelGenerator(
  _name: string,
  _host: string,
  _port: number,
  _secure: boolean,
  _db: string,
  _uid: number | null,
  _password: string
) {
  const _deleteModelErrorMsg = `Model "${_name}" has been deleted and cannot be accessed`
  const _notYetCreatedModelErrorMsg = `Model "${_name}" has not been created yet`
  const _xmlrpc = new XMLRPCClient(_host, _port, _secure, "xmlrpc/2/object")

  async function _execute(method: string, params: Array<any>) {
    if (!_uid)
      throw new Error("You must authenticate before calling objects methods")

    return _xmlrpc.call(
      "execute_kw",
      [_db, _uid, _password, _name, method].concat(params)
    )
  }

  return class Model {
    public __currentFields__: Record<string, any> = {}
    public __previousFields__: Record<string, any> = {}
    public __isDeleted___ = false

    constructor(payload?: Record<string, any>) {
      this.__currentFields__ = { ...payload }

      return new Proxy(this, {
        get(t, k) {
          if (t.__isDeleted___) throw new Error(_deleteModelErrorMsg)
          if (typeof k !== "string") return undefined

          if (k in t) {
            const value = t[k as keyof typeof t]
            if (value instanceof Function)
              return function (...args: any[]) {
                value.apply(t, args)
              }
            else return value
          }

          return t.__currentFields__[k]
        },
        set(t, k, v) {
          if (t.__isDeleted___) throw new Error(_deleteModelErrorMsg)
          if (typeof k !== "string") return false

          if (k in t) {
            let value = t[k as keyof typeof t]
            if (value instanceof Function) return false
            value = v
            return true
          }

          t.__currentFields__[k] = v
          return true
        },
      })
    }

    // ============================= STATIC =============================
    public static setUID(uid: number) {
      _uid = uid
    }

    /**
     * Records of a model are created using create()
     *
     * WARNINGS:
     * - Date, Datetime and Binary fields use string values
     * - One2many and Many2many use a special command protocol detailed in https://www.odoo.com/documentation/16.0/developer/reference/backend/orm.html#odoo.models.Model.write
     * @param record The record to be created
     * @returns The id of the newly created record
     */
    public static async create(record: Record<string, any>): Promise<number> {
      return _execute("create", [[record]])
    }

    /**
     * Multiple records of a model are created using createMany()
     *
     * WARNINGS:
     * - Date, Datetime and Binary fields use string values
     * - One2many and Many2many use a special command protocol detailed in https://www.odoo.com/documentation/16.0/developer/reference/backend/orm.html#odoo.models.Model.write
     * @param records A list of records to be created
     * @returns The list of ids of the newly created records
     */
    public static async createMany(
      records: Array<Record<string, any>>
    ): Promise<Array<number>> {
      return Promise.all(records.map(record => Model.create(record)))
    }

    /**
     * Finds only one record matching the id. It can also take a list of fields to be returned (if that list is not provided it will fetch all fields of matched records).
     * @param input Optional
     */
    public static async findById<F extends Fields>(
      id: number,
      input?: Pick<ModelSearchReadInput<F>, "fields">
    ): Promise<Merge<MinimalRecord, Record<keyof F, any>> | undefined> {
      return Model.findOne({ where: { id }, ...input })
    }

    /**
     * Finds only one record matching the input. It can also take a list of fields to be returned (if that list is not provided it will fetch all fields of matched records).
     * @param input Optional
     */
    public static async findOne<F extends Fields>(
      input?: Pick<ModelSearchReadInput<F>, "where" | "fields">
    ): Promise<Merge<MinimalRecord, Record<keyof F, any>> | undefined> {
      return Model.findMany(input ? { ...input, limit: 1 } : undefined).then(
        ([record]) => record
      )
    }

    /**
     * Finds every record matching the input. It can also take a list of fields to be returned (if that list is not provided it will fetch all fields of matched records).
     * @param input Optional, if omitted all records will be returned
     */
    public static async findMany<F extends Fields>(
      input?: ModelSearchReadInput<F>
    ): Promise<Array<Merge<MinimalRecord, Record<keyof F, any>>>> {
      const { where: query, ...options } = input || {}

      const params: Array<any> = [[query ? QueryParser.parse(query) : []]]
      if (Object.keys(options).length) {
        if (!("fields" in options) || !options.fields) params.push(options)
        else params.push({ ...options, fields: Object.keys(options.fields) })
      }

      return _execute("search_read", params)
    }

    /**
     * It takes one record id to update and a mapping of updated fields to values
     *
     * WARNINGS:
     * - It is not possible to perform "computed" updates (where the value being set depends on an existing value of a record)
     * @param id The id of the record to update
     * @param payload The values to update
     * @returns A boolean indicating whether the records have been deleted or not
     */
    public static async update(
      id: number,
      payload: Record<string, any>
    ): Promise<boolean> {
      return _execute("write", [[[id], payload]])
    }

    /**
     * It takes a list of records ids to update and a mapping of updated fields to values
     *
     * WARNINGS:
     * - Multiple records can be updated simultaneously, but they will all get the same values for the fields being set
     * - It is not possible to perform "computed" updates (where the value being set depends on an existing value of a record)
     * @param ids An array of ids of records to update
     * @param payload The values to update
     * @returns A boolean indicating whether the records have been deleted or not
     */
    public static async updateMany(
      ids: Array<number>,
      payload: Record<string, any>
    ): Promise<boolean> {
      return _execute("write", [[ids, payload]])
    }

    /**
     * Returns number of records matching the query
     * @param input Optional, if omitted the number of all records will be returned
     */
    public static async count(input?: ModelSearchCountInput): Promise<number> {
      return _execute("search_count", [
        [input?.where ? QueryParser.parse(input.where) : []],
      ])
    }

    /**
     * A records can be deleted by providing its id
     * @param id The id of the record to delete
     * @returns A boolean indicating whether the records have been deleted or not
     */
    public static async delete(id: number): Promise<boolean> {
      return _execute("unlink", [[[id]]])
    }

    /**
     * Records can be deleted in bulk by providing their ids
     * @param ids An array of ids of records to delete
     * @returns A boolean indicating whether the records have been deleted or not
     */
    public static async deleteMany(ids: Array<number>): Promise<boolean> {
      return _execute("unlink", [[ids]])
    }

    // ============================ INSTANCE ============================
    /**
     * This method checks if a key (if passed) or the entire instance has changed since the first instantiation or the last `save` or `reload` call
     * @param key Optional, is passed the return value will refers to the key
     * @returns Whether `key` or the entire instance has changed or not
     */
    public hasChanged(key?: string) {
      if (!key)
        return Object.entries(this.__currentFields__).some(
          ([k, v]) => this.__previousFields__[k] !== v
        )

      if (!Object.keys(this.__currentFields__).includes(key))
        throw new Error(`Model "${_name}" has no key "${key}"`)
      if (!Object.keys(this.__previousFields__).includes(key)) return true

      const currentValue = this.__currentFields__[key]
      const previousValue = this.__previousFields__[key]

      if (
        ["boolean", "number", "string", "undefined"].includes(
          typeof currentValue
        )
      )
        return currentValue !== previousValue
      else if (currentValue === null) return previousValue !== null
      else if (Array.isArray(currentValue))
        return (
          !Array.isArray(previousValue) ||
          currentValue.some((v, i) => previousValue[i] !== v)
        )
      else
        return Object.entries(currentValue).some(
          ([k, v]) => previousValue[k] !== v
        )
    }

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
    public async decrement(
      ...keysMap: Array<string | { key: string; by: number }>
    ): Promise<boolean> {
      if (typeof this.__currentFields__.id !== "number")
        throw new Error(`Model "${_name}" has not been created yet`)

      const decrementPayload = Object.fromEntries(
        keysMap.map(km =>
          typeof km === "string"
            ? [km, this.__currentFields__[km] - 1]
            : [km.key, this.__currentFields__[km.key] - km.by]
        )
      )

      return _execute("write", [
        [[this.__currentFields__.id], decrementPayload],
      ]).then(isUpdated => {
        if (!isUpdated) return false

        this.__currentFields__ = {
          ...this.__currentFields__,
          ...decrementPayload,
        }
        this.__previousFields__ = {
          ...this.__previousFields__,
          ...decrementPayload,
        }

        return true
      })
    }

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
    public async increment(
      ...keysMap: Array<string | { key: string; by: number }>
    ): Promise<boolean> {
      if (typeof this.__currentFields__.id !== "number")
        throw new Error(_notYetCreatedModelErrorMsg)

      const incrementPayload = Object.fromEntries(
        keysMap.map(km =>
          typeof km === "string"
            ? [km, this.__currentFields__[km] + 1]
            : [km.key, this.__currentFields__[km.key] + km.by]
        )
      )

      return _execute("write", [
        [[this.__currentFields__.id], incrementPayload],
      ]).then(isUpdated => {
        if (!isUpdated) return false

        this.__currentFields__ = {
          ...this.__currentFields__,
          ...incrementPayload,
        }
        this.__previousFields__ = {
          ...this.__previousFields__,
          ...incrementPayload,
        }

        return true
      })
    }

    /**
     * This method saves the current instance in the db. If it has an id it updates it, otherwise, it creates a new record and set the id
     * @returns A number (id) if the instance has been created or a boolean if the instance has been updated
     */
    public async save(): Promise<number | boolean> {
      if (!this.__currentFields__.id)
        return _execute("create", [[this.__currentFields__]]).then(id => {
          const newlyCreated = { id, ...this.__currentFields__ }
          this.__currentFields__ = { ...newlyCreated }
          this.__previousFields__ = { ...newlyCreated }

          return id
        })
      else
        return _execute("write", [
          [
            [this.__currentFields__.id],
            Object.fromEntries(
              Object.entries(this.__currentFields__).filter(([k]) => k !== "id")
            ),
          ],
        ]).then(isUpdated => {
          if (!isUpdated) return false

          this.__previousFields__ = { ...this.__currentFields__ }

          return true
        })
    }

    /**
     * This method pulls the latest values of the local fields (and, if present, of the additionalKeys) from the db and reset the instance with those values
     * @param additionalKeys A list of keys to be pulled from odoo and added locally
     */
    public async reload(...additionalKeys: Array<string>): Promise<void> {
      if (typeof this.__currentFields__.id !== "number")
        throw new Error(_notYetCreatedModelErrorMsg)

      return _execute("search_read", [
        [QueryParser.parse({ id: this.__currentFields__.id })],
        {
          limit: 1,
          fields: Object.keys(this.__previousFields__).concat(additionalKeys),
        },
      ]).then(([record]) => {
        this.__previousFields__ = { ...record }
        this.__currentFields__ = { ...record }
      })
    }

    /**
     * This method deletes the instance's corresponding record in the db
     *
     * WARNINGS:
     * - After this method has been called you would not be able to call or access anything on this instance anymore
     * @returns A boolean indicating whether the record has been deleted or not
     */
    public async delete(): Promise<boolean> {
      if (typeof this.__currentFields__.id !== "number")
        throw new Error(_notYetCreatedModelErrorMsg)

      return _execute("unlink", [[[this.__currentFields__.id]]]).then(
        isDeleted => {
          if (!isDeleted) return false

          this.__isDeleted___ = true
          return true
        }
      )
    }
  }
}
