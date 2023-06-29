import xmlrpc from "xmlrpc"

export default class XMLRPCClient {
  private _client: xmlrpc.Client

  constructor(host: string, port: number, secure: boolean, path: string) {
    const options = {
      host,
      port,
      path,
    }

    this._client = secure
      ? xmlrpc.createSecureClient(options)
      : xmlrpc.createClient(options)
  }

  public async call<RT = any>(method: string, params: Array<any>): Promise<RT> {
    return new Promise((resolve, reject) =>
      this._client.methodCall(method, params, (e, v) =>
        e ? reject(e) : resolve(v)
      )
    )
  }
}
