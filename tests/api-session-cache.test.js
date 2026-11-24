import test from "node:test";
import assert from "node:assert/strict";
import { installBrowserMocks } from "./helpers/browser-mock.js";

installBrowserMocks();
const values = new Map();
globalThis.sessionStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
};
let calls = [];
let failCategory = null;
globalThis.fetch = async (url) => {
  const address = String(url);
  calls.push(address);
  const category = address.match(/\/category\/([^?]+)/)?.[1];
  if (category === failCategory) return { ok: false, status: 503 };
  return { ok: true, json: async () => ({ products: [{ id: calls.length, category, title: category, price: 10 }] }) };
};

test("category requests use select to avoid unnecessary fields", async () => {
  const api = await import("../js/api.js?cache-page-1");
  values.clear();
  calls = [];
  assert.equal((await api.getElectronicsProducts()).length, 4);
  assert.equal(calls.length, 4);
  assert.ok(calls.every((url) => url.includes("&select=id,title,brand,category,description,price,stock,thumbnail,images")));
});

test("fresh page navigation reuses successful sessionStorage cache", async () => {
  const previous = calls.length;
  const anotherPage = await import("../js/api.js?cache-page-2");
  assert.equal((await anotherPage.getElectronicsProducts()).length, 4);
  assert.equal(calls.length, previous);
});

test("fresh flag bypasses session cache and refreshes it", async () => {
  const api = await import("../js/api.js?cache-page-3");
  const previous = calls.length;
  assert.equal((await api.getElectronicsProducts({ fresh: true })).length, 4);
  assert.equal(calls.length, previous + 4);
});

test("expired session cache fetches current data again", async () => {
  const [key, value] = [...values][0];
  values.set(key, JSON.stringify({ ...JSON.parse(value), timestamp: Date.now() - 60 * 60 * 1000 }));
  const anotherPage = await import("../js/api.js?cache-page-4");
  const previous = calls.length;
  assert.equal((await anotherPage.getElectronicsProducts()).length, 4);
  assert.equal(calls.length, previous + 4);
});


test("partially loaded catalogue is never saved as complete session cache", async () => {
  values.clear();
  failCategory = "laptops";
  const warning = console.warn;
  console.warn = () => {};
  try {
    const api = await import("../js/api.js?cache-partial-1");
    assert.equal((await api.getElectronicsProducts()).length, 3);
    assert.equal(values.size, 0);
  } finally {
    console.warn = warning;
    failCategory = null;
  }
  const nextPage = await import("../js/api.js?cache-partial-2");
  const previous = calls.length;
  assert.equal((await nextPage.getElectronicsProducts()).length, 4);
  assert.equal(calls.length, previous + 4);
});

test("partial catalogue warning survives in-memory reuse and clears after recovery", async () => {
  values.clear();
  failCategory = "laptops";
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    const api = await import("../js/api.js?warning-recovery");
    const warnings = [];
    const onWarning = (message) => warnings.push(message);
    assert.equal((await api.getElectronicsProducts({ onWarning })).length, 3);
    assert.match(warnings[0], /Warning:.*laptops/);
    assert.equal(values.size, 0);
    const previous = calls.length;
    await api.getElectronicsProducts({ onWarning });
    assert.equal(calls.length, previous);
    assert.equal(warnings[1], warnings[0]);
    failCategory = null;
    assert.equal((await api.getElectronicsProducts({ fresh: true, onWarning })).length, 4);
    assert.equal(warnings[2], "");
  } finally {
    console.warn = originalWarn;
    failCategory = null;
  }
});
