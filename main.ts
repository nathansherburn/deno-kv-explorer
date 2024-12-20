import { Hono } from "hono";
import { decodeKvKey } from "./key-encoding.ts";

const DENO_KV_DB_ID = Deno.env.get("DENO_KV_DB_ID");
const DENO_KV_ACCESS_TOKEN = Deno.env.get("DENO_KV_ACCESS_TOKEN");

if (!DENO_KV_DB_ID) {
  throw Error("Plesae provide a database ID");
}
if (!DENO_KV_ACCESS_TOKEN) {
  throw Error("Plesae provide an access token");
}

const kv = await Deno.openKv(
  `https://api.deno.com/databases/${DENO_KV_DB_ID}/connect`
);

const app = new Hono();

// Pages
app.get("/", async (c) => {
  const html = await Deno.readTextFile("./pages/index.html");
  return c.html(html);
});

app.get("/edit", async (c) => {
  const html = await Deno.readTextFile("./pages/edit.html");
  return c.html(html);
});

// API
app.get("/list", async (c) => {
  const { prefix, limit, cursor, reverse } = c.req.query();
  const query = prefix ? decodeKvKey(prefix as string) : [];
  const kvEntryIterator = kv.list(
    { prefix: query },
    {
      limit: +limit || 1000,
      cursor: cursor,
      reverse: reverse === "true",
    }
  );

  const response = await Array.fromAsync(kvEntryIterator);

  return c.json(response || []);
});

app.get("/get", async (c) => {
  const { key } = c.req.query();
  const kvKey = decodeKvKey(key as string);
  const entry = await kv.get(kvKey);
  return c.json(entry || {});
});

app.delete("/delete", async (c) => {
  const { key } = await c.req.query();
  const kvKey = decodeKvKey(key as string);
  await kv.delete(kvKey);
  return c.json({ success: true });
});

app.post("/set", async (c) => {
  const { key } = await c.req.query();
  const value = await c.req.json();
  const kvKey = decodeKvKey(key as string);
  await kv.set(kvKey, value);
  return c.json({ success: true });
});

Deno.serve(app.fetch);
