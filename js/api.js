// --------------------------------------------------
// TechNestStore - API Module
// Fetch electronics products from DummyJSON.
// --------------------------------------------------

import { applyProductOverrides, lookupProductOverride } from "./admin-data.js";

// Base URL for the products API.
const API_BASE_URL = "https://dummyjson.com/products";

export const ELECTRONICS_CATEGORIES = [
  "smartphones",
  "laptops",
  "tablets",
  "mobile-accessories",
];

async function requestProduct(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    if (response.status === 404) throw new Error("Product not found.");
    throw new Error(`DummyJSON request failed: HTTP ${response.status}`);
  }
  const data = await response.json();
  if (!data || typeof data !== "object") {
    throw new Error("Invalid product data received.");
  }
  return data;
}

async function getCategoryProducts(category) {
  const data = await requestProduct(
    `${API_BASE_URL}/category/${category}?limit=0`,
  );
  if (!Array.isArray(data.products)) {
    throw new Error(`Invalid product data for ${category}`);
  }
  return data.products;
}

// Reuse a successful GET in the current page. Admin rerenders need no refetch.
let originalProductsPromise = null;

// Read the four electronics categories, then show local Admin changes too.
export async function getElectronicsProducts({ fresh = false } = {}) {
  if (!originalProductsPromise || fresh) {
    originalProductsPromise = Promise.all(
      ELECTRONICS_CATEGORIES.map((category) => getCategoryProducts(category)),
    )
      .then((groups) => groups.flat())
      .catch((error) => {
        originalProductsPromise = null; // Allow retries after a failure.
        throw error;
      });
  }
  return applyProductOverrides(await originalProductsPromise);
}

export async function getProductById(id) {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Invalid product ID.");
  }
  const override = lookupProductOverride(id);
  if (override.type === "deleted") throw new Error("Product not found.");
  if (override.type === "created") return override.product;

  const product = await requestProduct(`${API_BASE_URL}/${id}`);
  if (product.id !== id) throw new Error("Invalid product data received.");
  return { ...product, ...override.changes };
}

// These functions perform real HTTP requests. DummyJSON only simulates writes.
function sendJSON(method, url, data) {
  return requestProduct(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function createProduct(data) {
  return sendJSON("POST", `${API_BASE_URL}/add`, data);
}

export function updateProduct(id, data) {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Invalid product ID.");
  }
  return sendJSON("PUT", `${API_BASE_URL}/${id}`, data);
}

export function deleteProduct(id) {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Invalid product ID.");
  }
  return requestProduct(`${API_BASE_URL}/${id}`, { method: "DELETE" });
}
