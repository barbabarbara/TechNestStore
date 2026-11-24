/* 
   TechNestStore | Favorites page  */
import { initLayout } from "./ui.js";
import { getProductById } from "./api.js";
import { getFavoriteIds } from "./storage.js";
import { createProductCard } from "./product-card.js";

initLayout();
const list = document.querySelector("#favorites-list");
const status = document.querySelector("#favorites-status");
const actionStatus = document.querySelector("#favorites-action-status");
const empty = document.querySelector("#favorites-empty");

let loadedProducts = [];
let loadVersion = 0;

// This redraws from memory, without additional API calls.
function renderFavorites() {
  const savedIds = getFavoriteIds();
  const savedProducts = savedIds
    .map((id) => loadedProducts.find((product) => product.id === id))
    .filter(Boolean);

  const fragment = document.createDocumentFragment();
  const favoriteIds = new Set(savedIds);
  for (const product of savedProducts) {
    fragment.append(
      createProductCard(product, {
        favoriteIds,
        onFavoriteChange(item) {
          actionStatus.textContent = `${item.title} removed from favorites.`;
          renderFavorites();
        },
        onCartChange(item, count) {
          actionStatus.textContent = `${item.title} added to cart. ${count} ${count === 1 ? "item" : "items"} in cart.`;
        },
        onError(error) {
          console.error(error);
          actionStatus.textContent =
            "Unable to save the change in this browser.";
        },
      }),
    );
  }
  list.replaceChildren(fragment);
  empty.hidden = savedIds.length !== 0;
  status.textContent =
    savedIds.length === 0
      ? "No saved products yet."
      : `Showing ${savedProducts.length} of ${savedIds.length} saved products.`;
}

async function loadFavorites() {
  const version = ++loadVersion;
  const ids = getFavoriteIds();
  actionStatus.textContent = "";
  // Remove unsaved products immediately, even while new items are loading.
  renderFavorites();
  if (ids.length === 0) {
    renderFavorites();
    return;
  }

  status.textContent = "Loading favorites...";
  // One missing/deleted API item must not hide all other favorites.
  const results = await Promise.allSettled(ids.map((id) => getProductById(id)));
  if (version !== loadVersion) return;
  if (JSON.stringify(ids) !== JSON.stringify(getFavoriteIds())) {
    return loadFavorites();
  }
  loadedProducts = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);
  const failed = results.length - loadedProducts.length;
  renderFavorites();
  if (failed > 0) {
    actionStatus.textContent = `${failed} saved products could not be loaded.`;
  }
}

loadFavorites();

window.addEventListener("storage", (event) => {
  if (
    event.key === "technest-favorites" ||
    event.key === "technest-admin-overrides-v1" ||
    event.key === null
  ) {
    loadFavorites();
  }
});

// Refresh cached pages when returning through browser Back/Forward.
window.addEventListener("pageshow", (event) => {
  if (event.persisted) window.location.reload();
});
