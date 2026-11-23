import { initLayout } from "./ui.js";
import { getProductById } from "./api.js";
import { isFavorite, toggleFavorite, addToCart } from "./storage.js";

initLayout();

// Elements already present in pages/product.html.
const statusMessage = document.querySelector("#product-status");
const productHeading = document.querySelector("#product-heading");
const detailsContainer = document.querySelector("#product-details");

// Read the ID from product.html?id=121, for example.
const params = new URLSearchParams(window.location.search);
const productId = Number(params.get("id"));

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// ----------------------------------------------------------
// 1. Select the available images.
// ----------------------------------------------------------
function getGalleryImages(product) {
  // Full-sized images take precedence over the small thumbnail.
  const images = Array.isArray(product.images)
    ? product.images.filter((url) => typeof url === "string" && url.trim())
    : [];

  if (images.length > 0) {
    return [...new Set(images)];
  }

  return typeof product.thumbnail === "string" && product.thumbnail.trim()
    ? [product.thumbnail]
    : [];
}

// ----------------------------------------------------------
// 2. Build the large image, arrows, and clickable thumbnails.
// ----------------------------------------------------------
function createImageGallery(product) {
  const gallery = document.createElement("div");
  gallery.className = "product-detail-gallery";

  const stage = document.createElement("div");
  stage.className = "product-detail-stage";

  const images = getGalleryImages(product);

  if (images.length === 0) {
    const missingImage = document.createElement("p");
    missingImage.className = "product-detail-empty-image";
    missingImage.textContent = "No product image available.";
    stage.append(missingImage);
    gallery.append(stage);
    return gallery;
  }

  let currentIndex = 0;
  const mainImage = document.createElement("img");
  mainImage.className = "product-detail-image";
  mainImage.width = 520;
  mainImage.height = 520;
  mainImage.decoding = "async";

  const previousButton = document.createElement("button");
  previousButton.type = "button";
  previousButton.className =
    "product-detail-arrow product-detail-arrow--previous";
  previousButton.setAttribute("aria-label", "Previous product image");
  previousButton.textContent = "‹";

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "product-detail-arrow product-detail-arrow--next";
  nextButton.setAttribute("aria-label", "Next product image");
  nextButton.textContent = "›";

  const count = document.createElement("span");
  count.className = "product-detail-image-count";
  count.setAttribute("aria-live", "polite");

  const thumbnailList = document.createElement("div");
  thumbnailList.className = "product-detail-thumbnails";
  thumbnailList.setAttribute("aria-label", "Product image thumbnails");

  const thumbnailButtons = [];

  // Change the large image and the selected thumbnail together.
  function showImage(index) {
    currentIndex = (index + images.length) % images.length;
    mainImage.src = images[currentIndex];
    mainImage.alt = `${product.title}, image ${currentIndex + 1} of ${images.length}`;
    count.textContent = `${currentIndex + 1} / ${images.length}`;

    for (const [buttonIndex, button] of thumbnailButtons.entries()) {
      button.setAttribute("aria-pressed", String(buttonIndex === currentIndex));
    }
  }

  // We only show arrows and a thumbnail row if more than one image exists.
  if (images.length > 1) {
    for (const [index, url] of images.entries()) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "product-detail-thumbnail";
      button.setAttribute(
        "aria-label",
        `Show image ${index + 1} of ${images.length}`,
      );

      const thumbnail = document.createElement("img");
      thumbnail.src = url;
      thumbnail.alt = ""; // The button already has an accessible label.
      thumbnail.loading = "lazy";

      button.append(thumbnail);
      button.addEventListener("click", () => showImage(index));
      thumbnailButtons.push(button);
      thumbnailList.append(button);
    }

    // Using modulo in showImage() lets the carousel wrap around.
    previousButton.addEventListener("click", () => showImage(currentIndex - 1));
    nextButton.addEventListener("click", () => showImage(currentIndex + 1));

    stage.append(previousButton, mainImage, nextButton, count);
    gallery.append(stage, thumbnailList);
  } else {
    stage.append(mainImage);
    gallery.append(stage);
  }

  showImage(0);
  return gallery;
}

// ----------------------------------------------------------
// 3. Add a term and its value to a description list.
// ----------------------------------------------------------
function addProductDetail(list, label, value) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  const term = document.createElement("dt");
  term.textContent = label;

  const description = document.createElement("dd");
  description.textContent = String(value);

  list.append(term, description);
}

