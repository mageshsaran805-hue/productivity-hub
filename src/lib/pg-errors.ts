/**
 * Maps Postgres error codes to HTTP status codes + safe client messages.
 * Pure module (no Next.js imports) so it can be unit-tested in isolation.
 */

const PG_ERROR_STATUS: Record<string, number> = {
  "23503": 400, // foreign_key_violation  -> referenced record missing
  "23505": 409, // unique_violation       -> duplicate value
  "23502": 400, // not_null_violation     -> required field missing
  "23514": 400, // check_violation        -> constraint failed
  "22P02": 400, // invalid_text_representation (bad uuid / enum / int cast)
  "22001": 400, // string_data_right_truncation
  "22007": 400, // invalid_datetime_format
  "22008": 400, // datetime_field_overflow
  "22003": 400, // numeric_value_out_of_range
  "42P01": 500, // undefined_table         (our bug, not the client's)
  "42703": 500, // undefined_column        (our bug, not the client's)
  "42501": 500, // insufficient_privilege  (should never happen post-revoke)
};

const PG_ERROR_MESSAGES: Record<string, string> = {
  "23503": "Referenced record does not exist",
  "23505": "A record with that value already exists",
  "23502": "A required field is missing",
  "23514": "Value failed a database constraint",
  "22P02": "Invalid value format",
  "22001": "Value is too long",
  "22007": "Invalid date format",
  "22008": "Date value is out of range",
  "22003": "Numeric value is out of range",
  "42P01": "Database table missing",
  "42703": "Database column missing",
  "42501": "Insufficient database privileges",
};

/**
 * Returns a safe HTTP status + message for a Postgres error, or null if the
 * error is not a known Postgres error code.
 */
export function dbErrorStatus(err: unknown): { status: number; message: string } | null {
  const code = (err as { code?: string })?.code;
  if (!code || !PG_ERROR_STATUS[code]) return null;
  return { status: PG_ERROR_STATUS[code], message: PG_ERROR_MESSAGES[code] ?? "Request failed" };
}
