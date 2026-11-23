import { initLayout } from "./ui.js";
import { getElectronicsProducts } from "./api.js";
import { createProductCard } from "./product-card.js";

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
    visibleProducts.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortOrder === "price-asc") {
    visibleProducts.sort((a, b) => a.price - b.price);
  } else if (sortOrder === "price-desc") {
    visibleProducts.sort((a, b) => b.price - a.price);
  }

  const fragment = document.createDocumentFragment();
  for (const product of visibleProducts) {
    fragment.append(
      createProductCard(product, {
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
  statusMessage.textContent =
    visibleProducts.length === 0
      ? "No products match your search or filters."
      : `Showing ${visibleProducts.length} of ${allProducts.length} products.`;
}

function clearFilters() {
  searchInput.value = "";
  categoryFilter.value = "";
  brandFilter.value = "";
  sortSelect.value = "default";
  actionStatus.textContent = "";
  updateCatalogue();
}

searchInput.addEventListener("input", updateCatalogue);
categoryFilter.addEventListener("change", updateCatalogue);
brandFilter.addEventListener("change", updateCatalogue);
sortSelect.addEventListener("change", updateCatalogue);
clearFiltersButton.addEventListener("click", clearFilters);

async function loadProducts() {
  statusMessage.textContent = "Loading products...";
  productList.replaceChildren();

  try {
    allProducts = await getElectronicsProducts();
    if (allProducts.length === 0) {
      statusMessage.textContent = "No products available.";
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
    updateCatalogue();
  } catch (error) {
    console.error("Could not load products:", error);
    statusMessage.textContent =
      "Unable to load products. Please refresh the page.";
  }
}

loadProducts();
