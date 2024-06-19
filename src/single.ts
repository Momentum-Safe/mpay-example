import { Env, Stream, StreamStatus } from '@msafe/mpay-sdk-sui';

import { claimAllStreams, createStream, getIncomingStreams, setup } from '@/lib/mpay';
import { sleep } from '@/lib/utils';

async function createSingleStreamAndClaim() {
  const { mpay, wallet } = setup(Env.dev);
  await claimAllStreams(mpay, wallet);

  // Create a stream, and wait for backend indexer
  const stream = await createStream(mpay, await wallet.address(), wallet);
  console.log('Created stream:', stream.streamId);

  // Wait for backend to index and get incoming streams
  await sleep(5000);
  const incomings = await getIncomingStreams(mpay, { status: StreamStatus.STREAMING });
  console.log(
    'Stream list:',
    incomings.map((st) => ({
      type: st.type,
      streamId: (st as Stream).streamId,
      status: st.info.progress,
    })),
  );

  // Wait for stream to finish, and claim all stream reward.
  await sleep(0);
  const claimTxb = await stream.claim();
  const claimRes = await wallet.signAndSubmitTransaction(claimTxb);
  console.log(`Claim result [${claimRes.digest}]: ${claimRes.effects!.status.status}`);

  // After claim, the status is changed to completed
  await stream.refresh();
  console.log(`After claim status: ${stream.info.progress.status}`);
}

createSingleStreamAndClaim()
  .then(() => console.log('Demo finished'))
  .catch((e) => {
    console.error(`Demo exited with error: ${e}`);
  });
