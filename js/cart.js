/* === TechNestStore | Shopping cart === */
import { initLayout } from "./ui.js";
import { getProductById } from "./api.js";
import { getOrderHistory } from "./admin-data.js";
import { renderOrderReceipts } from "./order-receipts.js";
import { calculateCartSubtotal } from "./cart-utils.js";
import {
  getCartItems,
  getCartItemCount,
  setCartQuantity,
  completePurchase,
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
const checkoutButton = document.querySelector("#checkout-button");
const historySection = document.querySelector("#order-history");
const receipts = document.querySelector("#order-receipts");
const summaryHeading = document.querySelector("#cart-summary-heading");

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
let loadedProducts = [];

function findLoadedProduct(id) {
  const product = loadedProducts.find((item) => item?.id === id);
  return product && Number.isFinite(product.price) ? product : null;
}

function updateCartSummary() {
  const entries = getCartItems();
  const subtotal = calculateCartSubtotal(entries, loadedProducts);

  // The summary and the navigation use the same stored quantities.
  const quantity = getCartItemCount();
  count.textContent = String(quantity);
  totalElement.textContent = money.format(subtotal);
  checkoutButton.disabled =
    entries.length === 0 || entries.some((entry) => !canPurchase(entry));
  const orders = getOrderHistory();
  const completed = entries.length === 0 && orders.length > 0;
  summary.hidden = entries.length === 0 && !completed;
  empty.hidden = entries.length !== 0 || completed;
  list.hidden = completed;
  status.hidden = completed;
  checkoutButton.hidden = completed;
  summaryHeading.textContent = completed ? "Current cart" : "Order summary";
  // Cart displays only the latest completed order; the Orders page lists all.
  historySection.hidden = !completed;
  renderOrderReceipts(receipts, completed ? orders.slice(0, 1) : [], { openLatest: true });
  status.textContent =
    quantity === 0
      ? "Your cart is empty."
      : `${quantity} ${quantity === 1 ? "item" : "items"} in your cart.`;
}

function canPurchase(entry) {
  const product = findLoadedProduct(entry.id);
  return product && Number.isSafeInteger(product.stock) && product.stock >= entry.quantity;
}

function showPurchaseConfirmation(focus = false) {
  actionStatus.classList.add("purchase-success");
  actionStatus.textContent = "Thank you for your purchase! Your simulated order has been completed successfully.";
  if (focus) {
    actionStatus.tabIndex = -1;
    actionStatus.focus({ preventScroll: true });
  }
}

function showStorageError(error) {
  console.error("Could not update cart:", error);
  actionStatus.textContent = "Unable to save cart changes in this browser.";
}

// When an item is removed, keyboard focus must not disappear with its button.
function focusAfterRemoval(row) {
  const nextControl = row.nextElementSibling?.querySelector("button");
  const previousControl = row.previousElementSibling?.querySelector("button");
  const target = nextControl || previousControl || status;
  if (target === status) status.tabIndex = -1;
  return target;
}

function changeQuantity(id, quantity, row, updateRow) {
  try {
    // Write to storage first: failures must not change the visible controls.
    setCartQuantity(id, quantity);

    if (quantity === 0) {
      const nextFocus = focusAfterRemoval(row);
      row.remove();
      nextFocus.focus({ preventScroll: true });
      actionStatus.textContent = "Item removed from cart.";
    } else {
      // Keep the same DOM row and focused button instead of rebuilding the list.
      updateRow(quantity);
      actionStatus.textContent = `Quantity updated to ${quantity}.`;
    }

    updateCartSummary();
  } catch (error) {
    showStorageError(error);
  }
}

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
  const counter = document.createElement("div");
  counter.className = "cart-quantity-controls";

  const decrement = document.createElement("button");
  decrement.type = "button";
  decrement.textContent = "−";
  decrement.setAttribute("aria-label", `Decrease quantity of ${product.title}`);

  const increment = document.createElement("button");
  increment.type = "button";
  increment.textContent = "+";
  increment.setAttribute("aria-label", `Increase quantity of ${product.title}`);
  const maxAllowed = Number.isSafeInteger(product.stock)
    ? Math.min(MAX_CART_QUANTITY, Math.max(0, product.stock))
    : MAX_CART_QUANTITY;

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "cart-remove";
  remove.textContent = "Remove";
  remove.setAttribute("aria-label", `Remove ${product.title} from cart`);

  const lineTotal = document.createElement("strong");
  lineTotal.className = "cart-line-total";

  let currentQuantity = quantity;
  function updateRow(nextQuantity) {
    currentQuantity = nextQuantity;
    quantityLabel.textContent = `Quantity: ${nextQuantity}`;
    lineTotal.textContent = money.format(product.price * nextQuantity);
    increment.disabled = nextQuantity >= maxAllowed;
  }

  decrement.addEventListener("click", () => {
    changeQuantity(product.id, currentQuantity - 1, row, updateRow);
  });
  increment.addEventListener("click", () => {
    if (!increment.disabled) {
      changeQuantity(product.id, currentQuantity + 1, row, updateRow);
    }
  });
  remove.addEventListener("click", () => {
    changeQuantity(product.id, 0, row, updateRow);
  });

  updateRow(quantity);
  counter.append(decrement, increment);
  controls.append(quantityLabel, counter, remove, lineTotal);
  row.append(link, info, controls);
  return row;
}

