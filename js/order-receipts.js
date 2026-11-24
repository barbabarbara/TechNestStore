/* Shared receipt rendering for Cart and Orders. */
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function receiptElement(tag, text, className = "") {
  const element = document.createElement(tag);
  element.textContent = text;
  element.className = className;
  return element;
}

// Receipt data is rendered as text, never as untrusted HTML.
export function renderOrderReceipts(receipts, orders, { openLatest = false } = {}) {
  const fragment = document.createDocumentFragment();
  orders.forEach((order, index) => {
    const receipt = document.createElement("details");
    receipt.className = "order-receipt";
    receipt.open = openLatest && index === 0;
    const heading = receiptElement("summary", `${order.number} · ${money.format(order.totalCents / 100)}`);
    const date = receiptElement("p", new Date(order.date).toLocaleString("en-GB"), "receipt-date");
    const items = document.createElement("ul");
    items.className = "receipt-items";
    for (const item of order.items) {
      const row = document.createElement("li");
      const info = document.createElement("div");
      info.append(
        receiptElement("strong", item.title),
        receiptElement("p", `${item.brand} · Quantity: ${item.quantity} · ${money.format(item.unitCents / 100)} each`, "receipt-date"),
      );
      row.append(info, receiptElement("strong", money.format(item.totalCents / 100)));
      items.append(row);
    }
    const total = document.createElement("div");
    total.className = "receipt-total";
    total.append(receiptElement("span", `${order.quantity} items purchased · Order total`), receiptElement("strong", money.format(order.totalCents / 100)));
    receipt.append(heading, date, items, total, receiptElement("p", "Simulated order — no real payment collected.", "receipt-date"));
    fragment.append(receipt);
  });
  receipts.replaceChildren(fragment);
}

