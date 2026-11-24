import test from "node:test";
import assert from "node:assert/strict";
import { installBrowserMocks } from "./helpers/browser-mock.js";

const browser = installBrowserMocks();
const calls = [];
const samples = {
  smartphones: [{ id: 121, title: "Phone", category: "smartphones", price: 100 }],
  laptops: [{ id: 122, title: "Laptop", category: "laptops", price: 400 }],
  tablets: [{ id: 123, title: "Tablet", category: "tablets", price: 200 }],
  "mobile-accessories": [
    { id: 124, title: "Case", category: "mobile-accessories", price: 10 },
  ],
};

globalThis.fetch = async (url, options = {}) => {
  const address = String(url);
  calls.push({ address, options });
  const category = address.match(/\/category\/([^?]+)/)?.[1];
  if (category) {
    return { ok: true, json: async () => ({ products: samples[category] }) };
  }
  if (address.endsWith("/add") && options.method === "POST") {
    return { ok: true, json: async () => ({ id: 195, ...JSON.parse(options.body) }) };
  }
  const id = Number(address.split("/").at(-1));
  if (id === 999) return { ok: false, status: 404 };
  if (options.method === "PUT") {
    return { ok: true, json: async () => ({ id, ...JSON.parse(options.body) }) };
  }
  if (options.method === "DELETE") {
    return { ok: true, json: async () => ({ id, isDeleted: true }) };
  }
  if (Number.isSafeInteger(id)) {
    return {
      ok: true,
      json: async () => Object.values(samples).flat().find((p) => p.id === id) ?? { id },
    };
  }
  return { ok: false, status: 404 };
};

const api = await import("../js/api.js");
const admin = await import("../js/admin-data.js");

test("four electronics categories are fetched and merged", async () => {
  browser.clear();
  calls.length = 0;
  const products = await api.getElectronicsProducts({ fresh: true });
  assert.deepEqual(products.map((product) => product.id), [121, 122, 123, 124]);
  assert.equal(calls.length, 4);
  assert.ok(calls.every(({ address }) => address.includes("?limit=0")));
});

test("locally created, updated and deleted products affect the catalogue", async () => {
  browser.clear();
  const local = admin.saveCreatedProduct({
    title: "Demo", category: "tablets", price: 900,
  });
  admin.saveUpdatedProduct(121, { price: 120 });
  admin.saveDeletedProduct(124);
  const products = await api.getElectronicsProducts();
  assert.equal(products.length, 4);
  assert.equal(products.find((p) => p.id === 121)?.price, 120);
  assert.equal(products.find((p) => p.id === local.id)?.title, "Demo");
  assert.equal(products.find((p) => p.id === 124), undefined);
  assert.equal((await api.getProductById(local.id)).title, "Demo");
});

test("detail requests reflect local updates", async () => {
  browser.clear();
  admin.saveUpdatedProduct(121, { title: "Edited phone" });
  const product = await api.getProductById(121);
  assert.equal(product.title, "Edited phone");
});

test("deleted product cannot be requested by its ID", async () => {
  browser.clear();
  admin.saveDeletedProduct(121);
  await assert.rejects(api.getProductById(121), /Product not found/);
});

test("POST, PUT and DELETE use their intended HTTP methods", async () => {
  browser.clear();
  calls.length = 0;
  await api.createProduct({ title: "Demo" });
  await api.updateProduct(121, { price: 99 });
  await api.deleteProduct(121);
  assert.ok(calls.some(({ address, options }) => address.endsWith("/add") && options.method === "POST"));
  assert.ok(calls.some(({ address, options }) => address.endsWith("/121") && options.method === "PUT"));
  assert.ok(calls.some(({ address, options }) => address.endsWith("/121") && options.method === "DELETE"));
});

test("server HTTP failures surface a readable error", async () => {
  browser.clear();
  await assert.rejects(api.updateProduct(999, { price: 10 }), /Product not found/);
});

test("invalid product IDs are rejected before fetching", async () => {
  browser.clear();
  const requests = calls.length;
  await assert.rejects(api.getProductById("abc"), /Invalid product ID/);
  assert.throws(() => api.deleteProduct(-1), /Invalid product ID/);
  assert.equal(calls.length, requests);
});
