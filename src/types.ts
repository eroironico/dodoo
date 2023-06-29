export type OdooConfig = {
  url: URL | string
  port?: number
  db: string
  username: string
  password: string
}

export type InternalConfig = {
  host: string
  port: number
  secure: boolean
  db: string
  username: string
  password: string
}

export type OdooServerVersion = {
  server_version: string
  server_version_info: Array<string | number>
  server_serie: string
  protocol_version: number
}