// ----------------------------------------------------------
// 4. Build the right-hand product information.
// ----------------------------------------------------------
function createProductInformation(product) {
  const information = document.createElement("div");
  information.className = "product-detail-information";

  const brand = document.createElement("p");
  brand.className = "product-detail-brand";
  brand.textContent = product.brand || "Unknown brand";

  const category = document.createElement("p");
  category.className = "product-detail-category";
  category.textContent = product.category
    ? product.category.replaceAll("-", " ")
    : "Uncategorized";

  const price = document.createElement("p");
  price.className = "product-detail-price";
  price.textContent =
    typeof product.price === "number"
      ? priceFormatter.format(product.price)
      : "Price unavailable";

  const descriptionHeading = document.createElement("h2");
  descriptionHeading.className = "product-detail-subheading";
  descriptionHeading.textContent = "Description";

  const description = document.createElement("p");
  description.className = "product-detail-description";
  description.textContent = product.description || "No description available.";

  const specifications = document.createElement("dl");
  specifications.className = "product-detail-specifications";

  addProductDetail(
    specifications,
    "Rating",
    typeof product.rating === "number"
      ? `${product.rating.toFixed(1)} / 5`
      : null,
  );

  addProductDetail(
    specifications,
    "Availability",
    typeof product.stock === "number"
      ? product.stock > 0
        ? `${product.stock} in stock`
        : "Out of stock"
      : null,
  );

  addProductDetail(specifications, "Warranty", product.warrantyInformation);
  addProductDetail(specifications, "Shipping", product.shippingInformation);
  addProductDetail(specifications, "Returns", product.returnPolicy);

  information.append(brand, category, price, descriptionHeading, description);

  if (specifications.childElementCount > 0) {
    information.append(specifications);
  }

  // Lesson 6: actions are separate from the image gallery.
  const actions = document.createElement("div");
  actions.className = "product-detail-actions";

  const favoriteButton = document.createElement("button");
  favoriteButton.type = "button";
  favoriteButton.className = "detail-favorite-button";

  function updateFavoriteButton() {
    const saved = isFavorite(product.id);
    favoriteButton.textContent = saved ? "♥ Saved" : "♡ Save to favorites";
    favoriteButton.setAttribute("aria-pressed", String(saved));
  }

  updateFavoriteButton();
  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "detail-add-button";
  addButton.textContent = "Add to cart";
  addButton.disabled = product.stock === 0 || !Number.isFinite(product.price);

  const actionMessage = document.createElement("p");
  actionMessage.className = "action-status";
  actionMessage.setAttribute("role", "status");
  actionMessage.setAttribute("aria-live", "polite");

  favoriteButton.addEventListener("click", () => {
    try {
      const saved = toggleFavorite(product.id);
      updateFavoriteButton();
      actionMessage.textContent = saved
        ? "Product saved to favorites."
        : "Product removed from favorites.";
    } catch (error) {
      console.error(error);
      actionMessage.textContent = "Unable to save favorite in this browser.";
    }
  });

  addButton.addEventListener("click", () => {
    try {
      const count = addToCart(product.id, 1, product.stock);
      actionMessage.textContent = `Added to cart. ${count} ${count === 1 ? "item" : "items"} in cart.`;
    } catch (error) {
      console.error(error);
      actionMessage.textContent =
        "Unable to save cart changes in this browser.";
    }
  });

  actions.append(favoriteButton, addButton);
  information.append(actions, actionMessage);
  return information;
}

// ----------------------------------------------------------
// 5. Combine the gallery and information into a two-column layout.
// ----------------------------------------------------------
function renderProductDetails(product) {
  productHeading.textContent = product.title;
  document.title = `${product.title} | TechNest`;

  const layout = document.createElement("div");
  layout.className = "product-detail-layout";

  layout.append(createImageGallery(product), createProductInformation(product));
  detailsContainer.replaceChildren(layout);
}

// ----------------------------------------------------------
// 6. Fetch the selected product and handle errors.
// ----------------------------------------------------------
async function loadProductDetails() {
  if (!Number.isSafeInteger(productId) || productId <= 0) {
    statusMessage.textContent = "Invalid product ID.";
    return;
  }

  statusMessage.textContent = "Loading product details...";

  try {
    const product = await getProductById(productId);
    renderProductDetails(product);

    statusMessage.textContent = "";
    statusMessage.hidden = true;
  } catch (error) {
    console.error("Could not load product:", error);
    statusMessage.hidden = false;
    statusMessage.textContent =
      error.message === "Product not found."
        ? "Product not found."
        : "Unable to load product details. Please try again.";
  }
}

loadProductDetails();
