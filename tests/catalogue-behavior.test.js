import test from "node:test";
import assert from "node:assert/strict";
import { installBrowserMocks, installElementMock, withDocumentHead } from "./helpers/browser-mock.js";

installBrowserMocks();
installElementMock();

class Element {
  constructor(tag = "div") {
    this.tagName = tag.toUpperCase();
    this.dataset = {};
    this.children = [];
    this.options = [];
    this.listeners = new Map();
    this.attributes = {};
    this.value = "";
    this.disabled = true;
    this.textContent = "";
    this.innerHTML = "";
  }
  append(...elements) {
    this.children.push(...elements);
    if (this.tagName === "SELECT") this.options.push(...elements);
  }
  replaceChildren(...children) {
    this.children = children.flatMap((child) =>
      child.tagName === "FRAGMENT" ? child.children : [child],
    );
  }
  addEventListener(type, callback) {
    this.listeners.set(type, callback);
  }
  setAttribute(key, value) {
    this.attributes[key] = String(value);
  }
}

const elements = new Map();
for (const id of [
  "site-header", "site-footer", "product-list", "catalogue-status",
  "catalogue-action-status", "product-search", "category-filter",
  "brand-filter", "sort-select", "clear-filters",
]) elements.set(`#${id}`, new Element(id.includes("filter") || id.includes("select") ? "select" : "div"));

const categories = ["", "smartphones", "laptops", "tablets", "mobile-accessories"];
elements.get("#category-filter").options = categories.map((value) => ({ value }));
elements.get("#brand-filter").options = [{ value: "" }];
elements.get("#sort-select").value = "default";

globalThis.document = withDocumentHead({
  body: { dataset: { root: "../", page: "products" } },
  querySelector(selector) { return elements.get(selector) ?? null; },
  createElement(tag) { return new Element(tag); },
  createDocumentFragment() { return new Element("fragment"); },
});
window.location = { search: "?category=tablets" };

const samples = {
  smartphones: [
    { id: 1, title: "Orion phone", brand: "Orion", category: "smartphones", price: 300, stock: 8 },
    { id: 2, title: "Nova phone", brand: "Nova", category: "smartphones", price: 200, stock: 8 },
  ],
  laptops: [
    { id: 3, title: "Studio laptop", brand: "Studio", category: "laptops", price: 850, stock: 8 },
  ],
  tablets: [
    { id: 4, title: "Pocket tablet", brand: "Pocket", category: "tablets", price: 240, stock: 8 },
  ],
  "mobile-accessories": [
    { id: 5, title: "Travel charger", brand: "Travel", category: "mobile-accessories", price: 30, stock: 8 },
  ],
};

globalThis.fetch = async (url) => {
  const category = String(url).match(/\/category\/([^?]+)/)?.[1];
  return { ok: true, json: async () => ({ products: samples[category] ?? [] }) };
};

await import("../js/products.js");
await new Promise((resolve) => setImmediate(resolve));

const get = (id) => elements.get(`#${id}`);
const visibleIds = () => get("product-list").children.map((card) => Number(card.dataset.productId));
const trigger = (id, event = "change") => get(id).listeners.get(event)();

test("homepage category query automatically activates the matching catalogue filter", () => {
  assert.equal(get("category-filter").value, "tablets");
  assert.deepEqual(visibleIds(), [4]);
});

test("clear filters restores the complete product catalogue", () => {
  trigger("clear-filters", "click");
  assert.deepEqual(visibleIds(), [1, 2, 3, 4, 5]);
});

test("search, category filtering and ascending price sort work together", async () => {
  get("product-search").value = "PHONE";
  get("category-filter").value = "smartphones";
  get("sort-select").value = "price-asc";
  trigger("product-search", "input");
  // Debounced input should not immediately redraw the catalogue.
  assert.deepEqual(visibleIds(), [1, 2, 3, 4, 5]);
  await new Promise((resolve) => setTimeout(resolve, 210));
  assert.deepEqual(visibleIds(), [2, 1]);
});

test("brand filtering and empty search results work", async () => {
  trigger("clear-filters", "click");
  get("brand-filter").value = "Studio";
  trigger("brand-filter");
  assert.deepEqual(visibleIds(), [3]);
  get("product-search").value = "not-present";
  trigger("product-search", "input");
  await new Promise((resolve) => setTimeout(resolve, 210));
  assert.deepEqual(visibleIds(), []);
  assert.match(get("catalogue-status").textContent, /No products match/);
});
