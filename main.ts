import { Hono } from "hono";

const DENO_KV_DB_ID = Deno.env.get("DENO_KV_DB_ID");
const DENO_KV_ACCESS_TOKEN = Deno.env.get("DENO_KV_ACCESS_TOKEN");

if (!DENO_KV_DB_ID) {
  throw Error("Plesae provide a database ID");
}
if (!DENO_KV_ACCESS_TOKEN) {
  throw Error("Plesae provide an access token");
}

const kv = await Deno.openKv(
  `https://api.deno.com/databases/${DENO_KV_DB_ID}/connect`,
);

const app = new Hono();

app.get("/", async (c) => {
  const allEntries = await Array.fromAsync(kv.list({ prefix: [] }));
  const topLevelKeys = new Set();
  allEntries.forEach((entry) => {
    const key = entry.key[0];
    topLevelKeys.add(key);
  });
  topLevelKeys.forEach((key) => {
    console.log(key);
  });
  let html = "<html>";
  topLevelKeys.forEach((key) => {
    html += `<a href="/${key}">${key}</a><br>`;
  });
  html += "</html>";
  return c.html(html);
});

app.get("/:key0", async (c) => {
  const key0 = c.req.param("key0");
  const entries = await Array.fromAsync(kv.list({ prefix: [key0] }));
  const topLevelKeys = new Set();
  entries.forEach((entry) => {
    const key = entry.key[1];
    topLevelKeys.add(key);
  })
  let html = "<html>";
  topLevelKeys.forEach((key) => {
    html += `<a href="/${key0}/${key}">${key}</a><br>`;
  });
  html += "</html>";
  return c.html(html);
});

app.get("/:key0/:key1", async (c) => {
  const template = Deno.readTextFileSync("template.html");
  const key0 = c.req.param("key0");
  const key1 = c.req.param("key1");
  const entries = await Array.fromAsync(kv.list({ prefix: [key0, key1] }));
  const topLevelKeys = new Set();
  entries.forEach((entry) => {
    const key = entry.key[2];
    topLevelKeys.add(key);
  })
  let results = "";
  topLevelKeys.forEach((key) => {
    results += `<a href="/${key0}/${key1}/${key}">${key}</a> <button onclick="deleteEntries('${key0}/${key1}/${key}')">X</button><br>`;
  });
  const html = render(template, { results });

  return c.html(html);
});

app.get("/:key0/:key1/:key2", async (c) => {
  const key0 = c.req.param("key0");
  const key1 = c.req.param("key1");
  const key2 = c.req.param("key2");
  const entries = await kv.get([key0, key1, key2]);
  return c.json(entries);
});

app.delete("delete/:key0/:key1/:key2", async (c) => {
  const key0 = c.req.param("key0");
  const key1 = c.req.param("key1");
  const key2 = c.req.param("key2");

  await kv.delete([key0, key1, key2]);
  return c.json({ success: true });
});

const render = (template: string, data: Record<string, string>) => {
  let result = template;
  for (const key in data) {
    result = result.replace(`\${${key}}`, data[key]);
  }
  return result;
};

Deno.serve(app.fetch);
