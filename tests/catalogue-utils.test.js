import test from "node:test";
import assert from "node:assert/strict";
import { installBrowserMocks, installElementMock } from "./helpers/browser-mock.js";

const browser = installBrowserMocks();
const dom = installElementMock();
const { createProductCard } = await import("../js/product-card.js");

const phone = {
  id: 121,
  title: "Sample Phone",
  brand: "Acme",
  category: "smartphones",
  price: 199.99,
  stock: 5,
  images: ["front.png", "side.png", "back.png"],
  thumbnail: "cover.png",
  description: "Example device",
};

test("product card shows title, brand, price and detail links", () => {
  browser.clear();
  const card = createProductCard(phone);
  assert.equal(card.tagName, "LI");
  assert.equal(dom.findByClass(card, "product-card-title-link").href, "./product.html?id=121");
  assert.equal(dom.findByClass(card, "product-card-brand").textContent, "Acme");
  assert.equal(dom.findByClass(card, "product-card-price").textContent, "$199.99");
});

test("smartphone catalogue images use image index 2 if present", () => {
  browser.clear();
  const card = createProductCard(phone);
  assert.equal(dom.findByClass(card, "product-card-image").src, "back.png");
  const laptop = createProductCard({ ...phone, category: "laptops", id: 122 });
  assert.equal(dom.findByClass(laptop, "product-card-image").src, "cover.png");
});

test("favorite heart updates browser storage and calls page callback", () => {
  browser.clear();
  let callbackValue = null;
  const card = createProductCard(phone, {
    onFavoriteChange(_item, saved) { callbackValue = saved; },
  });
  const button = dom.findByClass(card, "product-card-favorite");
  assert.equal(button.getAttribute("aria-pressed"), "false");
  button.click();
  assert.equal(button.getAttribute("aria-pressed"), "true");
  assert.equal(button.textContent, "♥");
  assert.equal(callbackValue, true);
  button.click();
  assert.equal(button.textContent, "♡");
  assert.equal(callbackValue, false);
});

test("add-to-cart button adds one unit and reports total count", () => {
  browser.clear();
  let total = 0;
  const card = createProductCard(phone, {
    onCartChange(_item, count) { total = count; },
  });
  dom.findByClass(card, "add-to-cart-button").click();
  assert.equal(total, 1);
  assert.equal(browser.entries.has("technest-cart-v1"), true);
});

test("sold-out and invalid-price products have disabled add buttons", () => {
  browser.clear();
  assert.equal(dom.findByClass(createProductCard({ ...phone, stock: 0 }), "add-to-cart-button").disabled, true);
  assert.equal(dom.findByClass(createProductCard({ ...phone, price: NaN }), "add-to-cart-button").disabled, true);
});
