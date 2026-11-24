import test from "node:test";
import assert from "node:assert/strict";
import { installBrowserMocks } from "./helpers/browser-mock.js";
import { completePurchase, addToCart, getCartItems, toggleFavorite, getFavoriteIds, clearShoppingData } from "../js/storage.js";
import { getOrderHistory, applyProductOverrides, saveCreatedProduct, saveUpdatedProduct, resetProductOverrides } from "../js/admin-data.js";
import { getProductById } from "../js/api.js";

const browser = installBrowserMocks();
const phone = { id: 121, title: "Phone", brand: "Tech", stock: 5, price: 199.99 };
const laptop = { id: 122, title: "Laptop", stock: 3, price: 500 };
const products = [phone, laptop];

globalThis.fetch = async (url) => ({
  ok: true,
  json: async () => products.find((p) => String(url).endsWith(`/${p.id}`)),
});

test("checkout reduces only purchased stock and product details use the updated stock", async () => {
  browser.clear();
  toggleFavorite(phone.id);
  addToCart(phone.id, 2, phone.stock);
  const order = completePurchase(products);
  assert.equal(order.quantity, 2);
  assert.equal(order.totalCents, 39998);
  assert.equal(getOrderHistory().length, 1);
  assert.equal(applyProductOverrides(products)[0].stock, 3);
  assert.equal((await getProductById(phone.id)).stock, 3);
  assert.equal(applyProductOverrides(products)[1].stock, 3);
  assert.deepEqual(getCartItems(), []);
  assert.deepEqual(getFavoriteIds(), [phone.id]);
});

test("multiple purchases preserve receipts and stop overselling, including stale stock", () => {
  browser.clear();
  addToCart(phone.id, 3);
  completePurchase(products);
  addToCart(phone.id, 3);
  assert.throws(() => completePurchase(products), /Not enough stock/);
  assert.deepEqual(getCartItems(), [{ id: phone.id, quantity: 3 }]);
  assert.equal(getOrderHistory().length, 1);
  clearShoppingData();
  addToCart(phone.id, 2);
  const second = completePurchase(products);
  assert.equal(applyProductOverrides(products)[0].stock, 0);
  assert.equal(getOrderHistory().length, 2);
  assert.notEqual(second.number, getOrderHistory()[1].number);
  assert.throws(() => addToCart(phone.id, 1, 0), /Maximum available/);
});

test("local products can be purchased and later edits do not alter old receipts", () => {
  browser.clear();
  const created = saveCreatedProduct({ title: "Local device", price: 10.25, stock: 4 });
  addToCart(created.id, 2);
  completePurchase([created]);
  assert.equal(applyProductOverrides([])[0].stock, 2);
  saveUpdatedProduct(created.id, { title: "New name", price: 20 });
  assert.equal(getOrderHistory()[0].items[0].title, "Local device");
  assert.equal(getOrderHistory()[0].totalCents, 2050);
});

test("Admin reset restores original stock and removes all saved receipts", () => {
  browser.clear();
  addToCart(phone.id, 2);
  completePurchase(products);
  toggleFavorite(phone.id);
  addToCart(laptop.id, 1);
  resetProductOverrides();
  clearShoppingData();
  assert.deepEqual(getOrderHistory(), []);
  assert.deepEqual(applyProductOverrides(products), products);
  assert.deepEqual(getCartItems(), []);
  assert.deepEqual(getFavoriteIds(), []);
});

test("failed inventory write restores the cart without creating a receipt or changing stock", () => {
  browser.clear();
  addToCart(phone.id, 2);
  const original = localStorage.setItem;
  localStorage.setItem = (key, value) => {
    if (key === "technest-admin-overrides-v1") throw new Error("Write failed");
    original(key, value);
  };
  const eventCount = browser.events.length;
  try {
    assert.throws(() => completePurchase(products), /Write failed/);
    assert.deepEqual(getCartItems(), [{ id: phone.id, quantity: 2 }]);
    assert.equal(getOrderHistory().length, 0);
    assert.equal(applyProductOverrides(products)[0].stock, phone.stock);
    assert.equal(browser.events.length, eventCount);
  } finally {
    localStorage.setItem = original;
  }
});

test("checkout rejects changed prices rather than silently charging a different amount", () => {
  browser.clear();
  addToCart(phone.id);
  saveUpdatedProduct(phone.id, { price: 300 });
  assert.throws(() => completePurchase(products), /price.*changed/);
  assert.equal(getOrderHistory().length, 0);
  assert.equal(getCartItems().length, 1);
});
