# Installation

```sh
git clone https://github.com/dappelt/ilp-cmd-tool.git
npm install -g ./ilp-cmd-tool
```

This will install two command-line tools: `ilp` and `spsp`.

# Usage

There are two command-line tools included in this repo: `ilp` and `spsp`. `ilp` provides commands to serialize and deserialize an [ILP Packet](https://github.com/interledger/rfcs/blob/master/0003-interledger-protocol/0003-interledger-protocol.md#specification). `spsp` can be used to obtain an [SPSP quote](https://github.com/interledgerjs/ilp#spspquoteplugin-params--promisespsppayment). Execute `ilp -h` or `spsp -h` to display usage information for the respective command.

The output of `spsp` can be piped into `ilp` to serialize an ILP payment packet from a SPSP quote. For example:

```
$> spsp quote --source-amount 111 --address bob@wallet2.example | ilp serialize-payment
```

will output:

```
Packet: AYHKAAAAAzBhhks0dXMudXNkLndhbGxldDIuYm9iLmJhdWNhQmt3X2FnU3BydTVzZTlxWnlHZWZ4TWJKczFtZ4GKUFNLLzEuMApOb25jZTogMjJfaXRRWXk4VV9pZzhHOFh2U1kxZwpFbmNyeXB0aW9uOiBhZXMtMjU2LWdjbSBvUTZyZkVuc3hOejR0bllnYzJuYVhRCgrNTD4-4niV2ilVYvlZSkskVFSULEOREyh4YvoXfEZqMR_q_j0gL5O4ONIc7sK-o6rVb8GIAA
Condition: N-lforWFIZbtbL03I7rZqjThENT8arKQ05e2rU7Rlxc
```

On the first line is the base64url encoded ILP payment packet and on the second-line the corresponding SHA256 crypto-condition.
