import test from "node:test";
import assert from "node:assert/strict";
import { installBrowserMocks } from "./helpers/browser-mock.js";

const browser = installBrowserMocks();
const storage = await import("../js/storage.js");

function reset() {
  browser.clear();
  browser.events.length = 0;
}

test("favorite toggle persists an ID and removes it on a second click", () => {
  reset();
  assert.equal(storage.toggleFavorite(121), true);
  assert.deepEqual(storage.getFavoriteIds(), [121]);
  assert.equal(storage.isFavorite(121), true);
  assert.equal(storage.toggleFavorite(121), false);
  assert.deepEqual(storage.getFavoriteIds(), []);
});

test("favorites discard invalid IDs and duplicate IDs", () => {
  reset();
  browser.entries.set("technest-favorites", '[121,121,0,-1,"122",122]');
  assert.deepEqual(storage.getFavoriteIds(), [121, 122]);
  assert.throws(() => storage.toggleFavorite("122"), /Invalid product ID/);
});

test("adding the same cart item twice increases its quantity", () => {
  reset();
  storage.addToCart(42);
  storage.addToCart(42);
  assert.deepEqual(storage.getCartItems(), [{ id: 42, quantity: 2 }]);
  assert.equal(storage.getCartItemCount(), 2);
});

test("cart count adds quantities, not the number of unique products", () => {
  reset();
  storage.addToCart(121, 2);
  storage.addToCart(122, 3);
  assert.equal(storage.getCartItemCount(), 5);
});

test("cart quantity can be set precisely or set to zero to remove an item", () => {
  reset();
  storage.addToCart(8);
  storage.setCartQuantity(8, 3);
  assert.equal(storage.getCartItems()[0].quantity, 3);
  storage.setCartQuantity(8, 0);
  assert.deepEqual(storage.getCartItems(), []);
});

test("cart is limited to 99 and can enforce a lower stock level", () => {
  reset();
  storage.addToCart(8, 150);
  assert.equal(storage.getCartItems()[0].quantity, 99);
  storage.addToCart(9, 8, 4);
  assert.equal(storage.getCartItems().find((item) => item.id === 9).quantity, 4);
  assert.throws(() => storage.addToCart(9, 1, 4), /Maximum available/);
});

test("cart validation rejects invalid IDs and quantities", () => {
  reset();
  assert.throws(() => storage.addToCart(0), /Invalid cart item/);
  assert.throws(() => storage.addToCart(1, -2), /Invalid cart item/);
  assert.throws(() => storage.setCartQuantity(1, 100), /Invalid quantity/);
  assert.throws(() => storage.setCartQuantity(1, 2.5), /Invalid quantity/);
});

test("malformed stored JSON returns empty arrays without crashing", () => {
  reset();
  browser.entries.set("technest-favorites", "invalid-json");
  browser.entries.set("technest-cart-v1", "invalid-json");
  const previousWarn = console.warn;
  console.warn = () => {};
  try {
    assert.deepEqual(storage.getFavoriteIds(), []);
    assert.deepEqual(storage.getCartItems(), []);
  } finally {
    console.warn = previousWarn;
  }
});

test("duplicate cart entries are combined, and invalid entries are ignored", () => {
  reset();
  browser.entries.set("technest-cart-v1", JSON.stringify([
    { id: 12, quantity: 2 },
    { id: 12, quantity: 3 },
    { id: 0, quantity: 10 },
    { id: 14, quantity: -2 },
  ]));
  assert.deepEqual(storage.getCartItems(), [{ id: 12, quantity: 5 }]);
});

test("removing an item leaves all unrelated items unchanged", () => {
  reset();
  storage.addToCart(4);
  storage.addToCart(5, 3);
  storage.removeFromCart(4);
  assert.deepEqual(storage.getCartItems(), [{ id: 5, quantity: 3 }]);
});

test("saving data dispatches an event for the current browser tab", () => {
  reset();
  storage.toggleFavorite(3);
  storage.addToCart(3);
  assert.deepEqual(browser.events, [
    "technest:storage-change",
    "technest:storage-change",
  ]);
});
