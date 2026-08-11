import { z } from "zod";
import { dbErrorStatus } from "./pg-errors";

/**
 * Pure HTTP helpers: no Next.js or database imports, so they can be
 * unit-tested in a plain Node environment.
 */

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function errorResponse(err: unknown) {
  if (err instanceof ApiError) {
    return json({ error: err.message }, err.status);
  }
  if (err instanceof z.ZodError) {
    return json({ error: "Invalid input", issues: err.issues }, 400);
  }
  // Known Postgres error codes -> clean, non-leaky client error.
  const dbErr = dbErrorStatus(err);
  if (dbErr) {
    return json({ error: dbErr.message }, dbErr.status);
  }
  console.error("API error:", err);
  return json({ error: "Internal server error" }, 500);
}

/** Read and parse a JSON body. */
export async function readJson<T>(req: Request): Promise<T> {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new ApiError(415, "Content-Type must be application/json");
  }
  try {
    return (await req.json()) as T;
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }
}