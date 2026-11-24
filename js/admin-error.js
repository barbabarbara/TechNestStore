/* Friendly Admin messages: keep diagnostic errors in the browser console. */
export function getAdminErrorMessage(error) {
  const detail = String(error?.message ?? "").toLowerCase();
  if (detail.includes("timed out") || detail.includes("abort")) {
    return "The request took too long. Please try again.";
  }
  if (
    detail.includes("connect") || detail.includes("network") ||
    detail.includes("failed to fetch") || detail.includes("unable to load")
  ) {
    return "Could not reach DummyJSON. Check your connection and try again.";
  }
  if (detail.includes("not found") || detail.includes("404")) {
    return "The product is no longer available. Refresh the inventory and try again.";
  }
  return "Something went wrong. Please try again.";
}
