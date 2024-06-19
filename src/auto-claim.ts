import { Env } from '@msafe/mpay-sdk-sui';

import { claimAllStreams, createStream, setup } from '@/lib/mpay';
import { sleep } from '@/lib/utils';

async function autoClaimStream() {
  const { mpay, wallet } = setup(Env.dev);
  await claimAllStreams(mpay, wallet);

  // Create a stream, and wait for backend indexer
  const stream = await createStream(mpay, await wallet.address(), wallet);
  console.log('Created stream:', stream.streamId);

  // Set auto claim
  const sacTxb = await stream.setAutoClaim(true);
  const sacRes = await wallet.signAndSubmitTransaction(sacTxb);
  console.log(`Set auto claim result [${sacRes.digest}]: ${sacRes.effects!.status.status}`);

  // At this point, anyone is able to claim the stream for this user. Currently supported by MSafe
  // on mainnet every 1 hours. This will cost extra 0.25% fees.
  // mpay.connectSingleWallet(otherWallet);
  await sleep(2000);
  const autoClaimTxb = await stream.claimByProxy();
  const acRes = await wallet.signAndSubmitTransaction(autoClaimTxb);
  console.log(`Claim by proxy result [${acRes.digest}]: ${acRes.effects!.status.status}`);
}

autoClaimStream()
  .then(() => console.log('Demo finished'))
  .catch((e) => {
    console.error(`Demo exited with error: ${e}`);
  });
