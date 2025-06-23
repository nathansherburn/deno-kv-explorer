import { urlParamToKvKey } from "./key-encoding.js";

// Get credentials from headers
function getCredentials(req: Request) {
  const dbId = req.headers.get("X-KV-DB-ID");
  const accessToken = req.headers.get("X-KV-ACCESS-TOKEN");
  return { dbId, accessToken };
}

// Create KV connection with provided credentials
async function createKvConnection(dbId: string, accessToken: string) {
  if (!dbId || !accessToken) {
    throw new Error("Database ID and access token are required");
  }
  return await Deno.openKv(`https://api.deno.com/databases/${dbId}/connect`);
}

// Wrapper function to handle credentials and error handling for KV operations
function withCredentials(
  handler: (kv: Deno.Kv, req: Request, url: URL) => Promise<Response>,
) {
  return async (req: Request, url: URL): Promise<Response> => {
    try {
      const { dbId, accessToken } = getCredentials(req);
      if (!dbId || !accessToken) {
        return new Response("Missing credentials", { status: 401 });
      }

      const kv = await createKvConnection(dbId, accessToken);
      const result = await handler(kv, req, url);
      kv.close();
      return result;
    } catch (error) {
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  };
}

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

  if (req.method === "GET" && pathname === "/settings") {
    const html = await Deno.readTextFile("./pages/settings.html");
    return new Response(html, { headers: { "Content-Type": "text/html" } });
  }

  if (req.method === "GET" && pathname === "/key-encoding.js") {
    const js = await Deno.readTextFile("./key-encoding.js");
    return new Response(js, {
      headers: { "Content-Type": "application/javascript" },
    });
  }

  if (req.method === "GET" && pathname === "/credentials.js") {
    const js = await Deno.readTextFile("./credentials.js");
    return new Response(js, {
      headers: { "Content-Type": "application/javascript" },
    });
  }

  if (req.method === "GET" && pathname === "/styles.css") {
    const css = await Deno.readTextFile("./styles.css");
    return new Response(css, {
      headers: { "Content-Type": "text/css" },
    });
  }

  if (req.method === "POST" && pathname === "/test-connection") {
    try {
      const { dbId, accessToken } = getCredentials(req);
      if (!dbId || !accessToken) {
        return new Response("Missing credentials", { status: 400 });
      }

      const kv = await createKvConnection(dbId, accessToken);
      // Test the connection by trying to list with limit 1
      const test = kv.list({ prefix: [] }, { limit: 1 });
      await Array.fromAsync(test);
      kv.close();

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ success: false, error: String(error) }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  if (req.method === "GET" && pathname === "/list") {
    return await withCredentials(async (kv, _req, url) => {
      const { searchParams } = url;
      const prefix = searchParams.get("prefix");
      const limit = searchParams.get("limit") || "100";
      const cursorParam = searchParams.get("cursor") || undefined;
      const reverse = searchParams.get("reverse");
      const query = prefix ? urlParamToKvKey(prefix) : [];
      const kvEntryIterator = kv.list(
        { prefix: query },
        {
          limit: +limit,
          cursor: cursorParam,
          reverse: reverse === "true",
        },
      );

      const entries = [];
      let cursor = null;
      for await (const entry of kvEntryIterator) {
        entries.push(entry);
      }
      cursor = kvEntryIterator.cursor;

      return new Response(JSON.stringify({ entries, cursor }), {
        headers: { "Content-Type": "application/json" },
      });
    })(req, url);
  }

  if (req.method === "GET" && pathname === "/get") {
    return await withCredentials(async (kv, _req, url) => {
      const { searchParams } = url;
      const key = searchParams.get("key") || "";
      console.log("Fetching key:", url);
      const kvKey = urlParamToKvKey(key);
      const entry = await kv.get(kvKey);
      console.log("Fetched entry:", entry);
      return new Response(JSON.stringify(entry || {}), {
        headers: { "Content-Type": "application/json" },
      });
    })(req, url);
  }

  if (req.method === "DELETE" && pathname === "/delete") {
    return await withCredentials(async (kv, _req, url) => {
      const { searchParams } = url;
      const key = searchParams.get("key") || "";
      const kvKey = urlParamToKvKey(key);
      await kv.delete(kvKey);
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    })(req, url);
  }

  if (req.method === "POST" && pathname === "/set") {
    return await withCredentials(async (kv, _req, url) => {
      const { searchParams } = url;
      const key = searchParams.get("key") || "";
      const value = await req.json();
      const kvKey = urlParamToKvKey(key);
      await kv.set(kvKey, value);
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    })(req, url);
  }

  return new Response("Not Found", { status: 404 });
};

Deno.serve(handler);
