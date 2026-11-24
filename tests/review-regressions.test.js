import test from "node:test";
import assert from "node:assert/strict";
import { installBrowserMocks } from "./helpers/browser-mock.js";

const browser = installBrowserMocks();
const storage = await import("../js/storage.js");
const admin = await import("../js/admin-data.js");

function reset() {
  browser.clear();
}

test("changing a cart quantity retains the existing product order", () => {
  reset();
  [1, 2, 3].forEach((id) => storage.addToCart(id));
  storage.setCartQuantity(1, 4);
  assert.deepEqual(storage.getCartItems(), [
    { id: 1, quantity: 4 },
    { id: 2, quantity: 1 },
    { id: 3, quantity: 1 },
  ]);
});

test("locally created product is included in the merged catalogue", () => {
  reset();
  const newProduct = admin.saveCreatedProduct({
    title: "Demo mouse", category: "mobile-accessories", price: 19.99,
  });
  const merged = admin.applyProductOverrides([{ id: 121, title: "API phone" }]);
  assert.equal(merged[0].id, newProduct.id);
  assert.equal(merged[0].title, "Demo mouse");
  assert.equal(merged[1].id, 121);
});

test("updates override only the matching original API product", () => {
  reset();
  admin.saveUpdatedProduct(121, { title: "New title", price: 249 });
  const merged = admin.applyProductOverrides([
    { id: 121, title: "Old title", price: 200 },
    { id: 122, title: "Other", price: 300 },
  ]);
  assert.equal(merged[0].title, "New title");
  assert.equal(merged[0].price, 249);
  assert.equal(merged[1].title, "Other");
});

test("deleted API products are hidden without modifying unrelated products", () => {
  reset();
  admin.saveDeletedProduct(121);
  assert.deepEqual(admin.applyProductOverrides([
    { id: 121 }, { id: 122 },
  ]), [{ id: 122 }]);
  assert.equal(admin.lookupProductOverride(121).type, "deleted");
});

test("reset returns created product IDs but preserves Favorites and Cart", () => {
  reset();
  const localProduct = admin.saveCreatedProduct({ title: "Demo" });
  storage.toggleFavorite(14);
  storage.addToCart(14);
  const removedIds = admin.resetProductOverrides();
  assert.deepEqual(removedIds, [localProduct.id]);
  assert.deepEqual(admin.getAdminOverrides(), { created: [], updated: {}, deleted: [] });
  assert.deepEqual(storage.getFavoriteIds(), [14]);
  assert.deepEqual(storage.getCartItems(), [{ id: 14, quantity: 1 }]);
});

test("locally generated IDs remain unique after reset", () => {
  reset();
  const first = admin.saveCreatedProduct({ title: "First" });
  admin.resetProductOverrides();
  const second = admin.saveCreatedProduct({ title: "Second" });
  assert.ok(second.id > first.id);
  assert.ok(first.id >= admin.LOCAL_PRODUCT_ID_START);
});

test("edits to a local product update its stored object", () => {
  reset();
  const product = admin.saveCreatedProduct({ title: "Before", price: 15 });
  admin.saveUpdatedProduct(product.id, { title: "After", price: 17 });
  assert.equal(admin.lookupProductOverride(product.id).product.title, "After");
  assert.equal(admin.lookupProductOverride(product.id).product.price, 17);
});

test("deleting a locally created product removes it from the local list", () => {
  reset();
  const local = admin.saveCreatedProduct({ title: "Temporary" });
  admin.saveDeletedProduct(local.id);
  assert.deepEqual(admin.getAdminOverrides().created, []);
});

test("corrupted admin override data is ignored safely", () => {
  reset();
  browser.entries.set("technest-admin-overrides-v1", "{bad-json");
  const previousWarn = console.warn;
  console.warn = () => {};
  try {
    assert.deepEqual(admin.getAdminOverrides(), { created: [], updated: {}, deleted: [] });
  } finally {
    console.warn = previousWarn;
  }
});
