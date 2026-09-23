export function webhookRequestBody(payload: unknown) {
  return typeof payload === "string" ? payload : JSON.stringify(payload);
}
