'use strict'

const SPSP = require('ilp').SPSP
const FiveBellsLedgerPlugin = require('ilp-plugin-bells')

// read this from a file
const plugin = new FiveBellsLedgerPlugin({
  account: 'https://wallet1.example/ledger/accounts/alice',
  password: 'alice'
})

async function quote (sourceAmount, destinationAmount, spspAddress) {
  await plugin.connect()
  const quote = await SPSP.quote(plugin, {
    receiver: spspAddress,
    sourceAmount: sourceAmount,
    destinationAmount: destinationAmount
  })
  await plugin.disconnect()
  console.log(JSON.stringify(quote, null, 2))
  process.exit(0) // ilp-plugin-bells does not unregister all its handlers correctly
}

module.exports = {
  quote
}
