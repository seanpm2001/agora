import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { css } from "@emotion/css";
import * as theme from "../../theme";
import { VoteDetailsFragment$key } from "./__generated__/VoteDetailsFragment.graphql";
import { VStack } from "../../components/VStack";
import {
  colorForSupportType,
  toSupportType,
  ValuePart,
  VoteDetailsContainer,
  VoteTitle,
} from "./VoteDetailsContainer";
import { pluralizeVote } from "../../words";
import { BigNumber } from "ethers";
import { formatDistanceToNow } from "date-fns";

type Props = {
  voteFragment: VoteDetailsFragment$key;
};

export function parseCreatedAt(raw: string) {
  return new Date(Number(raw) * 1000);
}

export function VoteDetails({ voteFragment }: Props) {
  const vote = useFragment(
    graphql`
      fragment VoteDetailsFragment on Vote {
        reason
        supportDetailed
        votes
        createdAt

        proposal {
          number
          title

          totalValue
          proposer {
            resolvedName {
              ...NounResolvedLinkFragment
            }
          }
        }
      }
    `,
    voteFragment
  );
  const proposalHref = `https://nouns.wtf/vote/${vote.proposal.number}`;

  const supportType = toSupportType(vote.supportDetailed);

  return (
    <VoteDetailsContainer>
      <div
        className={css`
          display: grid;
          overflow-y: hidden;
          grid-template-columns: 1fr 1px 1fr;

          @media (max-width: ${theme.maxWidth["2xl"]}) {
            grid-template-rows: 1fr;
            grid-template-columns: none;
            overflow-y: scroll;
          }
        `}
      >
        <VStack
          className={css`
            padding: ${theme.spacing["4"]} ${theme.spacing["6"]};
          `}
        >
          <div
            className={css`
              font-size: ${theme.fontSize.xs};
              font-weight: ${theme.fontWeight.medium};
              color: #66676b;
            `}
          >
            <a href={proposalHref}>Prop {vote.proposal.number}</a>
            <ValuePart value={vote.proposal.totalValue} />
          </div>

          <VoteTitle>
            <a href={proposalHref}>{vote.proposal.title}</a>
          </VoteTitle>

          <span
            className={css`
              color: ${colorForSupportType(supportType)};
              font-size: ${theme.fontSize.xs};
              font-weight: ${theme.fontWeight.medium};
            `}
          >
            <span
              className={css`
                text-transform: capitalize;
              `}
            >
              {supportType.toLowerCase()}
            </span>{" "}
            - with {pluralizeVote(BigNumber.from(vote.votes))}
            {vote.createdAt &&
              `${formatDistanceToNow(Number(vote.createdAt))} ago`}
          </span>
        </VStack>

        {vote.reason && (
          <>
            <div
              className={css`
                width: ${theme.spacing.px};
                background: #ebebeb;

                @media (max-width: ${theme.maxWidth["2xl"]}) {
                  display: none;
                }
              `}
            />

            <VStack
              className={css`
                overflow-y: scroll;
                overflow-x: scroll;
                padding: ${theme.spacing["4"]} ${theme.spacing["6"]};

                @media (max-width: ${theme.maxWidth["2xl"]}) {
                  padding-top: 0;
                  height: fit-content;
                }
              `}
            >
              <div
                className={css`
                  font-size: ${theme.fontSize.xs};
                  font-weight: ${theme.fontWeight.medium};
                  color: #66676b;
                  width: fit-content;
                `}
              >
                {vote.reason}
              </div>
            </VStack>
          </>
        )}
      </div>
    </VoteDetailsContainer>
  );
}
