/* === TechNestStore | Browser storage === */

const FAVORITES_KEY = "technest-favorites";
const CART_KEY = "technest-cart-v1";
export const MAX_CART_QUANTITY = 99;

function validId(id) {
  return Number.isSafeInteger(id) && id > 0;
}

// localStorage stores strings, so JSON.parse converts them back to arrays.
function readArray(key) {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return [];
    const result = JSON.parse(value);
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.warn(`Could not read ${key}:`, error);
    return [];
  }
}

function saveArray(key, items) {
  // Let storage errors reach the calling page so it can notify the visitor.
  localStorage.setItem(key, JSON.stringify(items));

  // localStorage's native "storage" event does not fire in the same tab.
  window.dispatchEvent(new Event("technest:storage-change"));
}

export function getFavoriteIds() {
  return [...new Set(readArray(FAVORITES_KEY).filter(validId))];
}

export function isFavorite(id) {
  return getFavoriteIds().includes(id);
}

// Returns the NEW saved state: true = saved, false = removed.
export function toggleFavorite(id) {
  if (!validId(id)) throw new Error("Invalid product ID.");
  const ids = getFavoriteIds();
  const wasSaved = ids.includes(id);
  const updated = wasSaved ? ids.filter((item) => item !== id) : [...ids, id];
  saveArray(FAVORITES_KEY, updated);
  return !wasSaved;
}

export function getCartItems() {
  const quantities = new Map();
  for (const item of readArray(CART_KEY)) {
    if (!item || !validId(item.id)) continue;
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) continue;
    const previous = quantities.get(item.id) || 0;
    quantities.set(
      item.id,
      Math.min(MAX_CART_QUANTITY, previous + item.quantity),
    );
  }
  return [...quantities].map(([id, quantity]) => ({ id, quantity }));
}

export function getCartItemCount() {
  return getCartItems().reduce((total, item) => total + item.quantity, 0);
}

export function addToCart(
  id,
  quantity = 1,
  availableStock = MAX_CART_QUANTITY,
) {
  if (!validId(id) || !Number.isSafeInteger(quantity) || quantity < 1) {
    throw new Error("Invalid cart item.");
  }
  // A known API stock quantity may impose a stricter limit than 99.
  const limit = Number.isSafeInteger(availableStock)
    ? Math.min(MAX_CART_QUANTITY, availableStock)
    : MAX_CART_QUANTITY;
  const items = getCartItems();
  const existing = items.find((item) => item.id === id);
  if (limit < 1 || (existing && existing.quantity >= limit)) {
    throw new Error("Maximum available quantity reached.");
  }

  if (existing) {
    existing.quantity = Math.min(limit, existing.quantity + quantity);
  } else {
    items.push({ id, quantity: Math.min(limit, quantity) });
  }

  saveArray(CART_KEY, items);
  return getCartItemCount();
}

// Quantity 0 removes the item. Maximum quantity is 99.
export function setCartQuantity(id, quantity) {
  if (
    !validId(id) ||
    !Number.isSafeInteger(quantity) ||
    quantity < 0 ||
    quantity > MAX_CART_QUANTITY
  ) {
    throw new Error("Invalid quantity.");
  }
  const updated = getCartItems()
    .filter((item) => item.id !== id || quantity > 0)
    .map((item) => (item.id === id ? { ...item, quantity } : item));
  saveArray(CART_KEY, updated);
}

export function removeFromCart(id) {
  if (!validId(id)) throw new Error("Invalid product ID.");
  saveArray(
    CART_KEY,
    getCartItems().filter((item) => item.id !== id),
  );
}

export function clearShoppingData() {
  localStorage.removeItem("technest-favorites");
  localStorage.removeItem("technest-cart-v1");

  window.dispatchEvent(new Event("technest:storage-change"));
}

// Complete a simulated purchase without removing saved favorites.
export function clearCart() {
  saveArray(CART_KEY, []);
}
