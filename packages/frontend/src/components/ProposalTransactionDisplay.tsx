import { useFragment, graphql } from "react-relay";
import { BigNumber, ethers } from "ethers";
import { css } from "@emotion/css";
import { useMemo } from "react";
import * as Sentry from "@sentry/react";
import { differenceInCalendarMonths, format } from "date-fns";

import * as theme from "../theme";
import { shortAddress } from "../utils/address";

import { etherscanAddressUrl } from "./VoterPanel/NameSection";
import {
  ProposalTransactionDisplayFragment$key,
  ProposalTransactionDisplayFragment$data,
} from "./__generated__/ProposalTransactionDisplayFragment.graphql";
import { VStack } from "./VStack";

const TOKEN_BUYER_CONTRACT_ADDRESS =
  "0x4f2aCdc74f6941390d9b1804faBc3E780388cfe5";

export function ProposalTransactionDisplay({
  fragment,
  hasStreamTransaction,
}: {
  fragment: ProposalTransactionDisplayFragment$key;
  hasStreamTransaction?: boolean;
}) {
  const proposalTransaction = useFragment(
    graphql`
      fragment ProposalTransactionDisplayFragment on ProposalTransaction {
        target {
          resolvedName {
            address
            name
          }
        }

        calldata
        signature
        value
      }
    `,
    fragment
  );

  const decodingMetadata = useMemo(() => {
    try {
      const functionFragment = ethers.utils.FunctionFragment.fromString(
        proposalTransaction.signature
      );

      const decoded = ethers.utils.defaultAbiCoder.decode(
        functionFragment.inputs,
        proposalTransaction.calldata
      );

      return {
        functionFragment,
        values: functionFragment.inputs.map((type, index) => ({
          type,
          value: decoded[index],
        })),
      };
    } catch (e) {
      Sentry.captureException(e);
      return undefined;
    }
  }, [proposalTransaction]);

  const transactionValue = decodingMetadata?.values.find(
    (it) => it.type.type === "uint256"
  )?.value;

  return (
    <div
      className={css`
        word-break: break-word;
        font-size: ${theme.fontSize.xs};
        font-family: ${theme.fontFamily.mono};
        font-weight: ${theme.fontWeight.medium};
        color: ${theme.colors.gray["4f"]};
        line-height: ${theme.lineHeight["4"]};
        margin-top: ${theme.spacing[2]};
        margin-bottom: ${theme.spacing[2]};
        padding-bottom: ${theme.spacing["2"]};
      `}
    >
      <TransactionAnnotation
        signature={proposalTransaction.signature}
        target={proposalTransaction.target}
        hasStreamTransaction={hasStreamTransaction}
        calldata={decodingMetadata}
      />
      <a
        className={css`
          :hover {
            text-decoration: underline;
          }
        `}
        href={etherscanAddressUrl(
          proposalTransaction.target.resolvedName.address
        )}
        target="_blank"
      >
        {(() => {
          if (proposalTransaction.target.resolvedName.name) {
            return proposalTransaction.target.resolvedName.name;
          } else {
            return proposalTransaction.target.resolvedName.address;
          }
        })()}
      </a>
      {(() => {
        const value = BigNumber.from(proposalTransaction.value);
        if (value.isZero()) {
          return;
        }

        return <>.transfer( {ethers.utils.formatEther(value)} ETH )</>;
      })()}
      <VStack
        className={css`
          margin-left: ${theme.spacing["4"]};
        `}
      >
        {(() => {
          if (!decodingMetadata) {
            if (proposalTransaction.calldata === "0x") {
              return null;
            }

            return (
              <>
                calldata:
                <VStack
                  className={css`
                    margin-left: ${theme.spacing["4"]};
                  `}
                >
                  {proposalTransaction.calldata}
                </VStack>
              </>
            );
          }

          return (
            <>
              .{decodingMetadata.functionFragment.name}(
              <VStack
                className={css`
                  margin-left: ${theme.spacing["4"]};
                `}
              >
                {decodingMetadata.values.map((it, idx) => (
                  <>
                    <EncodedValueDisplay
                      key={idx}
                      type={it.type}
                      value={it.value}
                      last={idx === decodingMetadata.values.length - 1}
                    />
                  </>
                ))}
              </VStack>
              )
            </>
          );
        })()}
      </VStack>
    </div>
  );
}

