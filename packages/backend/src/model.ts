import { Executor } from "@graphql-tools/utils";
import { z } from "zod";
import { formSchema } from "./formSchema";
import { ValidatedMessage } from "./utils/signing";
import { CacheDependencies, Span } from "./utils/cache";
import { Snapshot } from "./snapshot";

export type OverallMetrics = {};

export type Address = {
  address: string;
};

export type ResolvedName = {
  address: string;
};

export type WrappedDelegate = {
  address: string;

  delegateStatementExists: boolean;
  underlyingDelegate?: any;
};

export type DelegateStatement = {
  address: string;
  values: z.TypeOf<typeof formSchema>;
};

export type StoredStatement = {
  address: string;
  signature: string;
  signedPayload: string;
  signatureType?: "EOA" | "CONTRACT";
  updatedAt: number;
};

export interface StatementStorage {
  addStatement(statement: StoredStatement): Promise<void>;
  getStatement(address: string): Promise<StoredStatement | null>;
  listStatements(): Promise<string[]>;
}

export interface EmailStorage {
  addEmail(verifiedEmail: ValidatedMessage): Promise<void>;
}

type SpanMap = {
  get(key: string): Span | undefined;
  set(key: string, span: Span): void;
};

export function makeNopSpanMap() {
  return {
    get(key: string): Span | undefined {
      return undefined;
    },

    set(key: string, span: Span) {},
  };
}

export type TracingContext = {
  spanMap: SpanMap;
  rootSpan: Span;
};

export type AgoraContextType = {
  snapshot: Snapshot;
  tracingContext: TracingContext;
  statementStorage: StatementStorage;
  cache: CacheDependencies;
  emailStorage: EmailStorage;
  nounsExecutor: Executor;
};
