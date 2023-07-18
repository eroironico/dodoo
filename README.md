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
const ResPartner = odoo.model("res.partner")

// ResPartner.create
// ResPartner.createMany
// ResPartner.findById
// ResPartner.findOne
// ResPartner.findMany
// ResPartner.update
// ResPartner.updateMany
// ResPartner.delete
// ResPartner.deleteMany
// ResPartner.count
// ResPartner.upsert

// Each model instance is a record of that model
const singlePartner = new ResPartner({ name: "Jhon" })

// You can modify records directly
singlePartner.email = "jhon@example.com"
;(async () => {
  // call hasChanged to know if a certain field has been changed since the first instantiation or the last `save` or `reload` call
  if (singlePartner.hasChanged("email"))
    await singlePartner.save() // call save to sync local values on odoo
  else await singlePartner.reload() // or reload to discard them and pull the latest values from odoo
})()

// singlePartner.hasChanged
// singlePartner.decrement
// singlePartner.increment
// singlePartner.save
// singlePartner.reload
// singlePartner.delete
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

  const AccountMove = odoo.model("account.move")

  const move = new AccountMove({
    // rest invoice
    invoice_line_ids: [
      Odoo.Command.create({
        // rest invoice line
        tax_ids: [Odoo.Command.set(1, 2, 3)],
      }),
    ],
  })

  await move.save()
})()
```

P.P.S.: The docs are implemented in a more detailed way as jsdocs

## License

[MIT](./LICENSE)
