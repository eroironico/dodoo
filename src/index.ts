import Model from "./lib/model"
import EndpointsCollector from "./lib/endpoints-collector"
import Op from "./lib/op"
import { InternalConfig, Config, ServerVersion } from "./types"
import QueryParser from "./lib/query-parser"

class Odoo extends EndpointsCollector<["common", "object"]> {
  public static Op = Op
  public static QueryParser = QueryParser

  private _db: string
  private _username: string
  private _password: string
  private _uid: number | null = null
  private _modelsCache: Map<string, Model> = new Map()

  /**
   * This is the config used internally (watchout as it exposes the password)
   */
  public get config(): InternalConfig {
    return {
      host: this._host,
      port: this._port,
      secure: this._secure,
      db: this._db,
      username: this._username,
      password: this._password,
    }
  }

  public get isConnected(): boolean {
    return !!this._uid
  }

  constructor(config: Config) {
    const url =
      typeof config.url === "string" ? new URL(config.url) : config.url

    const host = url.hostname,
      secure = /https/.test(url.protocol),
      port = config.port || Number(url.port) || (secure ? 443 : 80)

    super(host, port, secure, ["common", "object"])

    this._db = config.db
    this._username = config.username
    this._password = config.password
  }

  /**
   * This method to can be called to verify if the connection information is correct before trying to authenticate or to get server info
   * @returns Server version
   */
  public async version(): Promise<ServerVersion> {
    return this._xmlrpc.common.call("version", [])
  }

  /**
   * This method authenticates requests that need authentication
   * @returns The user identifier
   */
  public async authenticate(): Promise<number> {
    try {
      const uid = await this._xmlrpc.common.call("authenticate", [
        this._db,
        this._username,
        this._password,
        {},
      ])
      if (!uid) throw new Error("No UID returned from authentication")

      this._uid = uid
      return this._uid!
    } catch (e) {
      throw e
    }
  }

  /**
   * This method is used as a generic interface to call methods of odoo models
   * @param model The model on which to call `method`
   * @param method The `model` method to call
   * @param params The `method` parameters (if any)
   */
  public async executeKw<RT = any>(
    model: string,
    method: string,
    params: Array<any> = []
  ): Promise<RT> {
    if (!this._uid)
      throw new Error(
        "You must call the connect method before accessing objects methods"
      )

    return this._xmlrpc.object.call(
      "execute_kw",
      // ? .concat(params) should be .concat([params]) || it can be made better with .concat([params, options])
      [this._db, this._uid, this._password, model, method].concat(params)
    )
  }

  /**
   * Call this method to get an instance of a single odoo model that implements the model base methods
   *
   * WARNINGS:
   * - Since all models share and need the same `uid` you must call `authenticate` before any call to this method
   * - Models are cached so only the first call will return a new instance, other calls will return the same instance
   * @param name Odoo model name
   * @returns A class augmenting `model` base methods
   */
  public model(name: string): Model {
    if (!this._uid)
      throw new Error(
        "You must authenticate before instantiating a model instance"
      )

    if (!this._modelsCache.has(name))
      this._modelsCache.set(
        name,
        new Model(
          this._host,
          this._port,
          this._secure,
          this._db,
          this._uid,
          this._password,
          name
        )
      )

    return this._modelsCache.get(name)!
  }
}

export = Odoo
