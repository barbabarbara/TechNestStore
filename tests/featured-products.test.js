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

// Keep the original sold-out laptop fixture for the three-product tests.
const macBook = {
  id: 5,
  title: "MacBook Pro",
  brand: "Apple",
  category: "laptops",
  stock: 5,
  price: 1299.99,
};
const tenProducts = [
  ...products,
  macBook,
  { id: 6, title: "Samsung Galaxy S10", category: "smartphones", stock: 5, price: 399.99 },
  { id: 7, title: "Lenovo ThinkPad", category: "laptops", stock: 5, price: 899.99 },
  { id: 8, title: "Samsung Galaxy Tab", category: "tablets", stock: 5, price: 349.99 },
  { id: 9, title: "Apple Watch", category: "mobile-accessories", stock: 5, price: 249.99 },
  { id: 10, title: "iPhone 6", category: "smartphones", stock: 5, price: 249.99 },
  { id: 11, title: "Huawei MateBook", category: "laptops", stock: 5, price: 999.99 },
];
const expectedFeaturedIds = [3, 2, 1, 5, 6, 7, 8, 9, 10, 11];

function setup(t, { reducedMotion = false } = {}) {
  t.mock.timers.enable({ apis: ["setInterval"] });
  installBrowserMocks();
  installElementMock();
  const ids = ["slide", "status", "controls", "prev", "next", "pagination", "dots", "count",
    "image", "brand", "name", "tagline", "description", "price", "link", "carousel", "rotation"];
  const elements = Object.fromEntries(ids.map((id) => [id, document.createElement("div")]));
  elements.dots.replaceChildren = (...children) => { elements.dots.children = children; };
  document.querySelector = (selector) => elements[selector.replace("#featured-", "")] || null;
  const documentListeners = new Map();
  const motion = {
    matches: reducedMotion,
    addEventListener(type, callback) { this.listener = callback; },
  };
  window.matchMedia = () => motion;
  document.hidden = false;
  document.addEventListener = (type, callback) => documentListeners.set(type, callback);
  elements.emit = (id, type, event = {}) => elements[id].listeners.get(type)?.(event);
  elements.setHidden = (hidden) => {
    document.hidden = hidden;
    documentListeners.get("visibilitychange")();
  };
  elements.setReducedMotion = (matches) => {
    motion.matches = matches;
    motion.listener({ matches });
  };
  return elements;
}

test("featured selection shows three products when the laptop is sold out", () => {
  assert.deepEqual(selectFeaturedProducts(products).map((p) => p.id), [3, 2, 1]);
  assert.deepEqual(selectFeaturedProducts([{ ...products[0], stock: 0 }]), []);
});