function EncodedValueDisplay({
  type,
  value,
  last,
}: {
  type: ethers.utils.ParamType;
  value: any;
  last?: boolean;
}) {
  switch (type.type) {
    case "address":
      return (
        <a
          className={css`
            :hover {
              text-decoration: underline;
            }
          `}
          href={etherscanAddressUrl(value)}
          target="_blank"
        >
          {value}
          {last ? "" : ","}
        </a>
      );

    case "tuple":
      return (
        <VStack
          className={css`
            margin-left: ${theme.spacing["4"]};
          `}
        >
          {type.components.map((compoment, idx) => (
            <EncodedValueDisplay
              key={idx}
              type={compoment}
              value={value[idx]}
            />
          ))}
        </VStack>
      );

    default:
    case "string":
    case "uint16":
    case "uint32":
    case "uint64":
    case "uint128":
    case "uint256":
      return (
        <div>
          {value.toString()}
          {last ? "" : ","}
        </div>
      );
  }
}

function TransactionAnnotation({
  signature,
  target,
  hasStreamTransaction,
  calldata,
}: {
  signature: string;
  target: ProposalTransactionDisplayFragment$data["target"];
  hasStreamTransaction?: boolean;
  calldata?: {
    functionFragment: ethers.utils.FunctionFragment;
    values: { type: ethers.utils.ParamType; value: any }[];
  };
}) {
  if (
    signature ===
      "createStream(address,uint256,address,uint256,uint256,uint8,address)" &&
    calldata
  ) {
    return (
      <p
        className={css`
          font-size: ${theme.fontSize.xs};
          font-family: ${theme.fontFamily.mono};
          font-weight: ${theme.fontWeight.medium};
          color: ${theme.colors.gray.af};
          line-height: ${theme.lineHeight["4"]};
          padding-bottom: ${theme.spacing[1]};
        `}
      >
        // This transaction streams{" "}
        {parseFloat(
          ethers.utils.formatUnits(calldata.values[1].value, 6)
        ).toLocaleString("en-US")}{" "}
        USDC to{" "}
        <a
          className={css`
            :hover {
              text-decoration: underline;
            }
          `}
          href={etherscanAddressUrl(calldata.values[0].value)}
          target="_blank"
        >
          {shortAddress(calldata.values[0].value)}
        </a>{" "}
        over{" "}
        {differenceInCalendarMonths(
          calldata.values[4].value * 1000,
          calldata.values[3].value * 1000
        )}{" "}
        months ({format(calldata.values[3].value * 1000, "MM/dd/yyyy")} -{" "}
        {format(calldata.values[4].value * 1000, "MM/dd/yyyy")})
      </p>
    );
  } else if (signature === "sendOrRegisterDebt(address,uint256)" && calldata) {
    if (hasStreamTransaction) {
      return (
        <p
          className={css`
            font-size: ${theme.fontSize.xs};
            font-family: ${theme.fontFamily.mono};
            font-weight: ${theme.fontWeight.medium};
            color: ${theme.colors.gray.af};
            line-height: ${theme.lineHeight["4"]};
            padding-bottom: ${theme.spacing[1]};
          `}
        >
          // This transaction funds the stream via DAO's PayerContract.
        </p>
      );
    }

    return (
      <p
        className={css`
          font-size: ${theme.fontSize.xs};
          font-family: ${theme.fontFamily.mono};
          font-weight: ${theme.fontWeight.medium};
          color: ${theme.colors.gray.af};
          line-height: ${theme.lineHeight["4"]};
          padding-bottom: ${theme.spacing[1]};
        `}
      >
        // This transaction sends{" "}
        {parseFloat(
          ethers.utils.formatUnits(calldata.values[1].value, 6)
        ).toLocaleString("en-US")}{" "}
        USDC to{" "}
        <a
          className={css`
            :hover {
              text-decoration: underline;
            }
          `}
          href={etherscanAddressUrl(calldata.values[0].value)}
          target="_blank"
        >
          {shortAddress(calldata.values[0].value)}
        </a>{" "}
        via the DAO's PayerContract.
      </p>
    );
  }

  if (target.resolvedName.address === TOKEN_BUYER_CONTRACT_ADDRESS) {
    return (
      <p
        className={css`
          font-size: ${theme.fontSize.xs};
          font-family: ${theme.fontFamily.mono};
          font-weight: ${theme.fontWeight.medium};
          color: ${theme.colors.gray.af};
          line-height: ${theme.lineHeight["4"]};
          padding-bottom: ${theme.spacing[1]};
        `}
      >
        // This transaction was automatically added to refill the TokenBuyer.
        Proposers do not receive this ETH.
      </p>
    );
  }

  return null;
}
