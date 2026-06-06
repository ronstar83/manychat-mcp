import { withRetry } from "../utils/retry.js";

const BASE_URL = "https://api.manychat.com";

export class ManyChatAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = "ManyChatAPIError";
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = process.env.MANYCHAT_API_TOKEN;
  if (!token) {
    throw new ManyChatAPIError("MANYCHAT_API_TOKEN environment variable is missing.");
  }

  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    ...options.headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      if (response.status === 401) {
        throw new ManyChatAPIError("Invalid ManyChat API token. Verify your MANYCHAT_API_TOKEN at manychat.com → Settings → API", 401, data);
      }
      if (response.status === 404) {
        throw new ManyChatAPIError(`Resource not found. Use manychat_list_* tools to find valid IDs.`, 404, data);
      }
      throw new ManyChatAPIError(`ManyChat API error: ${response.statusText}`, response.status, data);
    }

    if (data.status === "error") {
      throw new ManyChatAPIError(`ManyChat API error: ${data.message}`, response.status, data);
    }

    return data as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new ManyChatAPIError("Request to ManyChat API timed out after 10s", 408);
    }
    throw error;
  }
}

export const manychat = {
  get: <T>(endpoint: string, params?: Record<string, any>) => {
    return withRetry(() => {
      const url = params ? `${endpoint}?${new URLSearchParams(params).toString()}` : endpoint;
      return request<T>(url, { method: "GET" });
    });
  },
  post: <T>(endpoint: string, body?: any) => {
    return withRetry(() => request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined
    }));
  }
};
