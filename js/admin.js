import { initLayout } from "./ui.js";
import { getAdminErrorMessage } from "./admin-error.js";

import {
  ELECTRONICS_CATEGORIES,
  getElectronicsProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "./api.js";

import {
  LOCAL_PRODUCT_ID_START,
  getAdminOverrides,
  saveCreatedProduct,
  saveUpdatedProduct,
  saveDeletedProduct,
  resetProductOverrides,
} from "./admin-data.js";

import {
  getFavoriteIds,
  toggleFavorite,
  getCartItems,
  removeFromCart,
  clearShoppingData,
} from "./storage.js";

initLayout();

// HTML elements used by this page.
const form = document.querySelector("#admin-product-form");
const list = document.querySelector("#admin-products");
const feedback = document.querySelector("#admin-feedback");
const listStatus = document.querySelector("#admin-list-status");
const submitButton = document.querySelector("#admin-submit");
const cancelButton = document.querySelector("#admin-cancel");
const resetButton = document.querySelector("#admin-reset");
const retryButton = document.querySelector("#admin-retry");
const searchInput = document.querySelector("#admin-search");
const editIdInput = document.querySelector("#admin-edit-id");

const formFields = {
  title: document.querySelector("#admin-title"),
  brand: document.querySelector("#admin-brand"),
  category: document.querySelector("#admin-category"),
  price: document.querySelector("#admin-price"),
  stock: document.querySelector("#admin-stock"),
  description: document.querySelector("#admin-description"),
  thumbnail: document.querySelector("#admin-image"),
};

const PLACEHOLDER_IMAGE = "../assets/images/product-placeholder.svg";
const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

let products = [];
let busy = false;
let loaded = false;

function showFeedback(message, isError = false) {
  feedback.textContent = message;
  feedback.dataset.kind = isError ? "error" : "success";
}

function setBusy(value, label = "Saving...") {
  busy = value;
  for (const control of form.elements) control.disabled = value;
  resetButton.disabled = value;
  searchInput.disabled = value;
  retryButton.disabled = value;
  for (const button of list.querySelectorAll("button")) {
    button.disabled = value;
  }
  list.classList.toggle("is-busy", value);
  submitButton.textContent = value
    ? label
    : editIdInput.value
      ? "Save changes"
      : "Create product";
}

function resetForm() {
  form.reset();
  editIdInput.value = "";
  document.querySelector("#admin-form-heading").textContent = "Create product";
  submitButton.textContent = "Create product";
  cancelButton.hidden = true;
}

function updateStats() {
  const overrides = getAdminOverrides();
  document.querySelector("#admin-created-count").textContent = String(
    overrides.created.length,
  );
  document.querySelector("#admin-edited-count").textContent = String(
    Object.keys(overrides.updated).length,
  );
  document.querySelector("#admin-deleted-count").textContent = String(
    overrides.deleted.length,
  );
  document.querySelector("#admin-total-count").textContent = String(
    products.length,
  );
}

// Build an inventory row with DOM methods, not untrusted innerHTML.
function createProductRow(product) {
  const row = document.createElement("article");
  row.className = "admin-product-row";

  const image = document.createElement("img");
  image.className = "admin-product-image";
  image.src = product.thumbnail || PLACEHOLDER_IMAGE;
  image.alt = "";
  image.loading = "lazy";
  image.width = 76;
  image.height = 76;

  const info = document.createElement("div");
  info.className = "admin-product-info";
  const title = document.createElement("h3");
  title.textContent = product.title;
  const description = document.createElement("p");
  const stock = Number.isSafeInteger(product.stock) ? product.stock : "unknown";
  description.textContent = `${product.brand || "Unknown brand"} · ${(product.category || "").replaceAll("-", " ")} · Stock ${stock}`;
  const price = document.createElement("strong");
  price.className = "admin-product-price";
  price.textContent = Number.isFinite(product.price)
    ? priceFormatter.format(product.price)
    : "Price unavailable";
  const tag = document.createElement("span");
  tag.className = "admin-product-tag";
  tag.textContent =
    product.id >= LOCAL_PRODUCT_ID_START
      ? `Local #${product.id}`
      : `API #${product.id}`;
  info.append(title, description, price, tag);

  const actions = document.createElement("div");
  actions.className = "admin-product-actions";
  for (const [action, label] of [
    ["edit", "Edit"],
    ["delete", "Delete"],
  ]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `admin-button ${action === "delete" ? "admin-button-danger" : "admin-button-secondary"}`;
    button.textContent = label;
    button.dataset.adminAction = action;
    button.dataset.productId = String(product.id);
    button.setAttribute("aria-label", `${label} ${product.title}`);
    button.disabled = busy;
    actions.append(button);
  }

  row.append(image, info, actions);
  return row;
}

function renderProducts() {
  updateStats();
  const query = searchInput.value.trim().toLowerCase();
  const visible = products.filter((product) =>
    [product.title, product.brand, product.category, String(product.id)]
      .join(" ")
      .toLowerCase()
      .includes(query),
  );

  const fragment = document.createDocumentFragment();
  for (const product of visible) fragment.append(createProductRow(product));

  if (visible.length === 0) {
    const empty = document.createElement("p");
    empty.className = "admin-empty";
    empty.textContent =
      products.length === 0
        ? "No products found. Try resetting local changes."
        : "No products match your search.";
    fragment.append(empty);
  }
  list.replaceChildren(fragment);
  listStatus.textContent = `Showing ${visible.length} of ${products.length} products.`;
}

async function loadProducts(fresh = false) {
  listStatus.textContent = "Loading electronics from DummyJSON...";
  retryButton.hidden = true;
  try {
    products = await getElectronicsProducts({ fresh });
    loaded = true;
    renderProducts();
  } catch (error) {
    console.error("Admin catalogue request failed:", error);
    loaded = false;
    listStatus.textContent = `Unable to load electronics. ${getAdminErrorMessage(error)}`;
    retryButton.hidden = false;
  }
}

function readForm() {
  const imageValue = formFields.thumbnail.value.trim();
  return {
    title: formFields.title.value.trim(),
    brand: formFields.brand.value.trim(),
    category: formFields.category.value,
    price: Number(formFields.price.value),
    stock: Number(formFields.stock.value),
    description: formFields.description.value.trim(),
    thumbnail: imageValue || PLACEHOLDER_IMAGE,
  };
}

function validateForm(data) {
  if (!form.reportValidity()) return false;
  const valid =
    data.title.length > 0 &&
    data.title.length <= 120 &&
    data.brand.length > 0 &&
    data.brand.length <= 70 &&
    data.description.length > 0 &&
    data.description.length <= 1000 &&
    ELECTRONICS_CATEGORIES.includes(data.category) &&
    Number.isFinite(data.price) &&
    data.price >= 0.01 &&
    data.price <= 1_000_000 &&
    Number.isSafeInteger(data.stock) &&
    data.stock >= 0 &&
    data.stock <= 100_000;
  if (!valid) {
    showFeedback(
      "Please enter a valid name, brand, category, price, stock and description.",
      true,
    );
    return false;
  }

  const url = formFields.thumbnail.value.trim();
  if (url) {
    try {
      if (!["http:", "https:"].includes(new URL(url).protocol)) {
        throw new Error("Invalid image protocol");
      }
    } catch {
      showFeedback("Image URL must start with http:// or https://.", true);
      return false;
    }
  }
  return true;
}

function beginEdit(id) {
  if (busy || !loaded) return;
  const product = products.find((entry) => entry.id === id);
  if (!product)
    return showFeedback("The product is no longer available.", true);

  editIdInput.value = String(id);
  for (const field of [
    "title",
    "brand",
    "category",
    "price",
    "stock",
    "description",
  ]) {
    formFields[field].value = product[field] ?? "";
  }
  // Do not display the internal local placeholder path as a URL.
  formFields.thumbnail.value =
    product.thumbnail === PLACEHOLDER_IMAGE ? "" : product.thumbnail || "";
  document.querySelector("#admin-form-heading").textContent = "Edit product";
  submitButton.textContent = "Save changes";
  cancelButton.hidden = false;
  showFeedback(`Editing ${product.title}.`);
  form.scrollIntoView({ behavior: "smooth", block: "start" });
  formFields.title.focus({ preventScroll: true });
}

// Clear favorite/cart IDs for a product that no longer exists locally.
function removeSavedReferences(id) {
  if (getFavoriteIds().includes(id)) toggleFavorite(id);
  if (getCartItems().some((item) => item.id === id)) removeFromCart(id);
}

async function saveProduct(event) {
  event.preventDefault();
  if (busy || !loaded) return;
  const data = readForm();
  if (!validateForm(data)) return;

  const id = editIdInput.value ? Number(editIdInput.value) : null;
  const original = id === null ? null : products.find((p) => p.id === id);
  if (id !== null && !original) {
    showFeedback("The selected product is no longer available.", true);
    return;
  }

  setBusy(true, id === null ? "Creating..." : "Updating...");
  showFeedback(
    id === null ? "Creating product..." : "Saving product changes...",
  );
  try {
    if (id === null) {
      // The POST is real, but the API does not persist the product.
      await createProduct(data);
      saveCreatedProduct({ ...data, images: [data.thumbnail] });
    } else {
      // A change of image should also update the Product Details gallery.
      const changes =
        original.thumbnail !== data.thumbnail
          ? { ...data, images: [data.thumbnail] }
          : data;

      if (id < LOCAL_PRODUCT_ID_START) {
        await updateProduct(id, changes); // Real simulated PUT request.
      }
      // Created products have no server ID, so edit locally only.
      saveUpdatedProduct(id, changes);
    }

    products = await getElectronicsProducts();
    renderProducts();
    resetForm();
    showFeedback(
      id === null
        ? "Product created! It is now visible throughout this browser's store."
        : "Product updated! The local preview is saved after a refresh.",
    );
  } catch (error) {
    console.error("Unable to save product:", error);
    showFeedback(
      `Unable to save product. ${getAdminErrorMessage(error)}`,
      true,
    );
  } finally {
    setBusy(false);
  }
}

async function removeProduct(id) {
  if (busy || !loaded) return;
  const product = products.find((entry) => entry.id === id);
  if (!product) return;
  if (
    !window.confirm(
      `Remove "${product.title}" from this browser's demo catalogue?`,
    )
  ) {
    return;
  }

  setBusy(true, "Deleting...");
  showFeedback(`Removing ${product.title}...`);
  try {
    if (id < LOCAL_PRODUCT_ID_START) {
      await deleteProduct(id); // Real simulated DELETE request.
    }
    saveDeletedProduct(id);
    removeSavedReferences(id);
    products = await getElectronicsProducts();
    renderProducts();
    if (editIdInput.value === String(id)) resetForm();
    showFeedback(`${product.title} removed from this browser's catalogue.`);
  } catch (error) {
    console.error("Unable to remove product:", error);
    showFeedback(
      `Unable to remove product. ${getAdminErrorMessage(error)}`,
      true,
    );
  } finally {
    setBusy(false);
  }
}

async function resetAdmin() {
  if (busy || !loaded) return;

  // Ask before deleting saved browser data.
  if (
    !window.confirm(
      "Reset all local product changes AND clear Favorites and Cart? This cannot be undone.",
    )
  ) {
    return;
  }

  setBusy(true, "Resetting...");

  try {
    // Restore the original product catalogue.
    resetProductOverrides();

    // NEW: Clear all Favorites and Cart items.
    clearShoppingData();

    // Reset the Admin form.
    resetForm();

    // Reload the original products.
    try {
      products = await getElectronicsProducts();
      renderProducts();

      showFeedback("All local changes, Favorites and Cart have been cleared.");
    } catch (error) {
      console.error("Could not reload Admin after reset:", error);

      loaded = false;
      listStatus.textContent =
        "Saved data cleared, but the catalogue could not reload.";

      retryButton.hidden = false;

      showFeedback(
        "Favorites, Cart and Admin changes were cleared. " +
          "Please retry loading the catalogue.",
        true,
      );
    }
  } catch (error) {
    console.error("Could not reset saved data:", error);

    showFeedback(`Reset failed. ${getAdminErrorMessage(error)}`, true);
  } finally {
    setBusy(false);
  }
}

// Event delegation: one click listener handles every Edit / Delete row.
list.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("[data-admin-action]");
  if (!button) return;
  const id = Number(button.dataset.productId);
  if (button.dataset.adminAction === "edit") beginEdit(id);
  if (button.dataset.adminAction === "delete") void removeProduct(id);
});

form.addEventListener("submit", saveProduct);
searchInput.addEventListener("input", () => {
  if (loaded) renderProducts();
});
cancelButton.addEventListener("click", () => {
  if (busy) return;
  resetForm();
  showFeedback("Editing cancelled.");
});
resetButton.addEventListener("click", resetAdmin);
retryButton.addEventListener("click", () => loadProducts(true));

await loadProducts();
