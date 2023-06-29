import EndpointsCollector from "./endpoints-collector"

export class AugmentedModel extends EndpointsCollector<["object"]> {
  constructor(
    host: string,
    port: number,
    secure: boolean,
    private _uid: number,
    private _model: string
  ) {
    super(host, port, secure, ["object"])
  }

  // TODO
  // * return array of ids (ALL OF THEM, better to call with pagination)
  public async search() {
    // models.execute_kw(db, uid, password, 'res.partner', 'search', [
    //   [
    //     ['is_company', '=', true] // domain
    //   ]
    // ])
    // models.execute_kw(db, uid, password, 'res.partner', 'search', [[['is_company', '=', True]]], {'offset': 10, 'limit': 5})
  }

  // TODO
  // * return number of records matching domain
  public async search_count() {
    // models.execute_kw(db, uid, password, 'res.partner', 'search_count', [
    //   [
    //     ['is_company', '=', true] // same domain
    //   ]
    // ])
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
