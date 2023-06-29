import XMLRPCClient from "./xmlrpc-client"

export default class EndpointsCollector<Endpoints extends Array<string>> {
  protected _xmlrpc: {
    [P in Endpoints[number]]: XMLRPCClient
  }

  protected constructor(
    protected _host: string,
    protected _port: number,
    protected _secure: boolean,
    endpoints: Endpoints
  ) {
    this._xmlrpc = Object.fromEntries(
      endpoints.map(endpoint => [
        endpoint,
        new XMLRPCClient(
          this._host,
          this._port,
          this._secure,
          `/xmlrpc/2/${endpoint}`
        ),
      ])
    ) as any
  }
}