// A network failure or removed product should not silently disappear from Cart.
// Keep a removable row so the displayed item count agrees with the header.
function createUnavailableCartRow({ id, quantity }) {
  const row = document.createElement("li");
  row.className = "cart-item";

  const media = document.createElement("div");
  media.className = "cart-item-media";
  media.textContent = "—";
  media.setAttribute("aria-hidden", "true");

  const info = document.createElement("div");
  info.className = "cart-item-details";
  const title = document.createElement("strong");
  title.textContent = `Unavailable product #${id}`;
  const explanation = document.createElement("p");
  explanation.className = "cart-item-unit-price";
  explanation.textContent = "Could not load this product; price excluded from subtotal.";
  info.append(title, explanation);

  const controls = document.createElement("div");
  controls.className = "cart-item-controls";
  const quantityLabel = document.createElement("span");
  quantityLabel.textContent = `Quantity: ${quantity}`;
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "cart-remove";
  remove.textContent = "Remove";
  remove.setAttribute("aria-label", `Remove unavailable product ${id} from cart`);
  remove.addEventListener("click", () => {
    changeQuantity(id, 0, row, () => {});
  });
  controls.append(quantityLabel, remove);
  row.append(media, info, controls);
  return row;
}

function renderCart() {
  const entries = getCartItems();
  const fragment = document.createDocumentFragment();
  for (const entry of entries) {
    const product = findLoadedProduct(entry.id);
    fragment.append(
      product
        ? createCartRow(product, entry.quantity)
        : createUnavailableCartRow(entry),
    );
  }
  list.replaceChildren(fragment);
  updateCartSummary();
}

async function loadCart() {
  const entries = getCartItems();
  if (entries.length === 0) {
    renderCart();
    if (getOrderHistory().length) showPurchaseConfirmation();
    return;
  }

  status.textContent = "Loading cart...";
  const results = await Promise.allSettled(
    entries.map((entry) => getProductById(entry.id)),
  );
  loadedProducts = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value)
    .filter((product) => product && Number.isFinite(product.price));
  renderCart();

  if (entries.some((entry) => findLoadedProduct(entry.id) && !canPurchase(entry))) {
    actionStatus.textContent = "Some quantities exceed available stock. Reduce quantities before purchasing.";
  }
  const unavailable = entries.length - loadedProducts.length;
  if (unavailable) {
    actionStatus.textContent =
      `${unavailable} ${unavailable === 1 ? "product" : "products"} could not be loaded. ` +
      "They remain in your cart and count toward the badge, but their prices " +
      "are excluded from the subtotal. Refresh to retry or remove them.";
  }
}

// Simulate a successful purchase; no payment or API order is submitted.
function checkout() {
  const entries = getCartItems();
  if (
    entries.length === 0 ||
    entries.some((entry) => !canPurchase(entry))
  ) {
    return;
  }

  try {
    // Persist first so a storage failure never displays a false confirmation.
    completePurchase(loadedProducts);
  } catch (error) {
    showStorageError(error);
    actionStatus.textContent += ` ${error.message}`;
    return;
  }

  loadedProducts = [];
  renderCart();
  showPurchaseConfirmation(true);
}

checkoutButton.disabled = true;
checkoutButton.addEventListener("click", checkout);
loadCart();

// Refresh cached pages when returning through browser Back/Forward.
window.addEventListener("pageshow", (event) => {
  if (event.persisted) window.location.reload();
});
