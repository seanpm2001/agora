import { etherscanAddressUrl } from "../../NameSection";
import { shortAddress } from "../../../../utils/address";
import React from "react";
import { useFragment } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { CustomRulesFragment$key } from "./__generated__/CustomRulesFragment.graphql";

export function CustomRules({
  fragmentRef,
}: {
  fragmentRef: CustomRulesFragment$key;
}) {
  const rules = useFragment(
    graphql`
      fragment CustomRulesFragment on LiquidDelegationRules {
        customRules
      }
    `,
    fragmentRef
  );

  return (
    <>
      {rules.customRules.map((customRuleAddress) => (
        <a href={etherscanAddressUrl(customRuleAddress)}>
          {shortAddress(customRuleAddress)}
        </a>
      ))}
    </>
  );
}