test("carousel shows live price, wraps both directions and supports dot navigation", async (t) => {
  const el = setup(t);
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

test("single available product hides navigation arrows", async (t) => {
  const el = setup(t);
  await initFeaturedProducts({ loadProducts: async () => [products[0]] });
  assert.equal(el.slide.hidden, false);
  assert.equal(el.controls.hidden, true);
  assert.equal(el.count.textContent, "1 of 1");
});

test("empty inventory displays a useful message rather than a blank carousel", async (t) => {
  const el = setup(t);
  await initFeaturedProducts({ loadProducts: async () => [] });
  assert.equal(el.slide.hidden, true);
  assert.equal(el.controls.hidden, true);
  assert.match(el.status.textContent, /No featured products/);
});

test("API failure hides the carousel and shows an error message", async (t) => {
  const el = setup(t);
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

test("partial catalogue warning stays visible while switching featured products", async (t) => {
  const el = setup(t);
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


test("carousel rotates every six seconds and wraps to the first product", async (t) => {
  const el = setup(t);
  await initFeaturedProducts({ loadProducts: async () => products });
  t.mock.timers.tick(5999);
  assert.equal(el.count.textContent, "1 of 3");
  t.mock.timers.tick(1);
  assert.equal(el.count.textContent, "2 of 3");
  t.mock.timers.tick(6000);
  assert.equal(el.count.textContent, "3 of 3");
  t.mock.timers.tick(6000);
  assert.equal(el.count.textContent, "1 of 3");
  assert.equal(el.slide.getAttribute("aria-live"), "off");
});

test("Pause, Play and manual navigation control automatic rotation", async (t) => {
  const el = setup(t);
  await initFeaturedProducts({ loadProducts: async () => products });
  el.rotation.click();
  t.mock.timers.tick(6000);
  assert.equal(el.count.textContent, "1 of 3");
  assert.equal(el.rotation.getAttribute("aria-label"), "Start automatic rotation");
  assert.equal(el.slide.getAttribute("aria-live"), "polite");
  el.rotation.click();
  t.mock.timers.tick(6000);
  assert.equal(el.count.textContent, "2 of 3");
  el.next.click();
  t.mock.timers.tick(12000);
  assert.equal(el.count.textContent, "3 of 3");
});

test("hover and hidden tabs pause rotation temporarily; focus stops it", async (t) => {
  const el = setup(t);
  await initFeaturedProducts({ loadProducts: async () => products });
  el.emit("carousel", "mouseenter");
  t.mock.timers.tick(6000);
  assert.equal(el.count.textContent, "1 of 3");
  el.emit("carousel", "mouseleave");
  el.setHidden(true);
  t.mock.timers.tick(6000);
  assert.equal(el.count.textContent, "1 of 3");
  el.setHidden(false);
  t.mock.timers.tick(6000);
  assert.equal(el.count.textContent, "2 of 3");
  el.emit("carousel", "focusin");
  t.mock.timers.tick(6000);
  assert.equal(el.count.textContent, "2 of 3");
});

test("reduced motion disables autoplay; explicit Play is still available", async (t) => {
  const el = setup(t, { reducedMotion: true });
  await initFeaturedProducts({ loadProducts: async () => products });
  t.mock.timers.tick(6000);
  assert.equal(el.count.textContent, "1 of 3");
  el.rotation.click();
  t.mock.timers.tick(6000);
  assert.equal(el.count.textContent, "2 of 3");
  el.setReducedMotion(true);
  t.mock.timers.tick(6000);
  assert.equal(el.count.textContent, "2 of 3");
});

test("pointer Pause click still pauses when focus enters before click", async (t) => {
  const el = setup(t);
  await initFeaturedProducts({ loadProducts: async () => products });
  el.emit("rotation", "pointerdown");
  el.emit("carousel", "focusin");
  el.emit("rotation", "click", { detail: 1 });
  t.mock.timers.tick(6000);
  assert.equal(el.count.textContent, "1 of 3");
  assert.equal(el.rotation.getAttribute("aria-label"), "Start automatic rotation");
});

test("refresh with one product stops the existing interval", async (t) => {
  const el = setup(t);
  let items = products;
  await initFeaturedProducts({ loadProducts: async () => items });
  items = [products[0]];
  window.dispatchEvent(new Event("technest:catalogue-change"));
  await Promise.resolve();
  await Promise.resolve();
  t.mock.timers.tick(12000);
  assert.equal(el.count.textContent, "1 of 1");
  assert.equal(el.controls.hidden, true);
  assert.equal(el.slide.getAttribute("aria-live"), "polite");
});


test("featured selection returns ten preferred products across all four categories", () => {
  const otherLaptop = { ...macBook, id: 12, title: "ThinkPad" };
  const otherPhone = { ...products[0], id: 13, title: "Other smartphone" };
  const selected = selectFeaturedProducts([otherLaptop, otherPhone, ...tenProducts]);

  assert.deepEqual(selected.map((product) => product.id), expectedFeaturedIds);
  assert.equal(new Set(selected.map((product) => product.category)).size, 4);
  assert.equal(new Set(selected.map((product) => product.id)).size, 10);
  assert.ok(selected.every((product) => product.stock > 0));
});

test("sold-out preferred laptop is replaced by an available laptop in the same category", () => {
  const otherLaptop = { ...macBook, id: 12, title: "ThinkPad" };
  const selected = selectFeaturedProducts([
    ...products,
    { ...macBook, stock: 0 },
    otherLaptop,
  ]);

  assert.deepEqual(selected.map((product) => product.id), [3, 2, 1, 12]);
  assert.ok(selected.every((product) => product.stock > 0));
});

test("missing categories are filled with available products up to ten unique products", () => {
  const phones = Array.from({ length: 12 }, (_, index) => ({
    ...products[0],
    id: index + 20,
    title: `Other smartphone ${index + 1}`,
  }));
  const selected = selectFeaturedProducts([
    products[0],
    ...phones,
    { ...phones[0] },
  ]);
  const ids = selected.map((product) => product.id);

  assert.equal(selected.length, 10);
  assert.equal(new Set(ids).size, 10);
  assert.equal(ids[0], 1);
  assert.ok(selected.every((product) => product.category === "smartphones"));
});

test("selection excludes duplicate IDs, sold-out items and invalid products", () => {
  const selected = selectFeaturedProducts([
    ...tenProducts,
    { ...tenProducts[0] },
    { id: 12, title: "Samsung phone", category: "smartphones", stock: 0, price: 10 },
    { id: 13, title: "Samsung tablet", category: "tablets", stock: 3, price: -1 },
    { id: 14, title: "Watch", category: "watches", stock: 3, price: 10 },
    { id: 0, title: "Huawei laptop", category: "laptops", stock: 3, price: 10 },
  ]);

  assert.deepEqual(selected.map((product) => product.id), expectedFeaturedIds);
  assert.equal(new Set(selected.map((product) => product.id)).size, 10);
  // With unfilled slots, invalid items must still not be used as fallback.
  assert.deepEqual(selectFeaturedProducts([
    products[0],
    { ...products[0] },
    { ...products[1], stock: 0 },
    { ...products[2], price: -1 },
    { ...macBook, category: "watches" },
    { ...macBook, id: 0 },
  ]).map((product) => product.id), [1]);
});

test("carousel rotates through ten products and wraps after a full minute", async (t) => {
  const el = setup(t);
  await initFeaturedProducts({ loadProducts: async () => tenProducts });

  assert.equal(el.dots.children.length, 10);
  assert.equal(el.count.textContent, "1 of 10");
  t.mock.timers.tick(5999);
  assert.equal(el.count.textContent, "1 of 10");
  t.mock.timers.tick(1);

  for (let index = 1; index < expectedFeaturedIds.length; index++) {
    const id = expectedFeaturedIds[index];
    assert.equal(el.count.textContent, `${index + 1} of 10`);
    assert.equal(el.name.textContent, tenProducts.find((product) => product.id === id).title);
    assert.equal(el.link.href, `./pages/product.html?id=${id}`);
    assert.equal(el.dots.children[index].getAttribute("aria-current"), "true");
    assert.equal(el.dots.children.filter((dot) => dot.getAttribute("aria-current") === "true").length, 1);
    t.mock.timers.tick(6000);
  }

  assert.equal(el.count.textContent, "1 of 10");
  assert.equal(el.slide.getAttribute("aria-live"), "off");
});

test("manual navigation wraps across ten products and pauses autoplay until Play", async (t) => {
  const el = setup(t);
  await initFeaturedProducts({ loadProducts: async () => tenProducts });

  el.prev.click();
  assert.equal(el.count.textContent, "10 of 10");
  el.next.click();
  assert.equal(el.count.textContent, "1 of 10");
  el.dots.children[9].click();
  assert.equal(el.count.textContent, "10 of 10");
  assert.equal(el.dots.children[9].getAttribute("aria-current"), "true");
  t.mock.timers.tick(12000);
  assert.equal(el.count.textContent, "10 of 10");
  el.rotation.click();
  t.mock.timers.tick(6000);
  assert.equal(el.count.textContent, "1 of 10");
});
