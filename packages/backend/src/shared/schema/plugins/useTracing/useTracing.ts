import { Plugin } from "@graphql-yoga/common";

import { getRootOperation } from "../../helpers/rootOperation";
import { ReadOnlySpan } from "../../../workers/datadogTracer/types";
import { onSchemaChangedOnce } from "../onSchemaChangedOnce";

import {
  attachTracingContextInjection,
  TracingContext,
} from "./tracingContext";
import { flattenMetaInputType } from "../../../workers/datadogTracer/flatten";

export function useTracing(
  span: ReadOnlySpan,
  enabled: boolean
): Plugin<{ tracingContext: TracingContext }> {
  return {
    ...onSchemaChangedOnce("useTracing", ({ schema, replaceSchema }) => {
      if (!enabled) {
        return;
      }

      replaceSchema(attachTracingContextInjection(schema));
    }),

    onExecute({ args, extendContext }) {
      const rootOperation = getRootOperation(args.document);

      const operationName = args.operationName ?? rootOperation.name?.value;

      const rootSpan = span.startSpan({
        name: "graphql",
        resource: `${rootOperation.operation} ${operationName}`,
        meta: flattenMetaInputType({
          graphql: {
            operationName,
            operation: rootOperation.operation,
            variables: JSON.stringify(args.variableValues),
          },
        }),
      });

      extendContext({
        tracingContext: { rootSpan, spanMap: new Map() },
      });

      return {
        onExecuteDone() {
          rootSpan.finishSpan();
        },
      };
    },
  };
}
