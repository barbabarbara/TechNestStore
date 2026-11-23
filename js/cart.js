/* === TechNestStore | Shopping cart === */
import { initLayout } from "./ui.js";
import { getProductById } from "./api.js";
import {
  getCartItems,
  getCartItemCount,
  setCartQuantity,
  removeFromCart,
  MAX_CART_QUANTITY,
} from "./storage.js";

initLayout();
const list = document.querySelector("#cart-list");
const status = document.querySelector("#cart-status");
const actionStatus = document.querySelector("#cart-action-status");
const empty = document.querySelector("#cart-empty");
const summary = document.querySelector("#cart-summary");
const count = document.querySelector("#cart-count");
const totalElement = document.querySelector("#cart-subtotal");

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
let loadedProducts = [];

function createCartRow(product, quantity) {
  const row = document.createElement("li");
  row.className = "cart-item";

  const link = document.createElement("a");
  link.className = "cart-item-media";
  link.href = `./product.html?id=${product.id}`;
  link.setAttribute("aria-label", `View ${product.title}`);
  const image = document.createElement("img");
  image.src = product.thumbnail || product.images?.[0] || "";
  image.alt = product.title;
  image.loading = "lazy";
  link.append(image);

  const info = document.createElement("div");
  info.className = "cart-item-details";
  const title = document.createElement("a");
  title.className = "cart-item-title";
  title.href = link.href;
  title.textContent = product.title;
  const brand = document.createElement("p");
  brand.className = "cart-item-brand";
  brand.textContent = product.brand || "Unknown brand";
  const unitPrice = document.createElement("p");
  unitPrice.className = "cart-item-unit-price";
  unitPrice.textContent = `${money.format(product.price)} each`;
  info.append(title, brand, unitPrice);

  const controls = document.createElement("div");
  controls.className = "cart-item-controls";
  const quantityLabel = document.createElement("span");
  quantityLabel.textContent = `Quantity: ${quantity}`;

  const counter = document.createElement("div");
  counter.className = "cart-quantity-controls";
  const decrement = document.createElement("button");
  decrement.type = "button";
  decrement.textContent = "−";
  decrement.setAttribute("aria-label", `Decrease quantity of ${product.title}`);
  // A click at quantity 1 removes the product.
  decrement.addEventListener("click", () =>
    changeQuantity(product.id, quantity - 1),
  );

  const increment = document.createElement("button");
  increment.type = "button";
  increment.textContent = "+";
  increment.setAttribute("aria-label", `Increase quantity of ${product.title}`);
  const maxAllowed = Number.isSafeInteger(product.stock)
    ? Math.min(MAX_CART_QUANTITY, Math.max(0, product.stock))
    : MAX_CART_QUANTITY;
  increment.disabled = quantity >= maxAllowed;
  increment.addEventListener("click", () =>
    changeQuantity(product.id, quantity + 1),
  );
  counter.append(decrement, increment);

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "cart-remove";
  remove.textContent = "Remove";
  remove.setAttribute("aria-label", `Remove ${product.title} from cart`);
  remove.addEventListener("click", () => {
    try {
      removeFromCart(product.id);
      actionStatus.textContent = `${product.title} removed from cart.`;
      renderCart();
    } catch (error) {
      showStorageError(error);
    }
  });

  const lineTotal = document.createElement("strong");
  lineTotal.className = "cart-line-total";
  lineTotal.textContent = money.format(product.price * quantity);
  controls.append(quantityLabel, counter, remove, lineTotal);

  row.append(link, info, controls);
  return row;
}

function showStorageError(error) {
  console.error("Could not update cart:", error);
  actionStatus.textContent = "Unable to save cart changes in this browser.";
}

function changeQuantity(id, quantity) {
  try {
    setCartQuantity(id, quantity);
    actionStatus.textContent =
      quantity === 0
        ? "Item removed from cart."
        : `Quantity updated to ${quantity}.`;
    renderCart();
  } catch (error) {
    showStorageError(error);
  }
}

function renderCart() {
  const entries = getCartItems();
  const items = entries
    .map((entry) => ({
      product: loadedProducts.find((p) => p.id === entry.id),
      quantity: entry.quantity,
    }))
    .filter((item) => item.product && Number.isFinite(item.product.price));

  const fragment = document.createDocumentFragment();
  for (const { product, quantity } of items) {
    fragment.append(createCartRow(product, quantity));
  }
  list.replaceChildren(fragment);

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const visibleCount = items.reduce((sum, item) => sum + item.quantity, 0);
  count.textContent = String(visibleCount);
  totalElement.textContent = money.format(subtotal);
  summary.hidden = items.length === 0;
  empty.hidden = items.length !== 0;
  status.textContent =
    entries.length === 0
      ? "Your cart is empty."
      : `${getCartItemCount()} ${getCartItemCount() === 1 ? "item" : "items"} in your cart.`;
}

async function loadCart() {
  const entries = getCartItems();
  if (entries.length === 0) {
    renderCart();
    return;
  }
  status.textContent = "Loading cart...";
  const results = await Promise.allSettled(
    entries.map((entry) => getProductById(entry.id)),
  );
  loadedProducts = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);
  renderCart();
  const missing = entries.length - loadedProducts.length;
  if (missing) {
    actionStatus.textContent = `${missing} cart items could not be loaded and are excluded from the subtotal.`;
  }
}

loadCart();
