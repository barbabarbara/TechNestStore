// --------------------------------------------------
// TechNestStore - API Module
// Fetch electronics products from DummyJSON.
// --------------------------------------------------

// Base URL for the products API.
const API_BASE_URL = "https://dummyjson.com/products";

// Only include the four electronics categories.
const ELECTRONICS_CATEGORIES = [
  "smartphones",
  "laptops",
  "tablets",
  "mobile-accessories",
];

// Fetch all products belonging to one category.
async function getCategoryProducts(category) {
  const response = await fetch(`${API_BASE_URL}/category/${category}?limit=0`);

  // Check whether the HTTP request succeeded.
  if (!response.ok) {
    throw new Error(`Failed to load ${category}: HTTP ${response.status}`);
  }

  // Convert the JSON response into JavaScript data.
  const data = await response.json();

  // Check that the API returned a products array.
  if (!Array.isArray(data.products)) {
    throw new Error(`Invalid product data for ${category}`);
  }

  return data.products;
}

// Fetch products from all four electronics categories.
export async function getElectronicsProducts() {
  // Start one request for each category.
  const requests = ELECTRONICS_CATEGORIES.map((category) =>
    getCategoryProducts(category),
  );

  // Wait until all category requests have completed.
  const productGroups = await Promise.all(requests);

  // Combine the four arrays into one product array.
  return productGroups.flat();
}
