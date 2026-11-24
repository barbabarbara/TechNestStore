import { initLayout } from "./ui.js";
import { getElectronicsProducts } from "./api.js";
import { createProductCard } from "./product-card.js";
import { getFavoriteIds } from "./storage.js";

initLayout();

const productList = document.querySelector("#product-list");
const statusMessage = document.querySelector("#catalogue-status");
const actionStatus = document.querySelector("#catalogue-action-status");
const searchInput = document.querySelector("#product-search");
const categoryFilter = document.querySelector("#category-filter");
const brandFilter = document.querySelector("#brand-filter");
const sortSelect = document.querySelector("#sort-select");
const clearFiltersButton = document.querySelector("#clear-filters");

let allProducts = [];
let catalogueWarning = "";

function showCatalogueStatus(message) {
  statusMessage.textContent = [catalogueWarning, message]
    .filter(Boolean)
    .join(" ");
}

function populateBrandFilter(products) {
  const brands = [
    ...new Set(products.map((product) => product.brand || "Unknown brand")),
  ].sort((a, b) => a.localeCompare(b));

  for (const brand of brands) {
    const option = document.createElement("option");
    option.value = brand;
    option.textContent = brand;
    brandFilter.append(option);
  }
}

function updateCatalogue() {
  const searchQuery = searchInput.value.trim().toLowerCase();
  const selectedCategory = categoryFilter.value;
  const selectedBrand = brandFilter.value;
  const sortOrder = sortSelect.value;

  const visibleProducts = allProducts.filter((product) => {
    const searchable = [
      product.title,
      product.brand || "Unknown brand",
      (product.category || "").replaceAll("-", " "),
      product.description || "",
    ]
      .join(" ")
      .toLowerCase();

    return (
      searchable.includes(searchQuery) &&
      (selectedCategory === "" || product.category === selectedCategory) &&
      (selectedBrand === "" ||
        (product.brand || "Unknown brand") === selectedBrand)
    );
  });

  if (sortOrder === "name-asc") {
    visibleProducts.sort((a, b) =>
      String(a.title ?? "").localeCompare(String(b.title ?? "")),
    );
  } else if (sortOrder === "price-asc") {
    visibleProducts.sort((a, b) => a.price - b.price);
  } else if (sortOrder === "price-desc") {
    visibleProducts.sort((a, b) => b.price - a.price);
  }

  const fragment = document.createDocumentFragment();
  const favoriteIds = new Set(getFavoriteIds()); // Read Favorites once per render.
  for (const product of visibleProducts) {
    fragment.append(
      createProductCard(product, {
        favoriteIds,
        onFavoriteChange(item, saved) {
          actionStatus.textContent = saved
            ? `${item.title} added to favorites.`
            : `${item.title} removed from favorites.`;
        },
        onCartChange(item, count) {
          actionStatus.textContent = `${item.title} added to cart. ${count} ${count === 1 ? "item" : "items"} in cart.`;
        },
        onError(error) {
          console.error("Could not update saved items:", error);
          actionStatus.textContent =
            "Could not save the change in this browser.";
        },
      }),
    );
  }

  productList.replaceChildren(fragment);
  showCatalogueStatus(
    visibleProducts.length === 0
      ? "No products match your search or filters."
      : `Showing ${visibleProducts.length} of ${allProducts.length} products.`,
  );
}

function clearFilters() {
  searchInput.value = "";
  categoryFilter.value = "";
  brandFilter.value = "";
  sortSelect.value = "default";
  actionStatus.textContent = "";
  updateCatalogue();
}

// Debounce typing only. Buttons and dropdowns should respond immediately.
let searchTimer;
function cancelPendingSearch() {
  clearTimeout(searchTimer);
}
searchInput.addEventListener("input", () => {
  cancelPendingSearch();
  searchTimer = setTimeout(updateCatalogue, 180);
});
for (const control of [categoryFilter, brandFilter, sortSelect]) {
  control.addEventListener("change", () => {
    cancelPendingSearch();
    updateCatalogue();
  });
}
clearFiltersButton.addEventListener("click", () => {
  cancelPendingSearch();
  clearFilters();
});

async function loadProducts() {
  catalogueWarning = "";
  statusMessage.textContent = "Loading products...";
  productList.replaceChildren();

  try {
    allProducts = await getElectronicsProducts({
      onWarning(message) {
        catalogueWarning = message;
      },
    });
    if (allProducts.length === 0) {
      showCatalogueStatus("No products available.");
      return;
    }

    populateBrandFilter(allProducts);
    for (const control of [
      searchInput,
      categoryFilter,
      brandFilter,
      sortSelect,
      clearFiltersButton,
    ])
      control.disabled = false;

    // Open a specific category when arriving from a homepage card.
    const requestedCategory = new URLSearchParams(window.location.search).get(
      "category",
    );
    if (
      requestedCategory &&
      [...categoryFilter.options].some(
        (option) => option.value === requestedCategory,
      )
    ) {
      categoryFilter.value = requestedCategory;
    }

    updateCatalogue();
  } catch (error) {
    console.error("Could not load products:", error);
    statusMessage.textContent =
      "Unable to load products. Please refresh the page.";
  }
}

loadProducts();

// Refresh cached pages when returning through browser Back/Forward.
window.addEventListener("pageshow", (event) => {
  if (event.persisted) window.location.reload();
});
