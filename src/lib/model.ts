import {
  Fields,
  Merge,
  ModelQueryInput,
  ModelQueryOptions,
  ModelReadOptions,
} from "../types"
import EndpointsCollector from "./endpoints-collector"
import QueryParser from "./query-parser"

export default class Model extends EndpointsCollector<["object"]> {
  constructor(
    host: string,
    port: number,
    secure: boolean,
    private _db: string,
    private _uid: number,
    private _password: string,
    public name: string
  ) {
    super(host, port, secure, ["object"])
  }

  /**
   * Records can be listed and filtered via search()
   *
   * WARNINGS:
   * - returns an array of **every** record matching the query that can be a huge amount, consider call it with pagination
   * @param query Optional, if omitted all records will be returned
   * @param options Optional, specify offset and limit for the query
   */
  public async search(
    query?: ModelQueryInput,
    options?: Partial<ModelQueryOptions>
  ): Promise<Array<number>> {
    const params: Array<any> = [
      this._db,
      this._uid,
      this._password,
      this.name,
      "search",
      [query ? QueryParser.parse(query) : []],
    ]
    if (options) params.push(options)

    // TODO return Record, optionally raw
    // TODO optionally populate records (internal call to searchRead)
    return this._xmlrpc.object.call("execute_kw", params)
  }

  /**
   * Returns number of records matching `query`
   * @param query Optional, if omitted the number of all records will be returned
   */
  public async searchCount(query?: ModelQueryInput) {
    return this._xmlrpc.object.call("execute_kw", [
      this._db,
      this._uid,
      this._password,
      this.name,
      "search_count",
      [query ? QueryParser.parse(query) : []],
    ])
  }

  // TODO (single per record, maybe new class, this can be bulkRead)
  /**
   * Takes a list of ids and, optionally, a list of fields to fetch. By default, it fetches all the fields the current user can read, which tends to be a huge amount. Note that the id will always be included
   * @param ids An array of ids to read
   * @param options Recommended, specify which fields to read
   */
  public async read<F extends Fields>(
    ids: Array<number>,
    options?: ModelReadOptions<F>
  ): Promise<Array<Merge<{ id: number }, Record<keyof F, any>>>> {
    const params: Array<any> = [
      this._db,
      this._uid,
      this._password,
      this.name,
      "read",
      [ids],
    ]
    if (options) params.push({ fields: Object.keys(options.fields) })

    return this._xmlrpc.object.call("execute_kw", params)
  }

  /**
   * An equivalent to a search() followed by a read(). It can also take a list of fields (like read(), if that list is not provided it will fetch all fields of matched records).
   * @param query Optional, if omitted all records will be returned
   * @param options Optional, specify offset, limit and which fields to read for this query
   */
  public async searchRead<F extends Fields>(
    query?: ModelQueryInput,
    options?: Partial<Merge<ModelQueryOptions, ModelReadOptions<F>>>
  ): Promise<Array<Merge<{ id: number }, Record<keyof F, any>>>> {
    const params: Array<any> = [
      this._db,
      this._uid,
      this._password,
      this.name,
      "search_read",
      [query ? QueryParser.parse(query) : []],
    ]
    if (options) {
      if (!options.fields) params.push(options)
      else params.push({ ...options, fields: Object.keys(options.fields) })
    }

    return this._xmlrpc.object.call("execute_kw", params)
  }

  // TODO implement Odoo.Command (for One2Many and Many2Many)
  /**
   * Records of a model are created using create()
   *
   * WARNINGS:
   * - Date, Datetime and Binary fields use string values
   * - One2many and Many2many use a special command protocol detailed in https://www.odoo.com/documentation/16.0/developer/reference/backend/orm.html#odoo.models.Model.write
   * @param payload The record to be created
   * @returns The id of the newly created record
   */
  public async create(payload: Record<string, any>): Promise<number> {
    return this._xmlrpc.object.call("execute_kw", [
      this._db,
      this._uid,
      this._password,
      this.name,
      "create",
      [payload],
    ])
  }

  // TODO (can be single per record, same as read, this can be bulkUpdate)
  /**
   * It takes a list of records to update and a mapping of updated fields to values
   *
   * WARNINGS:
   * - Multiple records can be updated simultaneously, but they will all get the same values for the fields being set
   * - It is not possible to perform “computed” updates (where the value being set depends on an existing value of a record)
   * @param ids An array of ids to update
   * @param payload The values to update
   * @returns A boolean indicating whether the records have been deleted or not
   */
  public async update(
    ids: Array<number>,
    payload: Record<string, any>
  ): Promise<boolean> {
    return this._xmlrpc.object.call("execute_kw", [
      this._db,
      this._uid,
      this._password,
      this.name,
      "update",
      [ids, payload],
    ])
  }

  // TODO (again, can be single per record, this can be bulkDelete)
  /**
   * Records can be deleted in bulk by providing their ids
   * @param ids An array of ids to delete
   * @returns A boolean indicating whether the records have been deleted or not
   */
  public async delete(ids: Array<number>): Promise<boolean> {
    return this._xmlrpc.object.call("execute_kw", [
      this._db,
      this._uid,
      this._password,
      this.name,
      "unlink",
      [ids],
    ])
  }
}
