'use strict'

const parseHeaders = require('parse-headers')
const crypto = require('crypto')

const PSK_PREAMBLE_BUFFER = Buffer.from('PSK/1.0\n', 'ascii')
const DOUBLE_NEWLINE_BUFFER = Buffer.from('\n\n', 'ascii')

const PSK_GENERATION_STRING = 'ilp_psk_generation'
const SHARED_SECRET_LENGTH = 16

function isPsk (data) {
  return PSK_PREAMBLE_BUFFER.compare(data, 0, PSK_PREAMBLE_BUFFER.length) === 0
}

function hmac (key, message) {
  const h = crypto.createHmac('sha256', key)
  h.update(message, 'utf8')
  return h.digest()
}

module.exports.parsePsk = function (data) {
  if (!isPsk(data)) {
    throw new Error('Data does not start with PSK preamble')
  }

  const endOfHeaders = data.indexOf(DOUBLE_NEWLINE_BUFFER)
  const headersString = data.slice(PSK_PREAMBLE_BUFFER.length, endOfHeaders).toString('utf8')
  console.log('headersString', headersString)
  const headers = parseHeaders(headersString)
  const content = data.slice(endOfHeaders + DOUBLE_NEWLINE_BUFFER.length)

  return { headers, headersString, content }
}

module.exports.generateReceiverSecret = function (apiSecret, destinationAccount) {
  return hmac(apiSecret, destinationAccount)
}

// hmacKey = receiverSecret
module.exports.getPskSharedSecret = function (hmacKey, token) {
  const generator = hmac(hmacKey, PSK_GENERATION_STRING)
  return hmac(generator, token).slice(0, SHARED_SECRET_LENGTH)
}

module.exports.isPsk = isPsk
