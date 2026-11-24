import test from "node:test";
import assert from "node:assert/strict";
import { installBrowserMocks, withDocumentHead } from "./helpers/browser-mock.js";

installBrowserMocks();

class Element {
  constructor(tag = "div") {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.dataset = {};
    this.textContent = "";
    this.hidden = false;
  }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) {
    this.children = children.flatMap((child) =>
      child.tagName === "FRAGMENT" ? child.children : [child]);
  }
  setAttribute() {}
  addEventListener() {}
}
const elements = new Map([
  "site-header", "site-footer", "favorites-list", "favorites-status",
  "favorites-action-status", "favorites-empty",
].map((id) => [`#${id}`, new Element()]));

globalThis.document = withDocumentHead({
  body: { dataset: { root: "../", page: "favorites" } },
  querySelector: (selector) => elements.get(selector) ?? null,
  createElement: (tag) => new Element(tag),
  createDocumentFragment: () => new Element("fragment"),
});
globalThis.fetch = async (url) => {
  const id = Number(String(url).split("/").at(-1));
  return { ok: true, json: async () => ({ id, title: `Product ${id}`, price: 10, stock: 5, category: "smartphones" }) };
};
const settle = () => new Promise((resolve) => setImmediate(resolve));
const get = (id) => elements.get(`#${id}`);
function externalFavorites(ids) {
  localStorage.setItem("technest-favorites", JSON.stringify(ids));
  window.dispatchEvent(Object.assign(new Event("storage"), { key: "technest-favorites" }));
}
localStorage.setItem("technest-favorites", "[121,122]");
await import("../js/favorites.js");
await settle();

test("favorites removed in another tab disappear immediately", async () => {
  assert.equal(get("favorites-list").children.length, 2);
  externalFavorites([122]);
  assert.equal(get("favorites-list").children.length, 1);
  await settle();
  assert.equal(get("favorites-list").children.length, 1);
  externalFavorites([]);
  assert.equal(get("favorites-list").children.length, 0);
  assert.equal(get("favorites-empty").hidden, false);
});

test("new favorites from another tab are loaded, and stale requests cannot restore removed favorites", async () => {
  externalFavorites([121]);
  externalFavorites([122, 123]);
  await settle();
  assert.equal(get("favorites-list").children.length, 2);
  assert.match(get("favorites-status").textContent, /Showing 2 of 2/);
  externalFavorites([121]);
  externalFavorites([]);
  await settle();
  assert.equal(get("favorites-list").children.length, 0);
  assert.equal(get("favorites-empty").hidden, false);
});
