import test from "node:test";
import assert from "node:assert/strict";
import { installBrowserMocks, withDocumentHead } from "./helpers/browser-mock.js";

const browser = installBrowserMocks();
const nav = new Map();
const placeholderHeader = { innerHTML: "" };
const placeholderFooter = { innerHTML: "" };

function element() {
  return {
    textContent: "",
    hidden: true,
    attributes: {},
    setAttribute(key, value) { this.attributes[key] = String(value); },
  };
}
for (const page of ["favorites", "cart"]) {
  nav.set(`[data-nav-count="${page}"]`, element());
  nav.set(`[data-nav-page="${page}"]`, element());
}
globalThis.document = withDocumentHead({
  body: { dataset: { root: "./", page: "home" } },
  querySelector(selector) {
    if (selector === "#site-header") return placeholderHeader;
    if (selector === "#site-footer") return placeholderFooter;
    return nav.get(selector) ?? null;
  },
});
const storage = await import("../js/storage.js");
const ui = await import("../js/ui.js");

function badge(page) { return nav.get(`[data-nav-count="${page}"]`); }
function link(page) { return nav.get(`[data-nav-page="${page}"]`); }

test("shared header contains Favorites and Cart number badges", () => {
  browser.clear();
  ui.initLayout();
  assert.match(placeholderHeader.innerHTML, /data-nav-count="favorites"/);
  assert.match(placeholderHeader.innerHTML, /data-nav-count="cart"/);
  assert.match(placeholderFooter.innerHTML, /site-footer/);
  assert.equal(badge("favorites").hidden, true);
  assert.equal(badge("cart").hidden, true);
});

test("saving a favorite updates the badge without refreshing the page", () => {
  browser.clear();
  storage.toggleFavorite(121);
  assert.equal(badge("favorites").textContent, "1");
  assert.equal(badge("favorites").hidden, false);
  assert.equal(link("favorites").attributes["aria-label"], "Favorites, 1 saved product");
});

test("cart badge sums quantities and disappears when cart becomes empty", () => {
  browser.clear();
  storage.addToCart(121, 2);
  storage.addToCart(122, 1);
  assert.equal(badge("cart").textContent, "3");
  assert.equal(link("cart").attributes["aria-label"], "Cart, 3 items");
  storage.removeFromCart(121);
  storage.removeFromCart(122);
  assert.equal(badge("cart").textContent, "0");
  assert.equal(badge("cart").hidden, true);
});

test("calling initLayout again does not register duplicate storage listeners", () => {
  ui.initLayout();
  ui.initLayout();
  assert.equal(browser.listeners.get("technest:storage-change").size, 1);
  assert.equal(browser.listeners.get("storage").size, 1);
});

test("changes in another browser tab refresh the counts", () => {
  browser.clear();
  browser.entries.set("technest-favorites", "[12,13]");
  window.dispatchEvent({ type: "storage", key: "technest-favorites" });
  assert.equal(badge("favorites").textContent, "2");
});


test("shared layout initializes the favicon with the correct module-relative URL", () => {
  ui.initLayout();
  const favicon = document.querySelector('link[rel="icon"]');
  assert.ok(favicon);
  assert.equal(favicon.tagName, "LINK");
  assert.equal(favicon.type, "image/x-icon");
  assert.equal(favicon.href, new URL("../assets/icons/favicon.ico", import.meta.url).href);
});

test("repeated layout initialization does not duplicate the favicon", () => {
  ui.initLayout();
  const favicon = document.querySelector('link[rel="icon"]');
  ui.initLayout();
  ui.initLayout();
  assert.equal(document.head.children.filter((element) => element.rel === "icon").length, 1);
  assert.equal(document.querySelector('link[rel="icon"]'), favicon);
});
