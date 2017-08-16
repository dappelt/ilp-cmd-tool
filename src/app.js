'use strict'

const inquirer = require('inquirer')
const ilpPacket = require('ilp-packet')
const ilp = require('ilp')
const BigNumber = require('bignumber.js')

const psk = require('./helper/psk')
const assert = require('assert')
const base64url = require('./helper/base64url')

async function _deserialize (packet, apiSecret) {
  const binaryPacket = Buffer.from(packet, 'base64')
  let jsonPacket = {}
  try {
    jsonPacket = ilpPacket.deserializeIlpPacket(binaryPacket)
  } catch (err) {
    _exit(1, 'Deserialization error:', err.message)
  }
  const binaryData = Buffer.from(jsonPacket.data.data, 'base64')

  if (binaryData.length && psk.isPsk(binaryData)) {
    let pskData = {}

    const parsedData = psk.parsePsk(binaryData)
    pskData.publicHeaders = parsedData.headers
    pskData.data = parsedData.content.toString('hex')

    if (pskData.publicHeaders.encryption.startsWith('aes-256-gcm')) {
      if (!apiSecret) {
        const resp = await inquirer.prompt([{
          type: 'password',
          name: 'api_secret',
          message: 'The packet contains encrypted PSK data. What is the receiver secret (API_SECRET)?'
        }])
        apiSecret = resp.api_secret
      }

      // re-compute the sharedSecret used as encryption key as defined in the PSK spec
      const account = jsonPacket.data.account
      const receiver = account.slice(0, account.lastIndexOf('.'))
      const token = account.slice(account.lastIndexOf('.') + 1).slice(11)
      const receiverSecret = psk.generateReceiverSecret(apiSecret, receiver)
      const sharedSecret = psk.getPskSharedSecret(receiverSecret, Buffer.from(token, 'base64'))

      try {
        const decryptedData = (ilp.PSK.parsePacketAndDetails({packet: binaryPacket, secret: sharedSecret}))
        pskData.privateHeaders = decryptedData.headers
        pskData.data = decryptedData.data

        if (pskData.privateHeaders && pskData.privateHeaders['content-type'] === 'application/json') {
          pskData.data = JSON.parse(pskData.data)
        }
      } catch (err) {
        console.log('Error decrypting PSK data:', err.message)
      }
    }
    jsonPacket.data.data = pskData
  }

  console.log(JSON.stringify(jsonPacket, null, 2))
}

async function deserialize (packet, apiSecret) {
  try {
    await _deserialize(packet, apiSecret)
  } catch (err) {
    _exit(1, 'Unexpected error: ' + err.message)
  }
}

function _paymentFromQuote (quoteResponse) {
  const toInteger = (d, s) => (new BigNumber(d)).shift(s).round().toString()

  const data = JSON.stringify(quoteResponse.memo || {})
  const destinationScale = quoteResponse.spsp.ledger_info.currency_scale
  const integerDestinationAmount =
    toInteger(quoteResponse.destinationAmount, destinationScale)

  const { packet, condition } = ilp.PSK.createPacketAndCondition({
    sharedSecret: Buffer.from(quoteResponse.spsp.shared_secret, 'base64'),
    destinationAmount: integerDestinationAmount,
    destinationAccount: quoteResponse.destinationAccount,
    publicHeaders: quoteResponse.publicHeaders,
    headers: Object.assign({
      'Content-Length': data.length,
      'Content-Type': 'application/json'
    }, quoteResponse.headers),
    disableEncryption: quoteResponse.disableEncryption,
    data: Buffer.from(data, 'utf8')
  })

  console.log('Packet:', packet)
  console.log('Condition:', condition)
}

function _serializePayment (amount, destination, data) {
  assert(destination, 'Destination address is required')

  // do PSK stuff here to get an ILP packet and matching condition

  const packet = ilpPacket.serializeIlpPayment({
    amount: amount.toString(),
    account: destination,
    data
  })
  console.log(base64url(packet))
}

function serializePayment (stdin, argv) {
  if (stdin && (argv.amount || argv.destination || argv.data)) {
    _exit(1, 'Provide input either on stdin or as command option.')
  }

  try {
    if (stdin) {
      const quoteResp = JSON.parse(stdin)
      _paymentFromQuote(quoteResp)
    } else {
      _serializePayment(argv.amount, argv.destination, argv.data)
    }
  } catch (err) {
    _exit(1, err.message)
  }
}

function _exit (code, msg) {
  msg && console.error(msg)
  process.exit(code)
}

module.exports.deserialize = deserialize
module.exports.serializePayment = serializePayment
