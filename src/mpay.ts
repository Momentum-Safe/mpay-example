import { Env, IncomingStreamQuery, IStream, IStreamGroup, MPayClient, OutgoingStreamQuery } from '@msafe/mpay-sdk-sui';
import { SUI_TYPE_ARG } from '@mysten/sui.js/utils';

import { sleep } from '@/utils';
import { LocalWallet } from '@/wallet';

function setup(network: Env = Env.dev) {
  const mpay = new MPayClient(network);
  const sui = mpay.globals.suiClient;

  const pk = process.env.SUI_PRIVATE_KEY;
  if (!pk) {
    console.error(`Please set the private key with env. The private key is in format in $HOME/.sui/sui_config/sui.keystore file.
    
  export SUI_PRIVATE_KEY=\${YOUR_PRIVATE_KEY}
`);
    throw new Error('Missing private key from env');
  }
  const wallet = new LocalWallet(sui, pk);

  mpay.connectSingleWallet(wallet);

  return {
    mpay,
    wallet,
  };
}

async function createStream(mpay: MPayClient, recipients: string[], wallet: LocalWallet) {
  const txb = await mpay.createStream({
    name: 'sdk-test',
    coinType: SUI_TYPE_ARG,
    recipients: recipients.map((recipient) => ({
      address: recipient,
      cliffAmount: 5000n,
      amountPerStep: 400n,
    })),
    interval: 1000n, // 1 seconds
    steps: 2n, // 10 seconds in total
    startTimeMs: BigInt(new Date().getTime()),
    cancelable: true,
  });
  const res = await wallet.signAndSubmitTransaction(txb);
  console.log(`Create stream transaction ${res.digest}: ${res.effects!.status.status}`);
  const createdStreamIds = mpay.helper.getStreamIdsFromCreateStreamResponse(res);
  if (createdStreamIds.length !== 1) {
    throw new Error('created stream not length 1');
  }

  return mpay.getStream(createdStreamIds[0]!);
}

async function getIncomingStreams(mpay: MPayClient, query?: IncomingStreamQuery) {
  const iter = await mpay.getIncomingStreams(query);
  const streams: (IStream | IStreamGroup)[] = [];

  while (await iter.hasNext()) {
    const st = await iter.next();
    if (!st) {
      break;
    }
    streams.push(...st);
  }
  return streams;
}

async function getOutgoingStream(mpay: MPayClient, query?: OutgoingStreamQuery) {
  const iter = await mpay.getOutgoingStreams(query);
  const streams: (IStream | IStreamGroup)[] = [];

  while (await iter.hasNext()) {
    const st = await iter.next();
    if (!st) {
      break;
    }
    streams.push(...st);
  }
  return streams;
}

async function main() {
  const { mpay, wallet } = setup(Env.dev);

  // Create a stream, and wait for backend indexer
  const stream = await createStream(mpay, [await wallet.address()], wallet);
  console.log(stream.streamId);

  // Wait for stream to finish, and claim all stream reward.
  await sleep(2000);
  // const claimTxb = await stream.claim();
  // const res;
}

main()
  .then(() => console.log('Demo finished'))
  .catch((e) => {
    console.error(`Process exited with error: ${e}`);
  });
