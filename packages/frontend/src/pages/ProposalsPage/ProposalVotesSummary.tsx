import { formatDistanceToNowStrict, formatISO9075 } from "date-fns";
import { HStack, VStack } from "../../components/VStack";
import { ProposalVotesSummaryFragment$key } from "./__generated__/ProposalVotesSummaryFragment.graphql";
import { ProposalVotesSummaryVoteTimeFragment$key } from "./__generated__/ProposalVotesSummaryVoteTimeFragment.graphql";
import graphql from "babel-plugin-relay/macro";
import * as theme from "../../theme";
import { useFragment } from "react-relay";
import { colorForSupportType } from "../DelegatePage/VoteDetailsContainer";
import { css, cx } from "@emotion/css";
import { ProposalVotesSummaryVotesBarFragment$key } from "./__generated__/ProposalVotesSummaryVotesBarFragment.graphql";

export function ProposalVotesSummary({
  fragmentRef,
  className,
}: {
  fragmentRef: ProposalVotesSummaryFragment$key;
  className: string;
}) {
  const proposal = useFragment(
    graphql`
      fragment ProposalVotesSummaryFragment on Proposal {
        forVotes {
          amount
        }
        againstVotes {
          amount
        }
        quorumVotes {
          amount
        }

        ...ProposalVotesSummaryVotesBarFragment
        ...ProposalVotesSummaryVoteTimeFragment
      }
    `,
    fragmentRef
  );
  return (
    <VStack
      gap="2"
      className={cx(
        css`
          font-weight: ${theme.fontWeight.semibold};
        `,
        className
      )}
    >
      <HStack
        justifyContent="space-between"
        className={css`
          margin-top: ${theme.spacing[2]};
        `}
      >
        <div
          className={css`
            color: ${colorForSupportType("FOR")};
          `}
        >
          FOR {proposal.forVotes.amount}
        </div>
        <div
          className={css`
            color: ${colorForSupportType("AGAINST")};
          `}
        >
          AGAINST {proposal.againstVotes.amount}
        </div>
      </HStack>
      <VotesBar fragmentRef={proposal} />
      <HStack
        justifyContent="space-between"
        className={css`
          color: ${theme.colors.gray["4f"]};
        `}
      >
        <div>QUORUM {proposal.quorumVotes.amount}</div>
        <VoteTime fragmentRef={proposal} />
      </HStack>
    </VStack>
  );
}

function VoteTime({
  fragmentRef,
}: {
  fragmentRef: ProposalVotesSummaryVoteTimeFragment$key;
}) {
  const result = useFragment(
    graphql`
      fragment ProposalVotesSummaryVoteTimeFragment on Proposal {
        voteStartsAt
        voteEndsAt
      }
    `,
    fragmentRef
  );
  const now = Date.now();

  let voteTime;
  let voteTextPrefix;
  // Display time until vote start if vote hasn't started yet.
  if (result.voteStartsAt > now) {
    voteTextPrefix = "VOTE STARTS IN";
    voteTime = new Date(result.voteStartsAt);
  } else {
    voteTime = new Date(result.voteEndsAt);
    if (result.voteEndsAt > now) {
      voteTextPrefix = "VOTE ENDS IN";
    } else {
      voteTextPrefix = "VOTE ENDED";
    }
  }

  const ago = formatDistanceToNowStrict(voteTime, { addSuffix: true });
  const text = `${voteTextPrefix} ${ago}`;
  return <span title={formatISO9075(voteTime)}>{text}</span>;
}

function VotesBar({
  fragmentRef,
}: {
  fragmentRef: ProposalVotesSummaryVotesBarFragment$key;
}) {
  const { forVotes, againstVotes, abstainVotes } = useFragment(
    graphql`
      fragment ProposalVotesSummaryVotesBarFragment on Proposal {
        forVotes {
          amount
        }
        againstVotes {
          amount
        }
        abstainVotes {
          amount
        }
      }
    `,
    fragmentRef
  );
  const colors = [
    colorForSupportType("FOR"),
    colorForSupportType("ABSTAIN"),
    colorForSupportType("AGAINST"),
  ];
  const bars = roundMaintainSum(
    [forVotes.amount, abstainVotes.amount, againstVotes.amount],
    57
  );

  return (
    <HStack justifyContent="space-between">
      {bars.map((barCount, idx) =>
        Array.from({ length: barCount }, (_, idy) => (
          <div
            key={`${idx}-${idy}`}
            className={css`
              background: ${colors[idx]};
              border-radius: ${theme.borderRadius.full};
              width: 2px;
              height: 12px;
            `}
          />
        ))
      )}
    </HStack>
  );
}

function roundMaintainSum(numberStrings: string[], base: number) {
  // Round numbers to integers while maintaining the sum
  // Generated by copilot
  const numbers = numberStrings.map((s) => parseInt(s));
  const sum = numbers.reduce((a, b) => a + b, 0);
  if (sum === 0) {
    // When sum is 0, just set all bars to gray
    return numbers.map((_, idx) => (idx === 1 ? base : 0));
  }
  const rounded = numbers.map((n) => Math.round((n * base) / sum));
  const roundedSum = rounded.reduce((a, b) => a + b, 0);
  const diff = base - roundedSum;
  for (let i = 0; i < diff; i++) {
    rounded[i] += 1;
  }
  return rounded;
}
