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
  image.src = product.thumbnail;
  image.alt = product.title;
  image.loading = "lazy";
  image.width = 320;
  image.height = 240;

  // 4. Create the category label.
  const category = document.createElement("span");
  category.className = "product-card-category";
  category.textContent = product.category.replaceAll("-", " ");

  // 5. Put the image and category in the media container.
  media.append(image, category);

  // 6. Create the product information container.
  const content = document.createElement("div");
  content.className = "product-card-content";

  // 7. Create the brand.
  const brand = document.createElement("p");
  brand.className = "product-card-brand";
  brand.textContent = product.brand || "Unknown brand";

  // 8. Create the product title.
  const title = document.createElement("h2");
  title.className = "product-card-title";
  title.textContent = product.title;

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

// Load and display products.
async function loadProducts() {
  // Initial loading state.
  statusMessage.textContent = "Loading products...";
  productList.replaceChildren();

  try {
    // Fetch all four electronics categories.
    const products = await getElectronicsProducts();

    // Handle an empty result.
    if (products.length === 0) {
      statusMessage.textContent = "No products available.";
      return;
    }

    // Create and display every product card.
    for (const product of products) {
      const card = createProductCard(product);
      productList.append(card);
    }

    // Show the number of loaded products.
    statusMessage.textContent = `${products.length} products loaded.`;
  } catch (error) {
    // Log the technical error for developers.
    console.error("Could not load products:", error);

    // Show a helpful message to visitors.
    statusMessage.textContent =
      "Unable to load products. Please refresh the page.";
  }
}

// Start loading products when the page module runs.
loadProducts();
