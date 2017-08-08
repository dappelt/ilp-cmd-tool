#!/usr/bin/env node
'use strict'

const app = require('./src/app')

const argv = require('yargs')
  .command({
    command: 'deserialize <packet> [file containing the receiver secret]',
    aliases: ['d'],
    desc: 'Deserialize a base64-encoded ILP packet.',
    handler: (argv) => {
      app.deserialize(argv.packet)
    }
  })
  .command({
    command: 'serialize <amount> <destination_account> <crypto_condition|spsp_endpoint>',
    aliases: ['s'],
    desc: 'Serialize a ILP packet for a given amount and destination.',
    handler: (argv) => {
      app.serialize(argv.amount, argv.destination_account)
    }
  })
  .demandCommand()
  .wrap(160)
  .help()
  .argv
