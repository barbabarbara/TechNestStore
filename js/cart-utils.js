/* Pure cart calculations, independent of the DOM and localStorage. */
export function calculateCartSubtotal(entries, products) {
  const prices = new Map(
    products
      .filter((product) => product && Number.isFinite(product.price))
      .map((product) => [product.id, product.price]),
  );
  return entries.reduce((subtotal, entry) => {
    const price = prices.get(entry.id);
    return price === undefined ? subtotal : subtotal + price * entry.quantity;
  }, 0);
}
