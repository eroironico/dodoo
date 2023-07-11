import { InternalConfig, Config, ServerVersion, Model } from "./types"
import QueryParser from "./lib/query-parser"
import Command from "./lib/command"
import XMLRPCClient from "./lib/xmlrpc-client"
import modelGenerator from "./lib/model-generator"

class Odoo {
  public static QueryParser = QueryParser
  public static Command = Command

  private _host: string
  private _port: number
  private _secure: boolean
  private _xmlrpc: {
    common: XMLRPCClient
    object: XMLRPCClient
  }
  private _db: string
  private _username: string
  private _password: string
  private _uid: number | null = null
  private _modelsCache: Map<string, Model> = new Map()

  private set uid(uid: number) {
    this._uid = uid
    this._modelsCache.forEach(model => model.setUID(uid))
  }

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

    this._host = url.hostname
    this._secure = /https/.test(url.protocol)
    this._port = config.port || Number(url.port) || (this._secure ? 443 : 80)

    this._xmlrpc = {
      common: new XMLRPCClient(
        this._host,
        this._port,
        this._secure,
        "xmlrpc/2/common"
      ),
      object: new XMLRPCClient(
        this._host,
        this._port,
        this._secure,
        "xmlrpc/2/object"
      ),
    }

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

      this.uid = uid
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
    params: Array<any>,
    options?: Record<any, any>
  ): Promise<RT> {
    if (!this._uid)
      throw new Error("You must authenticate before accessing objects methods")

    const baseParams: Array<any> = [
      this._db,
      this._uid,
      this._password,
      model,
      method,
    ]
    baseParams.push(params)
    if (options) baseParams.push(options)

    return this._xmlrpc.object.call("execute_kw", baseParams)
  }

  /**
   * Call this method to get an instance of a single odoo model that implements the model base methods
   *
   * WARNINGS:
   * - Models are cached so only the first call will return a new instance, other calls will return the same instance
   * @param name Odoo model name
   * @returns A class for accessing `model` base methods
   */
  public model(name: string) {
    if (!this._modelsCache.has(name))
      this._modelsCache.set(
        name,
        modelGenerator(
          name,
          this._host,
          this._port,
          this._secure,
          this._db,
          this._uid,
          this._password
        ) as any
      )

    return this._modelsCache.get(name)!
  }
}

export = Odoo
