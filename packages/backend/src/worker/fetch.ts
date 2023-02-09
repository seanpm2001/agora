import { Env } from "./env";
import { getAssetFromKV } from "@cloudflare/kv-asset-handler";

import manifestJSON from "__STATIC_CONTENT_MANIFEST";
const assetManifest = JSON.parse(manifestJSON);

export async function fetch(request: Request, env: Env, ctx: ExecutionContext) {
  const url = new URL(request.url);
  if (
    url.pathname === "/graphql" ||
    url.pathname === "/inspect" ||
    url.pathname.startsWith("/admin/")
  ) {
    const object = env.STORAGE_OBJECT.get(
      env.STORAGE_OBJECT.idFromName("stable1")
    );

    return await object.fetch(request);
  }

  if (isStaticFile(request)) {
    return await getAssetFromKV(
      {
        request,
        waitUntil(promise) {
          return ctx.waitUntil(promise);
        },
      },
      {
        ASSET_NAMESPACE: env.__STATIC_CONTENT,
        ASSET_MANIFEST: assetManifest,
      }
    );
  }

  const content = await env.__STATIC_CONTENT.get(assetManifest["index.html"]);

  return new Response(content, {
    headers: {
      "content-type": "text/html; charset=UTF-8",
    },
  });
}

export function isStaticFile(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/+/, "");
  return assetManifest[path];
}
