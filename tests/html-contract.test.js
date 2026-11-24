import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const pages = [
  ["index.html", "home", "./", "./js/main.js"],
  ["pages/products.html", "products", "../", "../js/products.js"],
  ["pages/product.html", "products", "../", "../js/product.js"],
  ["pages/favorites.html", "favorites", "../", "../js/favorites.js"],
  ["pages/cart.html", "cart", "../", "../js/cart.js"],
  ["pages/admin.html", "admin", "../", "../js/admin.js"],
];

test("all six pages have working shared layout placeholders and one stylesheet", () => {
  for (const [file, page, rootPath] of pages) {
    const html = read(file);
    assert.match(html, /id="site-header"/, `${file}: missing shared header`);
    assert.match(html, /id="site-footer"/, `${file}: missing shared footer`);
    assert.ok(html.includes(`data-page="${page}"`), `${file}: wrong page label`);
    assert.ok(html.includes(`data-root="${rootPath}"`), `${file}: wrong root path`);
    const cssLinks = [...html.matchAll(/<link\b[^>]*rel="stylesheet"/g)];
    assert.equal(cssLinks.length, 1, `${file}: should load one CSS file`);
    assert.ok(html.includes(`${rootPath}css/style.css`), `${file}: wrong stylesheet path`);
  }
});

test("every page loads a module that exists in the project", () => {
  for (const [file, , , modulePath] of pages) {
    const html = read(file);
    assert.ok(html.includes(`src="${modulePath}"`), `${file}: missing module script`);
    assert.ok(existsSync(resolve(root, dirname(file), modulePath)), `${file}: missing module file`);
  }
});

test("home category cards link to all four matching catalogue filters", () => {
  const homepage = read("index.html");
  const actual = [...homepage.matchAll(/href="\.\/pages\/products\.html\?category=([a-z-]+)"/g)]
    .map((match) => match[1]);
  assert.deepEqual(actual, [
    "smartphones", "laptops", "tablets", "mobile-accessories",
  ]);
});

test("homepage preserves the About TechNest button managed by main.js", () => {
  const homepage = read("index.html");
  const script = read("js/main.js");
  assert.match(homepage, /id="information-button"/);
  assert.match(homepage, /id="store-information"/);
  assert.match(script, /#information-button/);
  assert.match(script, /#store-information/);
});

test("homepage artwork referenced by HTML exists locally", () => {
  const homepage = read("index.html");
  const paths = [...homepage.matchAll(/(?:src)="(\.\/assets\/images\/[^"]+)"/g)]
    .map((match) => match[1]);
  assert.ok(paths.length >= 5, "Expected homepage product imagery");
  for (const path of paths) {
    assert.ok(existsSync(resolve(root, path)), `Image not found: ${path}`);
  }
});

test("Catalogue and Admin have the JavaScript hooks their modules require", () => {
  const catalogue = read("pages/products.html");
  const admin = read("pages/admin.html");
  for (const id of [
    "product-list", "product-search", "category-filter", "brand-filter",
    "sort-select", "clear-filters", "catalogue-action-status",
  ]) {
    assert.ok(catalogue.includes(`id="${id}"`), `Catalogue missing ${id}`);
  }
  for (const id of [
    "admin-product-form", "admin-products", "admin-search", "admin-feedback",
    "admin-reset", "admin-retry", "admin-title", "admin-category",
  ]) {
    assert.ok(admin.includes(`id="${id}"`), `Admin missing ${id}`);
  }
});

test("Homepage category query is processed by products.js", () => {
  const code = read("js/products.js");
  assert.match(code, /URLSearchParams/);
  assert.match(code, /categoryFilter\.value\s*=\s*requestedCategory/);
});
