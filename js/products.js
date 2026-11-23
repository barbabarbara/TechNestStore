// --------------------------------------------------
// TechNestStore - Product Catalogue
// Display electronics products from DummyJSON.
// --------------------------------------------------

// Import reusable functions.
import { initLayout } from "./ui.js";
import { getElectronicsProducts } from "./api.js";

// Generate the shared header and footer.
initLayout();

// Find the HTML elements we need.
const productList = document.querySelector("#product-list");
const statusMessage = document.querySelector("#catalogue-status");

// Format prices in US dollars.
const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// Create one product card.

function createProductCard(product) {
  // 1. Create the product card.
  const card = document.createElement("li");
  card.className = "product-card";
  card.dataset.productId = String(product.id);

  // 2. Create a container for the image and category.
  const media = document.createElement("div");
  media.className = "product-card-media";

  // 3. Create the product image.
  const image = document.createElement("img");
  image.className = "product-card-image";
  image.src =
    product.category === "smartphones"
      ? product.images?.[2] || product.images?.[0] || product.thumbnail
      : product.thumbnail;
  image.alt = product.title;
  image.loading = "lazy";
  image.width = 320;
  image.height = 240;

  // Create the URL for this product.
  const productUrl = `./product.html?id=${product.id}`;

  // Create a link for the product image.
  const imageLink = document.createElement("a");

  imageLink.className = "product-card-image-link";
  imageLink.href = productUrl;

  imageLink.setAttribute("aria-label", `View details for ${product.title}`);

  // Place the image inside the link.
  imageLink.append(image);

  // 4. Create the category label.
  const category = document.createElement("span");
  category.className = "product-card-category";
  category.textContent = product.category.replaceAll("-", " ");

  // 5. Put the image and category in the media container.
  media.append(imageLink, category);

  // 6. Create the product information container.
  const content = document.createElement("div");
  content.className = "product-card-content";

  // 7. Create the brand.
  const brand = document.createElement("p");
  brand.className = "product-card-brand";
  brand.textContent = product.brand || "Unknown brand";

  // 8. Create the product title.

  // Create the product heading.
  const title = document.createElement("h2");
  title.className = "product-card-title";

  // Create a link inside the heading.
  const titleLink = document.createElement("a");

  titleLink.className = "product-card-title-link";
  titleLink.href = productUrl;
  titleLink.textContent = product.title;

  // Add the link to the heading.
  title.append(titleLink);

  // 8.1. Create the product description.
  const description = document.createElement("p");
  description.className = "product-card-description";
  description.textContent = product.description || "";

  // 9. Create the price.
  const price = document.createElement("p");
  price.className = "product-card-price";
  price.textContent = priceFormatter.format(product.price);

  // 10. Add brand, title, description, and price below the image.
  content.append(brand, title, description, price);

  // 11. Assemble the completed product card.
  card.append(media, content);

  // 12. Return the card.
  return card;
}

// Find the catalogue controls.
const searchInput = document.querySelector("#product-search");
const categoryFilter = document.querySelector("#category-filter");
const brandFilter = document.querySelector("#brand-filter");
const sortSelect = document.querySelector("#sort-select");
const clearFiltersButton = document.querySelector("#clear-filters");

// Keep the original API products in memory.
let allProducts = [];

// Fill the brand menu with brands that actually exist in the API results.
function populateBrandFilter(products) {
  const brands = [
    ...new Set(products.map((product) => product.brand || "Unknown brand")),
  ];
  brands.sort((a, b) => a.localeCompare(b));

  for (const brand of brands) {
    const option = document.createElement("option");
    option.value = brand;
    option.textContent = brand;
    brandFilter.append(option);
  }
}

// Apply all current controls, then redraw the catalogue.
function updateCatalogue() {
  const searchQuery = searchInput.value.trim().toLowerCase();
  const selectedCategory = categoryFilter.value;
  const selectedBrand = brandFilter.value;
  const sortOrder = sortSelect.value;

  // filter() returns a new array without changing allProducts.
  const visibleProducts = allProducts.filter((product) => {
    const searchableText = [
      product.title,
      product.brand || "Unknown brand",
      product.category.replaceAll("-", " "),
      product.description || "",
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchableText.includes(searchQuery);
    const matchesCategory =
      selectedCategory === "" || product.category === selectedCategory;
    const matchesBrand =
      selectedBrand === "" ||
      (product.brand || "Unknown brand") === selectedBrand;

    return matchesSearch && matchesCategory && matchesBrand;
  });

  // sort() modifies visibleProducts, not the original allProducts array.
  if (sortOrder === "name-asc") {
    visibleProducts.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortOrder === "price-asc") {
    visibleProducts.sort((a, b) => a.price - b.price);
  } else if (sortOrder === "price-desc") {
    visibleProducts.sort((a, b) => b.price - a.price);
  }

  // Build the new cards off-screen, then update the DOM once.
  const fragment = document.createDocumentFragment();
  for (const product of visibleProducts) {
    fragment.append(createProductCard(product));
  }
  productList.replaceChildren(fragment);

  // Show either the count or a helpful empty-results message.
  statusMessage.textContent =
    visibleProducts.length === 0
      ? "No products match your search or filters."
      : `Showing ${visibleProducts.length} of ${allProducts.length} products.`;
}

// Clear all choices and display the original catalogue again.
function clearFilters() {
  searchInput.value = "";
  categoryFilter.value = "";
  brandFilter.value = "";
  sortSelect.value = "default";
  updateCatalogue();
}

// Register listeners once. The controls start disabled until data loads.
searchInput.addEventListener("input", updateCatalogue);
categoryFilter.addEventListener("change", updateCatalogue);
brandFilter.addEventListener("change", updateCatalogue);
sortSelect.addEventListener("change", updateCatalogue);
clearFiltersButton.addEventListener("click", clearFilters);

// Fetch products only once, then allow users to filter locally.
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

    // Enable the controls only after a successful API request.
    for (const control of [
      searchInput,
      categoryFilter,
      brandFilter,
      sortSelect,
      clearFiltersButton,
    ]) {
      control.disabled = false;
    }

    updateCatalogue();
  } catch (error) {
    console.error("Could not load products:", error);
    statusMessage.textContent =
      "Unable to load products. Please refresh the page.";
  }
}

// Start loading when the page module runs.
loadProducts();
