import {
  Fields,
  Merge,
  MinimalRecord,
  ModelSearchCountInput,
  ModelSearchReadInput,
} from "../types"
import QueryParser from "./query-parser"
import XMLRPCClient from "./xmlrpc-client"

// * https://www.odoo.com/documentation/16.0/developer/reference/backend/orm.html#common-orm-methods

export default function modelGenerator(
  _name: string,
  _host: string,
  _port: number,
  _secure: boolean,
  _db: string,
  _uid: number | null,
  _password: string
) {
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
    constructor() {}

    // ============================= STATIC =============================
    public static setUID(uid: number) {
      _uid = uid
      return this
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
      return _execute("update", [[[id], payload]])
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
      return _execute("update", [[ids, payload]])
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
    public async save() {
      _xmlrpc.call("", [])
    }
  }
}
