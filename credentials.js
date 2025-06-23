/**
 * Shared credential management utilities for Deno KV Explorer
 */

/**
 * Get credentials from localStorage and return as headers object
 * @returns {Object} Headers object with KV credentials
 */
export function getHeaders() {
  const dbId = localStorage.getItem("DENO_KV_DB_ID");
  const accessToken = localStorage.getItem("DENO_KV_ACCESS_TOKEN");

  const headers = {};
  if (dbId) headers["X-KV-DB-ID"] = dbId;
  if (accessToken) headers["X-KV-ACCESS-TOKEN"] = accessToken;

  return headers;
}

/**
 * Check if credentials are available in localStorage
 * @returns {boolean} True if both credentials are present
 */
export function checkCredentials() {
  const dbId = localStorage.getItem("DENO_KV_DB_ID");
  const accessToken = localStorage.getItem("DENO_KV_ACCESS_TOKEN");

  return !!(dbId && accessToken);
}

/**
 * Require credentials and show error message if not available
 * @param {HTMLElement} fallbackElement - Element to show error message in
 * @returns {boolean} True if credentials are available
 */
export function requireCredentials(fallbackElement) {
  if (checkCredentials()) {
    return true;
  }

  fallbackElement.innerHTML = `
    <div style="text-align: center; padding: 40px;">
      <h3>No credentials configured</h3>
      <p>Please go to <a href="/settings">Settings</a> to configure your Deno KV credentials.</p>
    </div>
  `;
  return false;
}

/**
 * Make an API request with credentials automatically included
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export function apiRequest(url, options = {}) {
  return fetch(url, {
    headers: { ...getHeaders(), ...options.headers },
    ...options,
  });
}
