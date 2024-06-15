import { Env, StreamStatus } from '@msafe/mpay-sdk-sui';

import { createStreamGroup, getIncomingStreams, setup } from '@/lib/mpay';
import { sleep } from '@/lib/utils';

async function createStreamGroupAndClaim() {
  const { mpay, wallet } = setup(Env.dev);

  // Create multiple streams, these stream will share the same group ID for backend for
  // indexing;
  const sg = await createStreamGroup(mpay, [await wallet.address(), await wallet.address()], wallet);
  console.log(`Created stream group [${sg.groupId}]: ${sg.streams.map((st) => st.streamId)}`);

  // Wait for backend to index and get incoming stream group.
  await sleep(5000);
  const incomings = await getIncomingStreams(mpay, { status: StreamStatus.STREAMING });
  if (incomings.length !== 1 || incomings[0]!.type !== 'StreamGroup') {
    throw new Error('stream group not expected');
  }

  // Wait for stream group to finish, and claim all stream reward.
  await sleep(0);
  for (let i = 0; i < sg.streams.length; i++) {
    const stream = sg.streams[i]!;
    const txb = await stream.claim();
    await wallet.signAndSubmitTransaction(txb);
  }

  // After claimed all, the stream group change to status COMPLETED
  await sg.refresh();
  console.log('After claim status:', sg.progress);
}

createStreamGroupAndClaim()
  .then(() => console.log('Demo finished'))
  .catch((e) => {
    console.error(`Demo exited with error: ${e}`);
  });
