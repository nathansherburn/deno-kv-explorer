// Leveraging Deno's native KvKeyPart type
function encodeKvKey(key: Deno.KvKeyPart[]): string {
  return encodeURIComponent(
    JSON.stringify(
      key.map((part) => {
        if (part instanceof Uint8Array) {
          return { type: "Uint8Array", value: Array.from(part) };
        }
        return { type: typeof part, value: part };
      })
    )
  );
}

function decodeKvKey(encodedKey: string): Deno.KvKeyPart[] {
  const decoded = JSON.parse(decodeURIComponent(encodedKey));
  return decoded.map((item: { type: string; value: any }) => {
    switch (item.type) {
      case "Uint8Array":
        return new Uint8Array(item.value);
      case "string":
        return item.value;
      case "number":
        return item.value;
      case "bigint":
        return BigInt(item.value);
      case "boolean":
        return item.value;
      default:
        throw new Error(`Unsupported key part type: ${item.type}`);
    }
  });
}

export { encodeKvKey, decodeKvKey };
