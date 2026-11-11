/**
 * Llamadas al proxy de sesión del propio panel (/api/session/*). El refresh token queda en
 * una cookie httpOnly que JavaScript no puede leer; aquí solo llega el access token.
 */
export type SessionAction = "login" | "verify-email" | "refresh" | "logout";

export class SessionError extends Error {
  constructor(message: string, public status: number, public response: { status: number; data: any }) {
    super(message);
  }
}

export async function sessionRequest(action: SessionAction, body: Record<string, unknown> = {}): Promise<any> {
  const res = await fetch(`/api/session/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    cache: "no-store",
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = json?.message || json?.error || "Error de sesión";
    // Misma forma que un error de axios (err.response.data.message) para los formularios.
    throw new SessionError(Array.isArray(message) ? message.join(", ") : String(message), res.status, { status: res.status, data: json });
  }
  return json;
}
