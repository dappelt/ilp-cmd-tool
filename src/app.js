'use strict'

const inquirer = require('inquirer')
const ilpPacket = require('ilp-packet')
const ilp = require('ilp')
const psk = require('./helper/psk')

module.exports.deserialize = async function (packet, apiSecret) {
  const binaryPacket = Buffer.from(packet, 'base64')
  let jsonPacket = ilpPacket.deserializeIlpPacket(binaryPacket)
  const binaryData = Buffer.from(jsonPacket.data.data, 'base64')

  if (psk.isPsk(binaryData)) {
    // if (!apiSecret && jsonPacket.publicHeaders.encryption === 'aes-256-gcm') {
    if (!apiSecret) {
      // promt user for API secret
      try {
        const resp = await inquirer.prompt([{
          type: 'input',
          name: 'api_secret',
          message: 'The packet contains encrypted PSK data. What is the receiver secret (API_SECRET)?'
        }])
        apiSecret = resp.api_secret
      } catch (err) {
        console.log(err)
      }
    }

    // re-compute the sharedSecret used as encryption key as defined in the PSK spec
    const account = jsonPacket.data.account
    const receiver = account.slice(0, account.lastIndexOf('.'))
    const token = account.slice(account.lastIndexOf('.') + 1).slice(11)
    const receiverSecret = psk.generateReceiverSecret(apiSecret, receiver)
    const sharedSecret = psk.getPskSharedSecret(receiverSecret, Buffer.from(token, 'base64'))
    const pskData = ilp.PSK.parsePacketAndDetails({packet: binaryPacket, secret: sharedSecret})

    // account and amount are already in the ILP packet
    delete pskData.account
    delete pskData.amount

    if (pskData.headers && pskData.headers['content-type'] === 'application/json') {
      pskData.data = pskData.data.toString()
    }
    jsonPacket.data.data = pskData
  }

  console.log(JSON.stringify(jsonPacket, null, 2))
}

module.exports.serialize = (data) =>  {

}
