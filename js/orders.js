/* === TechNestStore | Order history === */
import { initLayout } from "./ui.js";
import { getOrderHistory } from "./admin-data.js";
import { renderOrderReceipts } from "./order-receipts.js";

initLayout();

const receipts = document.querySelector("#orders-receipts");
const status = document.querySelector("#orders-status");
const empty = document.querySelector("#orders-empty");

function renderOrders() {
  const orders = getOrderHistory();
  status.textContent = `${orders.length} completed ${orders.length === 1 ? "order" : "orders"}.`;
  empty.hidden = orders.length > 0;
  renderOrderReceipts(receipts, orders);
}

renderOrders();

// Refresh history after Admin reset or purchases in another browser tab.
window.addEventListener("technest:catalogue-change", renderOrders);
window.addEventListener("storage", renderOrders);
window.addEventListener("pageshow", renderOrders);
