import {
  Fields,
  Merge,
  MinimalRecord,
  ModelSimpleSearchInput,
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
  const _xmlrpc = new XMLRPCClient(_host, _port, _secure, "/xmlrpc/2/object")

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
    public __isDeleted__ = false

    constructor(payload?: Record<string, any>) {
      this.__currentFields__ = { ...payload }

      return new Proxy(this, {
        get(t, k) {
          if (t.__isDeleted__) throw new Error(_deleteModelErrorMsg)
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
          if (t.__isDeleted__) throw new Error(_deleteModelErrorMsg)
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

    public static async create(record: Record<string, any>): Promise<number> {
      return _execute("create", [[record]])
    }

    public static async createMany(
      records: Array<Record<string, any>>
    ): Promise<Array<number>> {
      return Promise.all(records.map(record => Model.create(record)))
    }

    public static async findById<F extends Fields>(
      id: number,
      input?: Pick<ModelSearchReadInput<F>, "fields">
    ): Promise<Merge<MinimalRecord, Record<keyof F, any>> | undefined> {
      return Model.findOne({ where: { id }, ...input })
    }

    public static async findOne<F extends Fields>(
      input?: Pick<ModelSearchReadInput<F>, "where" | "fields">
    ): Promise<Merge<MinimalRecord, Record<keyof F, any>> | undefined> {
      return Model.findMany(input ? { ...input, limit: 1 } : undefined).then(
        ([record]) => record
      )
    }

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

    public static async update(
      id: number,
      payload: Record<string, any>
    ): Promise<boolean> {
      return _execute("write", [[[id], payload]])
    }

    public static async updateMany(
      ids: Array<number>,
      payload: Record<string, any>
    ): Promise<boolean> {
      return _execute("write", [[ids, payload]])
    }

    public static async count(input?: ModelSimpleSearchInput): Promise<number> {
      return _execute("search_count", [
        [input?.where ? QueryParser.parse(input.where) : []],
      ])
    }

    public static async delete(id: number): Promise<boolean> {
      return _execute("unlink", [[[id]]])
    }

    public static async deleteMany(ids: Array<number>): Promise<boolean> {
      return _execute("unlink", [[ids]])
    }

    public static async upsert(
      input: ModelSimpleSearchInput,
      payload: Record<string, any>
    ): Promise<
      { record: Record<string, any> } & (
        | { created: true; updated: false }
        | { created: false; updated: boolean }
      )
    > {
      const record = await Model.findOne({
        where: input.where,
        fields: { id: true },
      })

      if (!record?.id) {
        const id = await Model.create(payload)
        return {
          created: true,
          updated: false,
          record: {
            id,
            ...payload,
          },
        }
      }

      const updated = await Model.update(record.id, payload)

      return {
        created: false,
        updated,
        record: {
          id: record.id,
          ...payload,
        },
      }
    }

    // ============================ INSTANCE ============================
    public hasChanged(key?: string): boolean {
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

    public async decrement(
      ...keysMap: Array<string | { key: string; by: number }>
    ): Promise<boolean> {
      if (typeof this.__currentFields__.id !== "number")
        throw new Error(_notYetCreatedModelErrorMsg)

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
          if (isUpdated) this.__previousFields__ = { ...this.__currentFields__ }

          return isUpdated
        })
    }

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

    public async delete(): Promise<boolean> {
      if (typeof this.__currentFields__.id !== "number")
        throw new Error(_notYetCreatedModelErrorMsg)

      return _execute("unlink", [[[this.__currentFields__.id]]]).then(
        isDeleted => {
          if (isDeleted) this.__isDeleted__ = true
          return isDeleted
        }
      )
    }
  }
}
