/**
 * Converts a key array to a JSON-compatible format.
 * Each part of the key is represented as an object with type and value.
 * @param {Array} key - The key array to convert.
 * @returns {Array} - The JSON-compatible key representation.
 * @example
 * // Example usage:
 * const key = ["user", 123, "profile"];
 * const jsonKey = kvKeyToJson(key);
 * console.log(jsonKey); // [{ type: "string", value: "user" }, { type: "number", value: 123 }, { type: "string", value: "profile" }]
 */
function kvKeyToJson(key) {
  return key.map((part) => {
    if (part instanceof Uint8Array) {
      return { type: "Uint8Array", value: Array.from(part) };
    }
    return { type: typeof part, value: part };
  });
}

/**
 * Converts a JSON-compatible key representation back to a key array.
 * Each part is expected to be an object with type and value.
 * @param {Array} jsonKey - The JSON-compatible key representation.
 * @returns {Array} - The key array.
 * @example
 * // Example usage:
 * const jsonKey = [{ type: "string", value: "user" }, { type: "number", value: 123 }, { type: "string", value: "profile" }];
 * const key = jsonToKvKey(jsonKey);
 * console.log(key); // ["user", 123, "profile"]
 */
function jsonToKvKey(jsonKey) {
  return jsonKey.map((item) => {
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

/**
 * Converts a key array to a URL parameter string.
 * Each part of the key is represented as a string with its type and value.
 * @param {Array} key - The key array to convert. e.g. ["user", 123, "profile"]
 * @returns {string} - The URL parameter string representation. e.g. "string:user,number:123,string:profile"
 * @example
 * // Example usage:
 * const key = ["user", 123, "profile"];
 * const urlParam = kvKeyToUrlParam(key);
 * console.log(urlParam); // "string:user,number:123,string:profile"
 */
function kvKeyToUrlParam(key) {
  return key
    .map((part) => {
      if (part instanceof Uint8Array) {
        return `Uint8Array:${Array.from(part).join("|")}`;
      }
      return `${typeof part}:${part}`;
    })
    .join(",");
}

/**
 * Converts a URL parameter string back to a key array.
 * Each part of the string is expected to be in the format "type:value".
 * @param {string} urlParam - The URL parameter string to convert. e.g. "string:user,number:123,string:profile"
 * @returns {Array} - The key array. e.g. ["user", 123, "profile"]
 * @example
 * // Example usage:
 * const urlParam = "string:user,number:123,string:profile";
 * const key = urlParamToKvKey(urlParam);
 * console.log(key); // ["user", 123, "profile"]
 */
function urlParamToKvKey(urlParam) {
  if (!urlParam) return [];

  return urlParam.split(",").map((part) => {
    const colonIndex = part.indexOf(":");

    if (colonIndex === -1) {
      throw new Error(`Invalid key part format: ${part}`);
    }

    const type = part.substring(0, colonIndex);
    const valueStr = part.substring(colonIndex + 1);

    switch (type) {
      case "string":
        return valueStr;
      case "number":
        return Number(valueStr);
      case "bigint":
        return BigInt(valueStr);
      case "boolean":
        return valueStr === "true";
      case "Uint8Array":
        return new Uint8Array(valueStr.split("|").map(Number));
      default:
        throw new Error(`Unsupported key part type: ${type}`);
    }
  });
}

/**
 * Encodes a key array to a URL-safe string that maintains the information about the types and values of each part.
 * This is useful for passing keys in URLs or other contexts where special characters need to be escaped.
 * @param {Array} key - The key array to encode.
 * @returns {string} - The encoded key string.
 * @throws {Error} - If the key cannot be converted to a JSON-compatible format.
 * @example
 * // Example usage:
 * const key = ["user"];
 * const encodedKey = encodeKvKey(key);
 * console.log(encodedKey); // "%7B%22type%22%3A%22string%22%2C%22value%22%3A%22user%22%7D"
 * @throws {Error} - If the key contains unsupported types.
 */
const encodeKvKey = (key) => {
  return encodeURIComponent(JSON.stringify(kvKeyToJson(key)));
};

/**
 * Decodes a URL-safe string back to a key array respecting the types and values of each part.
 * This is useful for retrieving keys from URLs or other contexts where special characters have been escaped.
 * @param {string} encodedKey - The encoded key string to decode.
 * @returns {Array} - The decoded key array.
 * @throws {Error} - If the encoded key cannot be parsed or contains unsupported types.
 * @example
 * // Example usage:
 * const encodedKey = "%7B%22type%22%3A%22string%22%2C%22value%22%3A%22user%22%7D";
 * const key = decodeKvKey(encodedKey);
 * console.log(key); // ["user"]
 */
const decodeKvKey = (encodedKey) => {
  const decoded = JSON.parse(decodeURIComponent(encodedKey));
  return jsonToKvKey(decoded);
};

export {
  decodeKvKey,
  encodeKvKey,
  jsonToKvKey,
  kvKeyToJson,
  kvKeyToUrlParam,
  urlParamToKvKey,
};
