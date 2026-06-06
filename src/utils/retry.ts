/**
 * Executes a function with exponential backoff retry logic, specifically for HTTP 429 Rate Limits.
 * Backoff intervals: 100ms, 200ms, 400ms. Max retries: 3.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let retries = 0;
  let delay = 100;

  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      if (error?.status === 429 && retries < maxRetries) {
        retries++;
        await new Promise(res => setTimeout(res, delay));
        delay *= 2;
      } else {
        throw error;
      }
    }
  }
}
