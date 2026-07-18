const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(
    /\/$/,
    "",
  ) ?? "/api/v1";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: init.body
        ? { "Content-Type": "application/json", ...init.headers }
        : init.headers,
    });
  } catch {
    throw new ApiError(
      0,
      "Jukwaa could not reach the API. Check that the backend and PostgreSQL are running.",
    );
  }
  if (response.ok)
    return response.status === 204
      ? (undefined as T)
      : (response.json() as Promise<T>);
  let message = "Something went wrong. Please try again.";
  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (body.message)
      message = Array.isArray(body.message)
        ? body.message.join(". ")
        : body.message;
  } catch {
    /* Preserve the safe fallback for non-JSON responses. */
  }
  throw new ApiError(response.status, message);
}
