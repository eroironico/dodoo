# dodoo

This package offers a painless implementation of odoo xmlrpc api in javascript

## Installation

Install the plugin from npm:

```sh
npm install dodoo
```

Then import the main class:

```js
// with "esModuleInterop"
import Odoo from "dodoo"
// or without
import * as Odoo from "dodoo"
// or just
const Odoo = require("dodoo")
```

## Usage

Instantiate the main class:

```js
const odoo = new Odoo({
  url: process.env.ODOO_URL,
  db: process.env.ODOO_DB,
  username: process.env.ODOO_USERNAME,
  password: process.env.ODOO_PASSWORD,
})
```

From that instance you can call these methods:

- **version**: Returns the server version (doesn't require to be authenticated so you can call it, for example, to verify the status of the server and configuration)
- **authenticate**: This method is needed in order to acccess objects on your odoo server, consider a best practice to call it first than every other method
- **executeKw**: This method offer a way to access every model
- **model**: This method instantiate a helper classes to access models on odoo

`version`, `authenticate` and `executeKw` (execute_kw) are documented on Odoo, while for `model`:

```js
const ResPartnerModel = odoo.model("res.partner")

// ResPartnerModel.search
// ResPartnerModel.searchCount
// ResPartnerModel.read
// ResPartnerModel.searchRead
// ResPartnerModel.create
// ResPartnerModel.update
// ResPartnerModel.delete
```

P.S.: if, when creating or updating records, you need to pass a value for a `One2Many` or a `Many2Many` field you can use `Command` which exposes some utility methods to handle them.

Full example:

```js
import Odoo from "dodoo"

const odoo = new Odoo({
  url: process.env.ODOO_URL,
  db: process.env.ODOO_DB,
  username: process.env.ODOO_USERNAME,
  password: process.env.ODOO_PASSWORD,
})

;(async () => {
  await odoo.authenticate()

  const AccountMoveModel = odoo.model("account.move")

  const moveId = await AccountMoveModel.create({
    // rest
    invoice_line_ids: Odoo.Command.create({
      // invoice line object
    }),
  })
})()
```

P.P.S.: The docs are implemented in a more detailed way as jsdocs

## License

[MIT](./LICENSE)
