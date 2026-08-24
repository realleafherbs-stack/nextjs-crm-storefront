export const FREE_SHIPPING_THRESHOLD = 299;

// Currency arithmetic (subtraction/addition on floats sourced from CRM) can
// produce results like 27.310000000000002 — always render exactly 2 decimals.
export function formatPrice(amount: number): string {
  return amount.toFixed(2);
}

// Same float-drift problem, but for server-side totals that need to stay a
// number (e.g. the Amount sent to Hyp Pay, or a value stored in an order) —
// rounds to the nearest cent instead of just formatting for display.
export function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}
