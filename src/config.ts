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
      "SYNCPEN_API_KEY environment variable is required. " +
        "Generate an API key at Settings > API Keys in your SyncPen account."
    );
  }

  return {
    apiKey,
    apiUrl,
  };
}
