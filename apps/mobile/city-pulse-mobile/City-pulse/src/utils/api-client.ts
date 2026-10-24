import { API_BASE_URL, API_TIMEOUT_MS, MOCK_API } from './api-config';

/**
 * The single place the app talks to the API.
 *
 * Three things are centralised here because getting them wrong is what breaks a
 * mobile app at the edges:
 *
 * 1. **Every request is bounded.** React Native's `fetch` has no default
 *    timeout, and on a host that is unreachable it can stay pending far longer
 *    than any UI is willing to wait. Every call therefore carries an
 *    `AbortController`, so a request can never hang the screen that started it.
 * 2. **Offline is a distinct state, not an error string.** `ApiError.isOffline`
 *    lets a screen say "you're offline, here's what's cached" instead of
 *    "something went wrong". Those need different UI and different recovery.
 * 3. **Mock mode is handled once.** Callers check `MOCK_API` for behaviour, not
 *    transport.
 */
export class ApiError extends Error {
  readonly isOffline: boolean;
  readonly isTimeout: boolean;
  readonly status: number | null;
  readonly queued: boolean;
  /**
   * A stable machine-readable code from the server, when it sent one.
   *
   * `message` is written for a person and can be reworded at any time. `code`
   * is how a caller tells "the service is down" apart from "your request was
   * wrong" without matching on prose.
   */
  readonly code: string | null;

  constructor(
    message: string,
    options: {
      isOffline?: boolean;
      isTimeout?: boolean;
      status?: number | null;
      queued?: boolean;
      code?: string | null;
    } = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.isOffline = options.isOffline ?? false;
    this.isTimeout = options.isTimeout ?? false;
    this.status = options.status ?? null;
    this.queued = options.queued ?? false;
    this.code = options.code ?? null;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  /** Overrides the default budget for calls that legitimately take longer. */
  timeoutMs?: number;
  signal?: AbortSignal;
  /** When true and the request fails while offline, queue it for retry on reconnect. */
  queueOnOffline?: boolean;
};

/**
 * Distinguishes "we never reached the server" from "the server said no".
 *
 * A `TypeError: Network request failed` is what React Native throws for DNS
 * failure, connection refused, and a dead host. Those are all offline conditions
 * and the right response is to serve cache, not to show a failure.
 */
function classify(error: unknown, timedOut: boolean): ApiError {
  if (timedOut) {
    return new ApiError('The server took too long to respond.', { isOffline: false, isTimeout: true });
  }
  if (error instanceof ApiError) return error;
  if (error instanceof Error && error.name === 'AbortError') {
    return new ApiError('The request was cancelled.', { isOffline: true, isTimeout: true });
  }
  // React Native reports every transport failure as a generic TypeError.
  if (error instanceof TypeError) {
    return new ApiError('Cannot reach City Pulse right now.', { isOffline: true });
  }
  return new ApiError('Something went wrong. Please try again.');
}

/**
 * Performs a JSON request against the API and returns the parsed envelope.
 *
 * Throws `ApiError` for transport failures, timeouts, and non-2xx responses
 * alike, so callers have exactly one failure path to handle.
 */
export async function apiRequest<T = Record<string, unknown>>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  if (MOCK_API) {
    return { success: true, data: null, message: 'mock' } as unknown as T;
  }

  const { method = 'GET', body, token, timeoutMs = API_TIMEOUT_MS } = options;

  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  // Caller-supplied signals (screen unmount) are bridged rather than replaced,
  // so a manual refresh and a timeout cannot fight over the same controller.
  const onExternalAbort = () => controller.abort();
  options.signal?.addEventListener('abort', onExternalAbort);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => null)) as
      | (Record<string, unknown> & { success?: boolean; message?: string; code?: string })
      | null;

    if (!response.ok || !payload?.success) {
      // A 5xx is the server's problem, not the user's connectivity, so it is not
      // reported as offline — the UI offers "try again" rather than "you're
      // offline" for these.
      const message = response.status >= 500
        ? 'The service is temporarily unavailable. Please try again.'
        : (payload?.message as string | undefined) ?? `Request failed (${response.status}).`;
      throw new ApiError(message, {
        status: response.status,
        code: (payload?.code as string | undefined) ?? null,
      });
    }

    return payload as T;
  } catch (error) {
    const classified = classify(error, timedOut);
    if (options.queueOnOffline && classified.isOffline && options.method && options.method !== 'GET') {
      // Lazy import to avoid circular dependency.
      const { enqueueRequest } = await import('./offline-queue');
      await enqueueRequest({
        path,
        method: options.method,
        body: options.body,
        token: options.token ?? null,
      });
      throw new ApiError('You are offline. This action will be retried when you reconnect.', {
        isOffline: true,
        queued: true,
      });
    }
    throw classified;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', onExternalAbort);
  }
}

/** True when a caught error means "we never reached the server". */
export function isOfflineError(error: unknown): boolean {
  return error instanceof ApiError && error.isOffline;
}

/** A short, human sentence for a failed request, safe to show to a user. */
export function describeError(error: unknown, fallback = 'Something went wrong.'): string {
  if (error instanceof ApiError) {
    if (error.isOffline && error.isTimeout) {
      return 'The request timed out. Check your connection and try again.';
    }
    if (error.isOffline) {
      return "You're offline. Check your connection and try again.";
    }
    return error.message || fallback;
  }
  return fallback;
}
