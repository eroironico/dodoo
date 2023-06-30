import Op from "./op"
import {
  ModelQueryInput,
  ModelQueryMatcherValue,
  ModelQueryTriple,
  ModelQueryTripleValue,
  QueryTriple,
} from "../types"
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

  private _parseTriple(
    field: string,
    matcher: ModelQueryTripleValue
  ): QueryTriple {
    if (
      typeof matcher === "string" ||
      typeof matcher === "number" ||
      typeof matcher === "boolean" ||
      (typeof matcher === "object" &&
        (matcher === null || Array.isArray(matcher)))
    ) {
      matcher = { EQUALS_TO: matcher }
    } else {
      const matcherKey = Object.keys(matcher).shift()
      if (!matcherKey || !(matcherKey in Op))
        throw new Error(`Invalid operator for field ${field}`)
    }

    const [opName, value] = Object.entries(matcher).shift() as [
      keyof typeof Op,
      ModelQueryMatcherValue
    ]

    return [field, Op[opName] as keyof typeof Op, value]
  }

  // TODO Can be moved in own abtract class (better)
  public _parseQuery<T extends string>(
    input: ModelQueryInput<T>
  ): Array<string | QueryTriple> {
    const orderedKeys = Object.keys(input).sort((ka, kb) => {
      if (ka === "NOT") return 1
      if (ka === "OR") return kb === "NOT" ? -1 : 1
      if (ka === "AND") return kb === "OR" ? -1 : 1
      if (kb === "AND") return -1

      return 0
    })
    const parsed = []

    for (const key of orderedKeys) {
      if (!/AND|OR|NOT/.test(key))
        parsed.push(this._parseTriple(key, input[key as keyof typeof input]!))

      const value = (
        Array.isArray(input[key as keyof typeof input])
          ? input[key as keyof typeof input]
          : [input[key as keyof typeof input]]
      ) as Array<ModelQueryTriple>
      const terms = value
        .map(term => Object.entries(term).shift() || [])
        .filter(([tk, tv]) => tk !== undefined && tv !== undefined)

      switch (key) {
        case "AND":
          if (value.length < 2)
            throw new Error("AND operator requires at least 2 terms")

          terms.forEach(([tk, tv]) => parsed.push(this._parseTriple(tk, tv)))
          break
        case "OR":
          if (value.length < 2)
            throw new Error("OR operator requires at least 2 terms")

          terms.forEach(([tk, tv], ti) => {
            if (ti < value.length - 1) parsed.push("|")
            parsed.push(this._parseTriple(tk, tv))
          })
          break
        case "NOT":
          terms.forEach(([tk, tv]) =>
            parsed.push("!", this._parseTriple(tk, tv))
          )
      }
    }

    return parsed
  }

  // * return array of ids (ALL OF THEM, better to call with pagination)
  /**
   * Records can be listed and filtered via search()
   * @param query
   */
  public async search(query?: Record<string, any>) {
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
