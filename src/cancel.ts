import { Env } from '@msafe/mpay-sdk-sui';

import { createStream, setup } from '@/lib/mpay';
import { sleep } from '@/lib/utils';

async function createCancelStreamAndClaim() {
  const { mpay, wallet } = setup(Env.dev);

  // Create a stream last for 10s
  const stream = await createStream(mpay, await wallet.address(), wallet, { steps: 10n });

  // Cancel the stream before stream completes
  await sleep(1000);
  const cancelTxb = await stream.cancel();
  const cancelRes = await wallet.signAndSubmitTransaction(cancelTxb);
  console.log(`Cancel stream [${cancelRes.digest}]: ${cancelRes.effects!.status.status}`);

  await stream.refresh();
  console.log('After canceled, stream status: ', stream.progress.status);

  // The unclaimed part will be claimed
  const claimTxb = await stream.claim();
  const claimRes = await wallet.signAndSubmitTransaction(claimTxb);
  console.log(`Claim stream [${claimRes.digest}]: ${claimRes.effects!.status.status}`);
}

createCancelStreamAndClaim()
  .then(() => console.log('Demo finished'))
  .catch((e) => {
    console.error(`Demo exited with error: ${e}`);
  });
