import { decodeKvKey } from "./key-encoding.ts";

const DENO_KV_DB_ID = Deno.env.get("DENO_KV_DB_ID");
const DENO_KV_ACCESS_TOKEN = Deno.env.get("DENO_KV_ACCESS_TOKEN");

if (!DENO_KV_DB_ID) {
  throw Error("Please provide a database ID");
}
if (!DENO_KV_ACCESS_TOKEN) {
  throw Error("Please provide an access token");
}

const kv = await Deno.openKv(
  `https://api.deno.com/databases/${DENO_KV_DB_ID}/connect`
);

const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const pathname = url.pathname;

  if (req.method === "GET" && pathname === "/") {
    const html = await Deno.readTextFile("./pages/index.html");
    return new Response(html, { headers: { "Content-Type": "text/html" } });
  }

  if (req.method === "GET" && pathname === "/edit") {
    const html = await Deno.readTextFile("./pages/edit.html");
    return new Response(html, { headers: { "Content-Type": "text/html" } });
  }

  if (req.method === "GET" && pathname === "/list") {
    const { searchParams } = url;
    const prefix = searchParams.get("prefix");
    const limit = searchParams.get("limit") || "100";
    const cursor = searchParams.get("cursor") || undefined;
    const reverse = searchParams.get("reverse");
    const query = prefix ? decodeKvKey(prefix) : [];
    const kvEntryIterator = kv.list(
      { prefix: query },
      {
        limit: +limit,
        cursor: cursor,
        reverse: reverse === "true",
      }
    );

    const response = await Array.fromAsync(kvEntryIterator);
    return new Response(JSON.stringify(response || []), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "GET" && pathname === "/get") {
    const { searchParams } = url;
    const key = searchParams.get("key") || "";
    const kvKey = decodeKvKey(key);
    const entry = await kv.get(kvKey);
    return new Response(JSON.stringify(entry || {}), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "DELETE" && pathname === "/delete") {
    const { searchParams } = url;
    const key = searchParams.get("key") || "";
    const kvKey = decodeKvKey(key);
    await kv.delete(kvKey);
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "POST" && pathname === "/set") {
    const { searchParams } = url;
    const key = searchParams.get("key") || "";
    const value = await req.json();
    const kvKey = decodeKvKey(key);
    await kv.set(kvKey, value);
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Not Found", { status: 404 });
};

Deno.serve(handler);
