import { Resolvers } from "./resolvers/generated/types";
import * as snapshotResolvers from "./resolvers/snapshot";
import * as scalars from "./resolvers/scalars";
import * as commonResolvers from "./resolvers/common";
import * as governanceResolvers from "./resolvers/governance";
import * as delegateStatement from "./resolvers/delegateStatement";
import { attachTracingContextInjection } from "./transformers/tracingContext";
import { applyIdPrefix } from "./transformers/applyIdPrefix";
import { makeExecutableSchema } from "@graphql-tools/schema";

// todo: fix loader for this
const schema = `
scalar BigInt
scalar Timestamp

type Query {
  delegate(addressOrEnsName: String!): Delegate

  delegates(
    where: DelegatesWhere
    orderBy: DelegatesOrder! = mostRelevant
    first: Int!
    after: String
  ): DelegatesConnection!

  proposal(id: ID!): Proposal!
  proposals: [Proposal!]!

  metrics: Metrics!
}

type Delegate {
  id: ID!
  address: Address!

  # Delegate where voting power has been delegated. Can be delegated to a
  # delegate with the same address as the account.
  # delegatingTo: Delegate!

  statement: DelegateStatement

  amountOwned: VotingPower!
  tokensRepresented: VotingPower!

  delegateMetrics: DelegateMetrics!
  proposed: [Proposal!]!

  votes: [Vote!]!
  snapshotVotes: [SnapshotVote!]!
}

type Address {
  resolvedName: ResolvedName!
  isContract: Boolean!
}

type DelegateStatement {
  statement: String!
  summary: String
  topIssues: [TopIssue!]!
  mostValuableProposals: [Proposal!]!
  leastValuableProposals: [Proposal!]!
  twitter: String!
  discord: String!
  openToSponsoringProposals: Boolean
}

type ResolvedName {
  address: ID!
  name: String
}

type DelegateMetrics {
  totalVotes: Int!
  forVotes: Int!
  againstVotes: Int!
  abstainVotes: Int!
  ofLastTenProps: Int!
  ofTotalProps: Int!
  proposalsCreated: Int!
  tokenHoldersRepresentedCount: Int!
}

type Metrics {
  delegatedSupply: TokenAmount!
  totalSupply: TokenAmount!

  quorum: VotingPower!

  proposalThreshold: VotingPower!
}

type Vote {
  id: ID!
  reason: String!
  # todo: this should be an enum
  supportDetailed: Int!
  votes: VotingPower!

  proposal: Proposal!
  voter: Delegate!
  transaction: Transaction!
}

type Transaction {
  id: ID!
  hash: String!
  block: Block!
}

type Block {
  id: ID!
  number: BigInt!

  timestamp: Timestamp!
}

type TokenAmount {
  amount: BigInt!
  currency: String!
  decimals: Int!
}

type VotingPower {
  amount: TokenAmount!

  bpsOfQuorum: Int!
  bpsOfTotal: Int!
}

type SnapshotVote {
  id: ID!
  choice: SnapshotVoteChoice!
  votingPower: Float!
  proposal: SnapshotProposal!
  createdAt: Timestamp!
  reason: String!
}

union SnapshotVoteChoice =
    SnapshotVoteChoiceApproval
  | SnapshotVoteChoiceRanked
  | SnapshotVoteChoiceSingle
  | SnapshotVoteChoiceQuadratic
  | SnapshotVoteChoiceWeighted

type SnapshotVoteChoiceApproval {
  approvedChoices: [Int!]!
}

type SnapshotVoteChoiceRanked {
  choices: [Int!]!
}

type SnapshotVoteChoiceSingle {
  selectedChoiceIdx: Int!
}

type SnapshotVoteChoiceQuadratic {
  weights: [WeightedSelectedChoice!]!
}

type SnapshotVoteChoiceWeighted {
  weights: [WeightedSelectedChoice!]!
}

type WeightedSelectedChoice {
  choiceIdx: Int!
  weight: Int!
}

type SnapshotProposal {
  id: ID!
  title: String!
  link: String!
  choices: [ProposalChoice!]!
}

type ProposalChoice {
  title: String!
  score: Float!
}

type TopIssue {
  type: String!
  value: String!
}

enum DelegatesWhere {
  withStatement
  withoutStatement
}

enum DelegatesOrder {
  mostVotingPower
  mostDelegates
}

type DelegatesConnection {
  pageInfo: PageInfo!
  edges: [DelegatesEdge!]!
}

type DelegatesEdge {
  node: Delegate!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

scalar Bytes

type Proposal {
  id: ID!
  number: BigInt!

  forVotes: BigInt!
  againstVotes: BigInt!
  abstainVotes: BigInt!

  title: String!
  description: String!

  voteEndsAt: Int!
  voteStartsAt: Int!
  quorumVotes: BigInt!
  totalVotes: BigInt!
  votes: [Vote!]!

  targets: [Bytes!]
  values: [BigInt!]
  signatures: [String!]
  calldatas: [Bytes!]

  status: ProposalStatus!

  totalValue: BigInt!

  proposer: Delegate!
}

enum ProposalStatus {
  PENDING
  ACTIVE
  CANCELLED
  VETOED
  QUEUED
  EXECUTED
  DEFEATED
  EXPIRED
}

type Mutation {
  createNewDelegateStatement(data: CreateNewDelegateStatementData!): Delegate!
}

input CreateNewDelegateStatementData {
  statement: ValueWithSignature!
  email: ValueWithSignature
}

input ValueWithSignature {
  # Address of the signer, this is used for logging and so we can implement
  # gnosis wallet multi-sig signature verification.
  signerAddress: String!
  value: String!
  signature: String!
}
`;

// @ts-ignore
export const resolvers: Resolvers = {
  ...snapshotResolvers,
  ...governanceResolvers,
  ...scalars,
  ...commonResolvers,
  ...delegateStatement,
};

export function makeGatewaySchema() {
  return attachTracingContextInjection(
    applyIdPrefix(
      makeExecutableSchema({
        typeDefs: schema,

        resolvers,
      })
    )
  );
}
