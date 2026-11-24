/* === TechNestStore | Reusable product card
   Shared by Catalogue and Favorites ==== */

import { isFavorite, toggleFavorite, addToCart } from "./storage.js";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// Both pages can react to a favorite change or cart addition.
export function createProductCard(product, options = {}) {
  const {
    onFavoriteChange = () => {},
    onCartChange = () => {},
    onError = (error) => console.error(error),
    favoriteIds = null, // A Set supplied by a page that renders multiple cards.
  } = options;

  const card = document.createElement("li");
  card.className = "product-card";
  card.dataset.productId = String(product.id);

  const media = document.createElement("div");
  media.className = "product-card-media";

  const imageLink = document.createElement("a");
  imageLink.className = "product-card-image-link";
  imageLink.href = `./product.html?id=${product.id}`;
  // Mouse users may click the image; keyboard users get one link on the title.
  imageLink.tabIndex = -1;
  imageLink.setAttribute("aria-hidden", "true");

  const image = document.createElement("img");
  image.className = "product-card-image";
  // Preserve the image rule chosen in Lesson 5.
  image.src =
    product.category === "smartphones"
      ? product.images?.[2] || product.images?.[0] || product.thumbnail
      : product.thumbnail || product.images?.[0] || "";
  image.alt = product.title;
  image.loading = "lazy";
  image.width = 320;
  image.height = 240;
  imageLink.append(image);

  const category = document.createElement("span");
  category.className = "product-card-category";
  category.textContent = (product.category || "Other").replaceAll("-", " ");

  const favorite = document.createElement("button");
  favorite.className = "product-card-favorite";
  favorite.type = "button";

  function updateHeart(saved) {
    favorite.textContent = saved ? "♥" : "♡";
    favorite.setAttribute("aria-pressed", String(saved));
    favorite.setAttribute(
      "aria-label",
      saved
        ? `Remove ${product.title} from favorites`
        : `Add ${product.title} to favorites`,
    );
    favorite.title = saved ? "Remove from favorites" : "Add to favorites";
  }

  updateHeart(favoriteIds instanceof Set
    ? favoriteIds.has(product.id)
    : isFavorite(product.id));
  favorite.addEventListener("click", () => {
    try {
      const saved = toggleFavorite(product.id);
      updateHeart(saved);
      onFavoriteChange(product, saved);
    } catch (error) {
      onError(error);
    }
  });

  media.append(imageLink, category, favorite);

  const content = document.createElement("div");
  content.className = "product-card-content";

  const brand = document.createElement("p");
  brand.className = "product-card-brand";
  brand.textContent = product.brand || "Unknown brand";

  const title = document.createElement("h2");
  title.className = "product-card-title";
  const titleLink = document.createElement("a");
  titleLink.className = "product-card-title-link";
  titleLink.href = imageLink.href;
  titleLink.textContent = product.title;
  title.append(titleLink);

  const description = document.createElement("p");
  description.className = "product-card-description";
  description.textContent = product.description || "";

  const stock = document.createElement("p");
  stock.className = "product-card-stock";
  stock.textContent = Number.isSafeInteger(product.stock)
    ? product.stock > 0 ? `${product.stock} in stock` : "Out of stock"
    : "Stock unavailable";

  const footer = document.createElement("div");
  footer.className = "product-card-footer";
  const price = document.createElement("p");
  price.className = "product-card-price";
  price.textContent = Number.isFinite(product.price)
    ? money.format(product.price)
    : "Price unavailable";

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "add-to-cart-button";
  addButton.textContent = "+ Add";
  addButton.setAttribute("aria-label", `Add ${product.title} to cart`);
  // Do not offer unavailable products as purchasable.
  addButton.disabled = product.stock === 0 || !Number.isFinite(product.price);
  if (product.stock === 0) addButton.title = "Out of stock";

  addButton.addEventListener("click", () => {
    try {
      const count = addToCart(product.id, 1, product.stock);
      onCartChange(product, count);
    } catch (error) {
      onError(error);
    }
  });

  footer.append(price, addButton);
  content.append(brand, title, description, stock, footer);
  card.append(media, content);
  return card;
}
