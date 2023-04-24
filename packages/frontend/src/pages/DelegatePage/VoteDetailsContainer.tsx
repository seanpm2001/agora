import { ReactNode, useMemo } from "react";
import { css } from "@emotion/css";
import { BigNumber, utils } from "ethers";

import { VStack } from "../../components/VStack";
import * as theme from "../../theme";
import { shadow } from "../../theme";

type VoteDetailsContainerProps = {
  children: ReactNode;
};

export function VoteDetailsContainer({ children }: VoteDetailsContainerProps) {
  return (
    <VStack
      gap="3"
      className={css`
        border-radius: ${theme.borderRadius.lg};
        border-width: ${theme.spacing.px};
        border-color: ${theme.colors.gray.eb};
        background: ${theme.colors.white};
        box-shadow: ${shadow};
        max-height: 15rem;
      `}
    >
      {children}
    </VStack>
  );
}

export type VoteTitleProps = {
  children: ReactNode;
};

export function VoteTitle({ children }: VoteTitleProps) {
  return (
    <h2
      className={css`
        font-size: ${theme.fontSize.base};
        padding: ${theme.spacing[1]} 0;
        overflow: hidden;
        text-overflow: ellipsis;
      `}
    >
      {children}
    </h2>
  );
}

export type ValuePartProps = {
  value: string;
};

export function ValuePart({ value }: ValuePartProps) {
  const amount = useMemo(() => BigNumber.from(value), [value]);

  return (
    <>
      {!amount.isZero() ? (
        <> requesting {parseFloat(utils.formatEther(amount)).toFixed(1)} ETH</>
      ) : null}{" "}
    </>
  );
}

export type SupportTextProps = {
  supportType: "FOR" | "AGAINST" | "ABSTAIN";
};

export function colorForSupportType(
  supportType: SupportTextProps["supportType"]
) {
  switch (supportType) {
    case "AGAINST":
      return theme.colors.red["600"];

    case "ABSTAIN":
      return theme.colors.gray["700"];

    case "FOR":
      return theme.colors.green["600"];
  }
}
