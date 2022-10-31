import { ethers } from "ethers";
import { filterForEventHandlers, makeReducers } from "../snapshot";
import { getAllLogs } from "../events";
import { promises as fs } from "fs";

async function main() {
  const provider = new ethers.providers.AlchemyProvider(
    "mainnet",
    process.env.ALCHEMY_API_KEY
  );

  const reducers = makeReducers();

  const latestBlockNumber = await provider.getBlockNumber();

  for (const reducer of reducers) {
    const filter = filterForEventHandlers(
      reducer,
      reducer.eventHandlers.map((event) => event.signature)
    );

    const handle = await fs.open(`${reducer.name}.logs.json`, "a+");

    for await (const logs of getAllLogs(
      provider,
      filter,
      latestBlockNumber,
      reducer.startingBlock
    )) {
      for (const log of logs) {
        await handle.write(JSON.stringify(log) + "\n");
      }
    }

    await handle.close();
  }
}

main();
