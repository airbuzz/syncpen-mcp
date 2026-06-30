/**
 * Configuration for the SyncPen MCP server
 */

export interface Config {
  apiKey: string;
  apiUrl: string;
}

export function getConfig(): Config {
  const apiKey = process.env.SYNCPEN_API_KEY;
  const apiUrl = process.env.SYNCPEN_API_URL || "https://www.syncpen.io/api/mcp";

  if (!apiKey) {
    throw new Error(
      "SYNCPEN_API_KEY environment variable is not set. " +
        "Create an API key at https://www.syncpen.io/settings/api-keys, then set it as " +
        "SYNCPEN_API_KEY in your MCP server config and restart the server."
    );
  }

  return {
    apiKey,
    apiUrl,
  };
}
