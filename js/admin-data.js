const OVERRIDES_KEY = "technest-admin-overrides-v1";
const NEXT_ID_KEY = "technest-admin-next-id-v1";
export const LOCAL_PRODUCT_ID_START = 1_000_001;

function emptyOverrides() {
  return { created: [], updated: {}, deleted: [] };
}

function validId(id) {
  return Number.isSafeInteger(id) && id > 0;
}

export function getAdminOverrides() {
  try {
    const saved = localStorage.getItem(OVERRIDES_KEY);
    if (!saved) return emptyOverrides();

    const data = JSON.parse(saved);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return emptyOverrides();
    }

    const created = Array.isArray(data.created)
      ? data.created.filter(
          (product) =>
            product &&
            validId(product.id) &&
            product.id >= LOCAL_PRODUCT_ID_START,
        )
      : [];
    const updated =
      data.updated &&
      typeof data.updated === "object" &&
      !Array.isArray(data.updated)
        ? data.updated
        : {};
    const deleted = Array.isArray(data.deleted)
      ? [...new Set(data.deleted.filter(validId))]
      : [];

    return { created, updated, deleted };
  } catch (error) {
    console.warn("Unable to read local Admin changes:", error);
    return emptyOverrides();
  }
}

function saveOverrides(overrides) {
  // Intentionally let write errors reach Admin so visitors get feedback.
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  window.dispatchEvent(new Event("technest:catalogue-change"));
}

// Overlay locally created, edited and deleted products on the API catalogue.
export function applyProductOverrides(apiProducts) {
  const { created, updated, deleted } = getAdminOverrides();
  const hidden = new Set(deleted);
  const existing = apiProducts
    .filter((product) => !hidden.has(product.id))
    .map((product) => ({ ...product, ...(updated[product.id] || {}) }));

  // New local products appear first; they're available to every store page.
  const local = created.filter((product) => !hidden.has(product.id));
  return [...local, ...existing];
}

// Return local state so api.js can resolve a product without an invalid API call.
export function lookupProductOverride(id) {
  const overrides = getAdminOverrides();
  if (overrides.deleted.includes(id)) return { type: "deleted" };

  const local = overrides.created.find((product) => product.id === id);
  if (local) return { type: "created", product: local };

  return { type: "api", changes: overrides.updated[id] || {} };
}

export function saveCreatedProduct(data) {
  const overrides = getAdminOverrides();
  const storedId = Number(localStorage.getItem(NEXT_ID_KEY));
  const highestId = overrides.created.reduce(
    (largest, product) => Math.max(largest, product.id),
    LOCAL_PRODUCT_ID_START - 1,
  );
  const id = Math.max(
    LOCAL_PRODUCT_ID_START,
    Number.isSafeInteger(storedId) ? storedId : LOCAL_PRODUCT_ID_START,
    highestId + 1,
  );

  const product = { ...data, id, rating: 0 };
  overrides.created.unshift(product);
  saveOverrides(overrides);
  localStorage.setItem(NEXT_ID_KEY, String(id + 1));
  return product;
}

export function saveUpdatedProduct(id, changes) {
  if (!validId(id)) throw new Error("Invalid product ID.");
  const overrides = getAdminOverrides();

  if (id >= LOCAL_PRODUCT_ID_START) {
    const index = overrides.created.findIndex((product) => product.id === id);
    if (index === -1) throw new Error("Local product no longer exists.");
    overrides.created[index] = { ...overrides.created[index], ...changes };
  } else {
    overrides.updated[id] = { ...(overrides.updated[id] || {}), ...changes };
  }

  saveOverrides(overrides);
}

export function saveDeletedProduct(id) {
  if (!validId(id)) throw new Error("Invalid product ID.");
  const overrides = getAdminOverrides();

  if (id >= LOCAL_PRODUCT_ID_START) {
    overrides.created = overrides.created.filter(
      (product) => product.id !== id,
    );
  } else {
    overrides.deleted = [...new Set([...overrides.deleted, id])];
  }
  delete overrides.updated[id];
  saveOverrides(overrides);
}

// Reset the local product preview, keeping Favorites/Cart otherwise intact.
// Return created IDs, so Admin can remove their now-invalid saved references.
export function resetProductOverrides() {
  const localIds = getAdminOverrides().created.map((product) => product.id);
  localStorage.removeItem(OVERRIDES_KEY);
  window.dispatchEvent(new Event("technest:catalogue-change"));
  return localIds;
}
