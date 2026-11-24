import test from "node:test";
import assert from "node:assert/strict";
import { installBrowserMocks, withDocumentHead } from "./helpers/browser-mock.js";

installBrowserMocks();

class Element {
  constructor(tagName = "div") {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.listeners = new Map();
    this.attributes = new Map();
    this.textContent = "";
    this.hidden = false;
    this.disabled = false;
    this.dataset = {};
  }

  append(...children) {
    for (const child of children) {
      if (child.tagName === "FRAGMENT") {
        this.append(...child.children);
        continue;
      }
      this.children.push(child);
      child.parentNode = this;
    }
  }

  replaceChildren(...children) {
    for (const child of this.children) child.parentNode = null;
    this.children = [];
    this.append(...children);
  }

  remove() {
    if (!this.parentNode) return;
    const siblings = this.parentNode.children;
    siblings.splice(siblings.indexOf(this), 1);
    this.parentNode = null;
  }

  get nextElementSibling() {
    if (!this.parentNode) return null;
    const siblings = this.parentNode.children;
    return siblings[siblings.indexOf(this) + 1] ?? null;
  }

  get previousElementSibling() {
    if (!this.parentNode) return null;
    const siblings = this.parentNode.children;
    return siblings[siblings.indexOf(this) - 1] ?? null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  addEventListener(event, callback) {
    this.listeners.set(event, callback);
  }

  querySelector(selector) {
    for (const child of this.children) {
      if (selector === "button" && child.tagName === "BUTTON") return child;
      const nested = child.querySelector(selector);
      if (nested) return nested;
    }
    return null;
  }

  focus() {
    document.activeElement = this;
  }

  click() {
    if (this.disabled) return;
    this.focus();
    this.listeners.get("click")?.();
  }
}

const elements = new Map();
for (const id of [
  "site-header",
  "site-footer",
  "cart-list",
  "cart-status",
  "cart-action-status",
  "cart-empty",
  "cart-summary",
  "cart-count",
  "cart-subtotal",
]) {
  elements.set(`#${id}`, new Element());
}

globalThis.document = withDocumentHead({
  body: { dataset: { root: "../", page: "cart" } },
  activeElement: null,
  querySelector(selector) {
    return elements.get(selector) ?? null;
  },
  createElement(tag) {
    return new Element(tag);
  },
  createDocumentFragment() {
    return new Element("fragment");
  },
});

// Product 999 deliberately fails to load. It must not disappear from the cart.
const knownProducts = new Map([
  [121, { id: 121, title: "Phone", price: 199.99, stock: 8 }],
  [122, { id: 122, title: "Laptop", price: 500, stock: 6 }],
]);

globalThis.fetch = async (url) => {
  const id = Number(String(url).match(/\/(\d+)$/)?.[1]);
  const product = knownProducts.get(id);
  return product
    ? { ok: true, json: async () => product }
    : { ok: false, status: 404 };
};

localStorage.setItem(
  "technest-cart-v1",
  JSON.stringify([
    { id: 121, quantity: 2 },
    { id: 122, quantity: 1 },
    { id: 999, quantity: 3 },
  ]),
);

const { getCartItemCount, getCartItems } = await import("../js/storage.js");
await import("../js/cart.js");
await new Promise((resolve) => setImmediate(resolve));

const get = (id) => elements.get(`#${id}`);
const rows = () => get("cart-list").children;
const knownRowControls = (row) => row.children[2].children[1].children;
const unavailableRemove = (row) => row.children[2].children[1];

test("unavailable products stay visible and Cart count matches stored quantities", () => {
  assert.equal(rows().length, 3);
  assert.match(
    rows()[2].children[1].children[0].textContent,
    /Unavailable product #999/,
  );
  assert.equal(getCartItemCount(), 6);
  assert.equal(get("cart-count").textContent, "6");
  assert.match(get("cart-status").textContent, /6 items/);
  assert.equal(get("cart-subtotal").textContent, "$899.98");
  assert.match(
    get("cart-action-status").textContent,
    /excluded from the subtotal/,
  );
});

test("incrementing quantity retains the exact DOM row and keyboard focus", () => {
  const row = rows()[0];
  const [, increment] = knownRowControls(row);
  increment.click();
  assert.equal(document.activeElement, increment);
  assert.equal(rows()[0], row);
  assert.equal(getCartItems()[0].quantity, 3);
  assert.equal(row.children[2].children[0].textContent, "Quantity: 3");
  assert.equal(get("cart-count").textContent, "7");
  assert.match(get("cart-action-status").textContent, /Quantity updated to 3/);

  // A second click must read the updated quantity, not the original one.
  increment.click();
  assert.equal(getCartItems()[0].quantity, 4);
  const [decrement] = knownRowControls(row);
  decrement.click();
  assert.equal(document.activeElement, decrement);
  assert.equal(rows()[0], row);
  assert.equal(getCartItems()[0].quantity, 3);
});

test("removing a row transfers keyboard focus to another available control", () => {
  const row = rows()[1];
  const [decrement] = knownRowControls(row);
  decrement.click(); // quantity 1 -> 0, so the row disappears
  assert.equal(rows().includes(row), false);
  assert.equal(rows().length, 2);
  assert.equal(getCartItemCount(), 6);
  assert.equal(get("cart-count").textContent, "6");
  assert.equal(document.activeElement.tagName, "BUTTON");
  assert.notEqual(document.activeElement, decrement);
});

test("removing unavailable items updates count without deleting other products", () => {
  unavailableRemove(rows()[1]).click();
  assert.equal(rows().length, 1);
  assert.equal(getCartItemCount(), 3);
  assert.deepEqual(getCartItems(), [{ id: 121, quantity: 3 }]);
  assert.equal(get("cart-count").textContent, "3");
  assert.equal(get("cart-subtotal").textContent, "$599.97");
});

test("removing the last item focuses status and shows empty cart", () => {
  const row = rows()[0];
  row.children[2].children[2].click(); // Remove product
  assert.equal(rows().length, 0);
  assert.equal(getCartItemCount(), 0);
  assert.equal(get("cart-count").textContent, "0");
  assert.equal(get("cart-empty").hidden, false);
  assert.equal(get("cart-summary").hidden, true);
  assert.equal(document.activeElement, get("cart-status"));
});
