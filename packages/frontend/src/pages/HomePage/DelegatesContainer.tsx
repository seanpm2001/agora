import { usePaginationFragment } from "react-relay";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import graphql from "babel-plugin-relay/macro";
import { css, keyframes } from "@emotion/css";
import * as theme from "../../theme";
import { VoterCard } from "./VoterCard";
import {
  DelegatesContainerFragment$data,
  DelegatesContainerFragment$key,
} from "./__generated__/DelegatesContainerFragment.graphql";
import { HStack, VStack } from "../../components/VStack";
import { CSSProperties, useState, useTransition } from "react";
import { DelegatesOrder } from "./__generated__/DelegatesContainerPaginationQuery.graphql";
import { Selector, SelectorItem } from "./Selector";
import { motion } from "framer-motion";
import { useNavigate } from "../../components/HammockRouter/HammockRouter";
import { useWindowVirtualizer, VirtualItem } from "@tanstack/react-virtual";
import { chunk } from "lodash";
import { useMediaQuery } from "react-responsive";
import { Variables } from "./HomePageRoute";
import {
  isLastDisplayedItemLoadMoreSentinel,
  makePaginationItems,
  PaginationItemType,
} from "../../hooks/pagination";
import { TextInputWithTooltip } from "../../components/Form/TextInputWithTooltip";

type Props = {
  fragmentKey: DelegatesContainerFragment$key;
  variables: Variables;
};

const orderNames: { [K in DelegatesOrder]?: string } = {
  weightedRandom: "Weighted random",
  mostVotingPower: "Most voting power",
  mostDelegates: "Most delegators",
};

const pulseAnimation = keyframes`
  0%   {opacity: 0.2;}
  50%  {opacity: 0.8;}
  100% {opacity: 0.2;}
`;

export function parseOrderName(orderName: string): DelegatesOrder | null {
  if (orderName in orderNames) {
    return orderName as any;
  }

  return null;
}
export function DelegatesContainer({ fragmentKey, variables }: Props) {
  const [isPending, startTransition] = useTransition();
  const [localOrderBy, setLocalOrderBy] = useState<DelegatesOrder>(
    variables.orderBy
  );

  const navigate = useNavigate();

  const isSmallerThanThreeColumns = useMediaQuery({
    query: `(max-width: ${theme.maxWidth["6xl"]})`,
  });

  const {
    data: { voters },
    loadNext,
    hasNext,
    isLoadingNext,
  } = usePaginationFragment(
    graphql`
      fragment DelegatesContainerFragment on Query
      @argumentDefinitions(
        first: { type: "Int", defaultValue: 30 }
        after: { type: "String" }
        orderBy: { type: "DelegatesOrder", defaultValue: weightedRandom }
        seed: { type: "String" }
      )
      @refetchable(queryName: "DelegatesContainerPaginationQuery") {
        voters: delegates(
          first: $first
          after: $after
          orderBy: $orderBy
          seed: $seed
        ) @connection(key: "DelegatesContainerFragment_voters") {
          edges {
            node {
              id
              ...VoterCardFragment
            }
          }
        }
      }
    `,
    fragmentKey
  );

  const columns = isSmallerThanThreeColumns ? 1 : 3;

  type ItemType = PaginationItemType<
    DelegatesContainerFragment$data["voters"]["edges"]
  >;

  const items: ItemType[] = makePaginationItems(
    chunk(voters.edges, columns),
    isLoadingNext,
    hasNext
  );

  const virtualizer = useWindowVirtualizer({
    count: items.length,
    overscan: 3,
    estimateSize(idx) {
      switch (items[idx].type) {
        case "LOAD_MORE_SENTINEL":
          return 0;

        case "LOADING":
        case "ITEMS":
          return 270;
      }
    },
    onChange(instance) {
      if (isLastDisplayedItemLoadMoreSentinel(instance, items)) {
        loadNext(30);
      }
    },
  });

  return (
    <VStack
      alignItems="center"
      className={css`
        width: 100%;
        max-width: ${theme.maxWidth["6xl"]};
        padding-top: ${theme.spacing["16"]};
        padding-bottom: ${theme.spacing["16"]};
        padding-left: ${theme.spacing["4"]};
        padding-right: ${theme.spacing["4"]};
      `}
    >
      <VStack
        className={css`
          width: 100%;
          margin-bottom: ${theme.spacing["4"]};
        `}
      >
        <HStack
          alignItems="baseline"
          gap="2"
          justifyContent="space-between"
          className={css`
            @media (max-width: ${theme.maxWidth["2xl"]}) {
              flex-direction: column;
              align-items: stretch;
            }
          `}
        >
          <h2
            className={css`
              font-size: ${theme.fontSize["2xl"]};
              font-weight: bolder;
            `}
          >
            Delegates
          </h2>

          <HStack
            gap="4"
            className={css`
              @media (max-width: ${theme.maxWidth["2xl"]}) {
                flex-direction: column;
                align-items: stretch;
              }
            `}
          >
            <DelegatePageInput />

            <Selector
              items={Object.entries(orderNames).map(
                ([value, title]): SelectorItem<DelegatesOrder> => ({
                  title,
                  value: value as DelegatesOrder,
                })
              )}
              value={isPending ? localOrderBy : variables.orderBy}
              onChange={(orderBy) => {
                setLocalOrderBy(orderBy);
                startTransition(() => {
                  navigate({
                    search: {
                      orderBy:
                        orderBy === "weightedRandom" ? null : orderBy ?? null,
                    },
                  });
                });
              }}
            />
          </HStack>
        </HStack>
      </VStack>

      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: isPending ? 0.3 : 1 }}
        transition={{ duration: 0.3, delay: isPending ? 0.3 : 0 }}
        className={css`
          width: 100%;
        `}
      >
        <div
          className={css`
            height: ${virtualizer.getTotalSize()}px;
            position: relative;
          `}
        >
          {virtualizer.getVirtualItems().map((virtualItem: VirtualItem) => {
            const item = items[virtualItem.index];

            const style: CSSProperties = {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: virtualItem.size,
              transform: `translateY(${virtualItem.start}px)`,
            };

            switch (item.type) {
              case "LOADING": {
                return (
                  <HStack
                    key={virtualItem.key}
                    style={style}
                    justifyContent="center"
                    alignItems="center"
                    className={css`
                      padding-bottom: ${theme.spacing["12"]};
                      padding-top: ${theme.spacing["8"]};
                      animation: ${pulseAnimation} 1s ease infinite;
                    `}
                  >
                    ⌐◨-◨
                  </HStack>
                );
              }

              case "ITEMS": {
                return (
                  <div
                    key={virtualItem.key}
                    className={css`
                      display: grid;
                      grid-template-columns: repeat(${columns}, 1fr);
                      padding-top: ${theme.spacing["4"]};
                      padding-bottom: ${theme.spacing["4"]};
                      gap: ${theme.spacing["8"]};
                    `}
                    style={style}
                  >
                    {item.items.map((item) => (
                      <VoterCard key={item.node.id} fragmentRef={item.node} />
                    ))}
                  </div>
                );
              }

              case "LOAD_MORE_SENTINEL":
                return null;

              default:
                throw new Error("unknown");
            }
          })}
        </div>
      </motion.div>
    </VStack>
  );
}

