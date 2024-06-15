# mpay-example

Example repo for MPay SDK.

## Installation

```shell
yarn
```

Set up private key for test. Currently it's base64 encoding of the private key along
with the signing schema flag. Only ED25519 is supported. Please modify file `makeKeyPairFromPrivateKey`
function as needed.

```shell
export SUI_PRIVATE_KEY=${YOUR_PRIVATE_KEY}
```

## Demo scripts

### Create single stream 

This will create a single stream and claim the stream.

File location: src/single.ts

```shell
yarn demo:single-stream
```

### Create stream group

Create a stream group and claim the stream.

File location: src/group.ts

```shell
yarn demo:stream-group
```

### Cancel stream

Create a stream, cancel the stream, and claim the unclaimed amount.

File location: src/cancel.ts

```shell
yarn demo:cancel-stream
```

### Auto claim

Create a stream, set auto claim to be true, and claim the stream by any signer.

File location: auto-claim.ts

```shell
yarn demo:auto-claim
```

## TODO

1. Build with programmable transaction block to enable composability (E.g. create and set auto claim in one transaction).
2. Discuss and design more mechanism for indexing and auto-claim feature. 

