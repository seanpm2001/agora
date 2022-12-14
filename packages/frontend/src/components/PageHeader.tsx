import { css } from "@emotion/css";
import * as Sentry from "@sentry/react";
import * as theme from "../theme";
import logo from "../logo.svg";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { PageHeaderFragment$key } from "./__generated__/PageHeaderFragment.graphql";
import { ConnectKitButton } from "connectkit";
import { useAccount } from "wagmi";
import { useLazyLoadQuery } from "react-relay/hooks";
import { PageHeaderQuery } from "./__generated__/PageHeaderQuery.graphql";
import { HStack } from "./VStack";
import { Suspense, useEffect } from "react";
import { Link } from "./HammockRouter/Link";
import { TokenAmountDisplay } from "./TokenAmountDisplay";

export const orgName = "ENS";

export function PageHeader() {
  return (
    <HStack
      className={css`
        width: 100%;
        max-width: ${theme.maxWidth["6xl"]};
        margin: ${theme.spacing["8"]} auto;
        gap: ${theme.spacing["2"]};
        justify-content: space-between;
        padding-left: ${theme.spacing["4"]};
        padding-right: ${theme.spacing["4"]};

        @media (max-width: ${theme.maxWidth.md}) {
          flex-direction: column;
          text-align: center;
        }
      `}
    >
      <Link
        className={css`
          display: flex;
          flex-direction: row;
          justify-content: center;
        `}
        to="/"
      >
        <HStack gap="3">
          <img alt="logo" src={logo} />

          <span
            className={css`
              white-space: nowrap;
              font-size: ${theme.fontSize.base};
              font-weight: ${theme.fontWeight.semibold};
              color: ${theme.colors.gray["800"]};
            `}
          >
            {orgName} Agora
          </span>
        </HStack>
      </Link>

      <HStack
        alignItems="center"
        gap="3"
        className={css`
          height: ${theme.spacing["6"]};

          @media (max-width: ${theme.maxWidth.md}) {
            height: auto;
            flex-direction: column;
            align-items: stretch;
          }
        `}
      >
        <HStack justifyContent="center">
          <ConnectKitButton mode="light" />
        </HStack>

        <Suspense fallback={null}>
          <PageHeaderContents />
        </Suspense>
      </HStack>
    </HStack>
  );
}

function PageHeaderContents() {
  const { address: accountAddress } = useAccount();

  useEffect(() => {
    Sentry.setUser({
      id: accountAddress,
    });
  }, [accountAddress]);

  const { delegate } = useLazyLoadQuery<PageHeaderQuery>(
    graphql`
      query PageHeaderQuery($address: String!, $skip: Boolean!) {
        delegate(addressOrEnsName: $address) @skip(if: $skip) {
          statement {
            __typename
          }

          ...PageHeaderFragment
        }
      }
    `,
    {
      address: accountAddress ?? "",
      skip: !accountAddress,
    }
  );

  return (
    <HStack gap="2" justifyContent="center">
      {delegate && <OwnedValuePanel fragment={delegate} />}
    </HStack>
  );
}

type OwnedValuePanelProps = {
  fragment: PageHeaderFragment$key;
};

function OwnedValuePanel({ fragment }: OwnedValuePanelProps) {
  const delegate = useFragment(
    graphql`
      fragment PageHeaderFragment on Delegate {
        amountOwned {
          amount {
            ...TokenAmountDisplayFragment
          }
        }
      }
    `,
    fragment
  );

  return (
    <HStack
      className={css`
        border-color: ${theme.colors.gray["300"]};
        border-width: ${theme.spacing.px};
        border-radius: ${theme.borderRadius.lg};
        box-shadow: ${theme.boxShadow.newDefault};
        background: ${theme.colors.white};
      `}
    >
      <HStack
        gap="1"
        className={css`
          align-items: center;

          padding: ${theme.spacing["1"]} ${theme.spacing["2"]};
        `}
      >
        <TokenAmountDisplay fragment={delegate.amountOwned.amount} />
      </HStack>
    </HStack>
  );
}
