export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** Fetches JSON, turning the API's `{ error }` shape into an HttpError. */
export async function fetchJson<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, init);

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new HttpError(res.status, body?.error ?? "Request failed");
  }

  return res.json() as Promise<T>;
}
