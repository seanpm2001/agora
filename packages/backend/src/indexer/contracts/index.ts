import { IndexerDefinition } from "../process";

import { nounsTokenIndexer } from "./NounsToken";
import { governorIndexer } from "./NounsDAO";
import { alligatorIndexer } from "./Alligator";

export const indexers: IndexerDefinition[] = [
  // @ts-ignore
  nounsTokenIndexer,
  // @ts-ignore
  governorIndexer,
  // @ts-ignore
  alligatorIndexer,
];

export function getIndexerByName(indexers: IndexerDefinition[], name: string) {
  const indexer = indexers.find((it) => it.name === name);
  if (!indexer) {
    throw new Error(
      `${indexer} not found, possible options ${indexers
        .map((indexer) => indexer.name)
        .join(", ")}`
    );
  }

  return indexer;
}
