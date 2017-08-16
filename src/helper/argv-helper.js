'use strict'

function processArgv (argv) {
  if (!argv) return

  if (argv.insecure) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0' // disables certificate validation
  }
}

module.exports.processArgv = processArgv
