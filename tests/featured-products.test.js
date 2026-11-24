import test from "node:test";
import assert from "node:assert/strict";
import { initFeaturedProducts, selectFeaturedProducts } from "../js/featured-products.js";
import { installBrowserMocks, installElementMock } from "./helpers/browser-mock.js";

const products = [
  { id: 1, title: "iPhone 5s", category: "smartphones", stock: 3, price: 199.99 },
  { id: 2, title: "iPad Mini 2021", category: "tablets", stock: 4, price: 499.99 },
  { id: 3, title: "Apple AirPods Max Silver", brand: "Apple", category: "mobile-accessories", stock: 2, price: 549.99 },
  { id: 4, title: "Laptop", category: "laptops", stock: 0, price: 1200 },
];

function setup() {
  installBrowserMocks();
  installElementMock();
  const ids = ["slide", "status", "controls", "prev", "next", "pagination", "dots", "count",
    "image", "brand", "name", "tagline", "description", "price", "link"];
  const elements = Object.fromEntries(ids.map((id) => [id, document.createElement("div")]));
  elements.dots.replaceChildren = (...children) => { elements.dots.children = children; };
  document.querySelector = (selector) => elements[selector.replace("#featured-", "")] || null;
  return elements;
}

test("featured selection prefers the three showcased products and excludes sold-out stock", () => {
  assert.deepEqual(selectFeaturedProducts(products).map((p) => p.id), [3, 2, 1]);
  assert.deepEqual(selectFeaturedProducts([{ ...products[0], stock: 0 }]), []);
});

test("carousel shows live price, wraps both directions and supports dot navigation", async () => {
  const el = setup();
  await initFeaturedProducts({ loadProducts: async () => products });
  assert.equal(el.name.textContent, products[2].title);
  assert.equal(el.price.textContent, "$549.99");
  assert.equal(el.link.href, "./pages/product.html?id=3");
  assert.equal(el.count.textContent, "1 of 3");
  el.prev.click();
  assert.equal(el.count.textContent, "3 of 3");
  el.next.click();
  assert.equal(el.count.textContent, "1 of 3");
  el.dots.children[1].click();
  assert.equal(el.count.textContent, "2 of 3");
  assert.equal(el.dots.children[1].getAttribute("aria-current"), "true");
  assert.equal(el.dots.children[0].getAttribute("aria-current"), "false");
});

test("single available product hides navigation arrows", async () => {
  const el = setup();
  await initFeaturedProducts({ loadProducts: async () => [products[0]] });
  assert.equal(el.slide.hidden, false);
  assert.equal(el.controls.hidden, true);
  assert.equal(el.count.textContent, "1 of 1");
});

test("empty inventory displays a useful message rather than a blank carousel", async () => {
  const el = setup();
  await initFeaturedProducts({ loadProducts: async () => [] });
  assert.equal(el.slide.hidden, true);
  assert.equal(el.controls.hidden, true);
  assert.match(el.status.textContent, /No featured products/);
});

test("API failure hides the carousel and shows an error message", async () => {
  const el = setup();
  const previousError = console.error;
  console.error = () => {};
  try {
    await initFeaturedProducts({ loadProducts: async () => { throw new Error("offline"); } });
  } finally {
    console.error = previousError;
  }
  assert.equal(el.slide.hidden, true);
  assert.match(el.status.textContent, /Unable to load featured products/);
});

test("partial catalogue warning stays visible while switching featured products", async () => {
  const el = setup();
  await initFeaturedProducts({ loadProducts: async ({ onWarning }) => {
    onWarning("Warning: Could not load all product categories (laptops).");
    return products;
  } });
  assert.equal(el.slide.hidden, false);
  assert.match(el.status.textContent, /Warning:.*laptops/);
  el.next.click();
  assert.equal(el.count.textContent, "2 of 3");
  assert.match(el.status.textContent, /Warning:.*laptops/);
});
