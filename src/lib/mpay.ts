import {
  CreateStreamInfo,
  Env,
  IncomingStreamQuery,
  IStream,
  IStreamGroup,
  MPayClient,
  StreamGroup,
} from '@msafe/mpay-sdk-sui';
import { SUI_TYPE_ARG } from '@mysten/sui.js/utils';

import { LocalWallet } from '@/lib/wallet';

export function setup(network: Env = Env.dev) {
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

export async function createStream(
  mpay: MPayClient,
  recipient: string,
  wallet: LocalWallet,
  overrideOptions?: Partial<CreateStreamInfo>,
) {
  const txb = await mpay.createStream({
    name: 'sdk-test',
    coinType: SUI_TYPE_ARG,
    recipients: [
      {
        address: recipient,
        cliffAmount: 5000n,
        amountPerStep: 400n,
      },
    ],
    interval: 1000n, // 1 seconds
    steps: 2n, // 2 seconds in total
    startTimeMs: BigInt(new Date().getTime()),
    cancelable: true,
    ...overrideOptions,
  });
  const res = await wallet.signAndSubmitTransaction(txb);
  console.log(`Create stream transaction ${res.digest}: ${res.effects!.status.status}`);
  const createdStreamIds = mpay.helper.getStreamIdsFromCreateStreamResponse(res);
  if (createdStreamIds.length !== 1) {
    throw new Error('created stream not length 1');
  }

  return mpay.getStream(createdStreamIds[0]!);
}

export async function createStreamGroup(
  mpay: MPayClient,
  recipients: string[],
  wallet: LocalWallet,
  overrideOptions?: Partial<CreateStreamInfo>,
) {
  const txb = await mpay.createStream({
    name: 'sdk-test',
    coinType: SUI_TYPE_ARG,
    recipients: recipients.map((recipient) => ({
      address: recipient,
      cliffAmount: 5000n,
      amountPerStep: 400n,
    })),
    interval: 1000n, // 1 seconds
    steps: 2n, // 2 seconds in total
    startTimeMs: BigInt(new Date().getTime()),
    cancelable: true,
    ...overrideOptions,
  });
  const res = await wallet.signAndSubmitTransaction(txb);
  console.log(`Create stream transaction ${res.digest}: ${res.effects!.status.status}`);
  const createdStreamIds = mpay.helper.getStreamIdsFromCreateStreamResponse(res);
  if (createdStreamIds.length !== recipients.length) {
    throw new Error(`created stream number not expected: ${createdStreamIds.length} !== ${recipients.length}`);
  }
  return StreamGroup.new(mpay.globals, createdStreamIds);
}

export async function getIncomingStreams(mpay: MPayClient, query?: IncomingStreamQuery) {
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
