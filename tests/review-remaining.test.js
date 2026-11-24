import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { calculateCartSubtotal } from "../js/cart-utils.js";
import { getAdminErrorMessage } from "../js/admin-error.js";
import { installBrowserMocks, installElementMock } from "./helpers/browser-mock.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

test("cart subtotal is independently testable and excludes missing products", () => {
  assert.equal(calculateCartSubtotal([
    { id: 1, quantity: 2 }, { id: 2, quantity: 1 }, { id: 3, quantity: 4 },
  ], [
    { id: 1, price: 199.99 }, { id: 2, price: 800 },
  ]).toFixed(2), "1199.98");
  assert.equal(calculateCartSubtotal([], []), 0);
  assert.equal(calculateCartSubtotal([{ id: 3, quantity: 3 }], []), 0);
});

test("admin messages avoid exposing raw API errors", () => {
  assert.match(getAdminErrorMessage(new Error("The request timed out. Please try again.")), /took too long/i);
  assert.match(getAdminErrorMessage(new TypeError("Failed to fetch")), /connection/i);
  assert.match(getAdminErrorMessage(new Error("Product not found.")), /no longer available/i);
  assert.equal(getAdminErrorMessage(new Error("POST /products HTTP 500: secret debug info")), "Something went wrong. Please try again.");
});

test("all pages offer useful navigation when JavaScript is disabled", () => {
  for (const file of [
    "index.html", "pages/products.html", "pages/product.html",
    "pages/favorites.html", "pages/cart.html", "pages/admin.html",
  ]) {
    const html = read(file);
    assert.match(html, /<noscript>\s*<nav\b/);
    const base = file === "index.html" ? "./" : "../";
    for (const path of ["index.html", "pages/products.html", "pages/favorites.html", "pages/cart.html", "pages/admin.html"]) {
      assert.ok(html.includes(`href="${base}${path}"`), `${file} missing fallback link to ${path}`);
    }
  }
});

test("product cards expose only one sequential keyboard link to details", async () => {
  installBrowserMocks();
  const mock = installElementMock();
  const { createProductCard } = await import("../js/product-card.js");
  const card = createProductCard(
    { id: 121, title: "Example", brand: "Brand", category: "smartphones", price: 25, stock: 10 },
    { favoriteIds: new Set([121]) },
  );
  const imageLink = mock.findByClass(card, "product-card-image-link");
  const titleLink = mock.findByClass(card, "product-card-title-link");
  const heart = mock.findByClass(card, "product-card-favorite");
  assert.equal(imageLink.tabIndex, -1);
  assert.equal(imageLink.getAttribute("aria-hidden"), "true");
  assert.equal(titleLink.href, imageLink.href);
  assert.equal(heart.getAttribute("aria-pressed"), "true");
});
