import test from "node:test";
import assert from "node:assert/strict";
import { installBrowserMocks } from "./helpers/browser-mock.js";

const browser = installBrowserMocks();
const shopping = await import("../js/storage.js");
const admin = await import("../js/admin-data.js");

function reset() {
  browser.clear();
  browser.events.length = 0;
}

test("clearShoppingData empties both Favorites and Cart", () => {
  reset();
  shopping.toggleFavorite(121);
  shopping.addToCart(122, 3);
  const before = browser.events.length;
  shopping.clearShoppingData();
  assert.deepEqual(shopping.getFavoriteIds(), []);
  assert.deepEqual(shopping.getCartItems(), []);
  assert.equal(shopping.getCartItemCount(), 0);
  assert.deepEqual(browser.events.slice(before), ["technest:storage-change"]);
});

test("clearShoppingData does not erase Admin overrides or unrelated browser data", () => {
  reset();
  const saved = admin.saveCreatedProduct({ title: "Example", price: 10 });
  localStorage.setItem("unrelated-setting", "keep-me");
  shopping.toggleFavorite(saved.id);
  shopping.addToCart(saved.id);
  shopping.clearShoppingData();
  assert.equal(admin.getAdminOverrides().created.length, 1);
  assert.equal(localStorage.getItem("unrelated-setting"), "keep-me");
});

test("combined reset clears product changes, Favorites and Cart without recycling IDs", () => {
  reset();
  const created = admin.saveCreatedProduct({ title: "Temporary" });
  admin.saveUpdatedProduct(121, { title: "Edited" });
  admin.saveDeletedProduct(122);
  shopping.toggleFavorite(121);
  shopping.toggleFavorite(created.id);
  shopping.addToCart(121, 2);
  shopping.addToCart(created.id);
  const ids = admin.resetProductOverrides();
  shopping.clearShoppingData();
  assert.deepEqual(ids, [created.id]);
  assert.deepEqual(admin.getAdminOverrides(), { created: [], updated: {}, deleted: [] });
  assert.deepEqual(shopping.getFavoriteIds(), []);
  assert.deepEqual(shopping.getCartItems(), []);
  const next = admin.saveCreatedProduct({ title: "New" });
  assert.ok(next.id > created.id);
});
