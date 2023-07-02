import { ModelQueryInput, ModelQueryOptions } from "../types"
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
   */
  public async search(query?: ModelQueryInput, options?: ModelQueryOptions) {
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
    // TODO optionally populate records
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
  // * takes a list of ids (as returned by search()), and optionally a list of fields to fetch. By default, it fetches all the fields the current user can read, which tends to be a huge amount
  public async read(ids: Array<string>) {
    // const [record] = models.execute_kw(db, uid, password, 'res.partner', 'read', [ids])
    // const [record] = models.execute_kw(db, uid, password, 'res.partner', 'read', [ids], {'fields': ['name', 'country_id', 'comment']})
  }

  // TODO
  // * can be used to inspect a model’s fields and check which ones seem to be of interest. Because it returns a large amount of meta-information it should be filtered before printing
  public async fields_get() {
    // models.execute_kw(db, uid, password, 'res.partner', 'fields_get', [])
    // models.execute_kw(db, uid, password, 'res.partner', 'fields_get', [], {'attributes': ['string', 'help', 'type']})
  }

  // TODO
  // * Odoo provides a search_read() shortcut which is equivalent to a search() followed by a read(). It can also take a list of fields (like read(), if that list is not provided it will fetch all fields of matched records).
  public async search_read() {
    // models.execute_kw(db, uid, password, 'res.partner', 'search_read', [[['is_company', '=', True]]])
    // models.execute_kw(db, uid, password, 'res.partner', 'search_read', [[['is_company', '=', True]]], {'fields': ['name', 'country_id', 'comment'], 'limit': 5})
  }

  // TODO
  // * records of a model are created using create(). The method creates a SINGLE record and returns its id
  // ! WARNING
  // ! - Date, Datetime and Binary fields use string values
  // ! - One2many and Many2many use a special command protocol detailed in https://www.odoo.com/documentation/16.0/developer/reference/backend/orm.html#odoo.models.Model.write
  public async create() {
    // const id = models.execute_kw(db, uid, password, 'res.partner', 'create', [{'name': "New Partner"}])
  }

  // TODO (can be single per record, same as read, this can be bulkUpdate)
  // * it takes a list of records to update and a mapping of updated fields to values
  // ! WARNING
  // ! - Multiple records can be updated simultaneously, but they will all get the same values for the fields being set
  // ! - It is not possible to perform “computed” updates (where the value being set depends on an existing value of a record)
  public async update() {
    // models.execute_kw(db, uid, password, 'res.partner', 'write', [[id], {'name': "Newer partner"}])
  }

  // TODO (again, can be single per record, this can be bulkDelete)
  // * records can be deleted in bulk by providing their ids
  public async delete() {}

  // * Additional: https://www.odoo.com/documentation/16.0/developer/reference/external_api.html#inspection-and-introspection
}
