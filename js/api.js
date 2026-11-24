// --------------------------------------------------
// TechNestStore - API Module
// Fetch electronics products from DummyJSON.
// --------------------------------------------------

import { applyProductOverrides, lookupProductOverride } from "./admin-data.js";

// Base URL for the products API.
const API_BASE_URL = "https://dummyjson.com/products";

// Store only base API products. Local Admin overrides are applied after reading.
// sessionStorage persists during same-tab page navigation, not indefinitely.
const CACHE_KEY = "technest-electronics-api-v1";
const CACHE_TTL_MS = 5 * 60 * 1000;

function readCatalogueCache() {
  try {
    if (typeof sessionStorage === "undefined") return null;
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (
      !cached ||
      !Array.isArray(cached.products) ||
      !Number.isFinite(cached.timestamp) ||
      Date.now() - cached.timestamp > CACHE_TTL_MS ||
      cached.timestamp > Date.now()
    ) {
      return null;
    }
    return cached.products;
  } catch {
    // Browsers can disable storage. Network loading still works.
    return null;
  }
}

function saveCatalogueCache(products) {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ timestamp: Date.now(), products }),
      );
    }
  } catch {
    // Full or disabled storage must not break shopping.
  }
}

export const ELECTRONICS_CATEGORIES = [
  "smartphones",
  "laptops",
  "tablets",
  "mobile-accessories",
];

async function requestProduct(url, options = {}) {
  const controller = new AbortController();

  // Cancel the request after 12 seconds.
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 12000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Product not found.");
      }
      throw new Error(`DummyJSON request failed: HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data || typeof data !== "object") {
      throw new Error("Invalid product data received.");
    }
    return data;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("The request timed out. Please try again.");
    }
    if (error instanceof TypeError) {
      throw new Error(
        "Could not connect to DummyJSON. Check your connection.",
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getCategoryProducts(category) {
  // DummyJSON supports select on category endpoints. Fetch only card/Admin fields.
  const fields = "id,title,brand,category,description,price,stock,thumbnail,images";
  const data = await requestProduct(
    `${API_BASE_URL}/category/${category}?limit=0&select=${fields}`,
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
  if (fresh || !originalProductsPromise) {
    // A fresh request always bypasses both the in-memory and session cache.
    const cachedProducts = fresh ? null : readCatalogueCache();
    if (cachedProducts !== null) {
      originalProductsPromise = Promise.resolve(cachedProducts);
    } else {
      originalProductsPromise = Promise.allSettled(
        ELECTRONICS_CATEGORIES.map((category) => getCategoryProducts(category)),
      )
        .then((results) => {
          const products = [];
          let successfulCategories = 0;
          results.forEach((result, index) => {
            if (result.status === "fulfilled") {
              successfulCategories += 1;
              products.push(...result.value);
            } else {
              console.warn(
                `Could not load ${ELECTRONICS_CATEGORIES[index]}:`,
                result.reason,
              );
            }
          });
          if (successfulCategories === 0) {
            throw new Error("Unable to load electronics. Please try again.");
          }
          // A partially loaded catalogue must not become a persistent cache.
          if (successfulCategories === ELECTRONICS_CATEGORIES.length) {
            saveCatalogueCache(products);
          }
          return products;
        })
        .catch((error) => {
          originalProductsPromise = null;
          throw error;
        });
    }
  }
  // Always apply live local Admin changes, including when using cached data.
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