const DelegatePageInput = () => {
  const [enteredName, setEnteredName] = useState("");
  const navigate = useNavigate();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        navigate({ path: `/delegate/${enteredName}` });
      }}
    >
      <VStack
        className={css`
          position: relative;
        `}
      >
        <VStack
          justifyContent="center"
          className={css`
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;

            padding: ${theme.spacing["2"]};
          `}
        >
          <MagnifyingGlassIcon
            className={css`
              color: #4f4f4f;
              width: ${theme.spacing["4"]};
              height: ${theme.spacing["4"]};
            `}
          />
        </VStack>

        <TextInputWithTooltip
          onChange={(value) => setEnteredName(value)}
          placeholder="Exact ENS or address"
          tooltipMessage="Please input exact ENS or address. Partial and fuzzy search is not supported yet."
          className={css`
            padding: ${theme.spacing["2"]} ${theme.spacing["4"]};
            padding-left: ${theme.spacing["8"]};
            border-radius: ${theme.borderRadius.full};
            background: #fafafa;
            border-color: #ebebeb;
            border-width: 1px;

            &::placeholder {
              color: #afafaf;
            }
          `}
        />
        {/*<input*/}
        {/*  type="text"*/}
        {/*  onChange={(event) => setEnteredName(event.target.value)}*/}
        {/*  placeholder="Enter ENS or address"*/}
        {/*  className={css`*/}
        {/*    padding: ${theme.spacing["2"]} ${theme.spacing["4"]};*/}
        {/*    padding-left: ${theme.spacing["8"]};*/}
        {/*    border-radius: ${theme.borderRadius.full};*/}
        {/*    background: #fafafa;*/}
        {/*    border-color: #ebebeb;*/}
        {/*    border-width: 1px;*/}

        {/*    &::placeholder {*/}
        {/*      color: #afafaf;*/}
        {/*    }*/}
        {/*  `}*/}
        {/*/>*/}
      </VStack>
    </form>
  );
};
