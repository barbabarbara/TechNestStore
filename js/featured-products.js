// Homepage carousel. Reuse the catalogue API and its local stock overrides.
import { getElectronicsProducts, ELECTRONICS_CATEGORIES } from "./api.js";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const preferred = [
  ["mobile-accessories", /airpods max/i],
  ["tablets", /ipad mini/i],
  ["smartphones", /iphone 5s/i],
];

const taglines = {
  "mobile-accessories": "The details make the difference.",
  tablets: "More room for your ideas.",
  smartphones: "Stay connected, every day.",
  laptops: "Made for work and play.",
};

export function selectFeaturedProducts(products) {
  const available = products.filter((product) =>
    Number.isSafeInteger(product.id) && product.id > 0 &&
    Number.isSafeInteger(product.stock) && product.stock > 0 &&
    Number.isFinite(product.price) && product.price >= 0 &&
    ELECTRONICS_CATEGORIES.includes(product.category)
  );
  const selected = [];
  for (const [category, title] of preferred) {
    const candidates = available.filter((product) => product.category === category);
    const product = candidates.find((item) => title.test(item.title)) || candidates[0];
    if (product) selected.push(product);
  }
  // Fill missing slots with other available products, without duplicates.
  for (const product of available) {
    if (selected.length === 3) break;
    if (!selected.some((item) => item.id === product.id)) selected.push(product);
  }
  return selected;
}

const placeholder = "./assets/images/product-placeholder.svg";

function featuredImage(product) {
  const sources = [...(Array.isArray(product.images) ? product.images : []), product.thumbnail];
  return sources.find((source) =>
    typeof source === "string" && /^https?:\/\//i.test(source)
  ) || placeholder;
}

export function initFeaturedProducts({ loadProducts = getElectronicsProducts } = {}) {
  const get = (id) => document.querySelector(`#featured-${id}`);
  const slide = get("slide");
  if (!slide) return;

  const status = get("status");
  const controls = get("controls");
  const previous = get("prev");
  const next = get("next");
  const pagination = get("pagination");
  const dots = get("dots");
  const count = get("count");
  const image = get("image");
  let products = [];
  let current = 0;
  let dotButtons = [];
  let request = 0;

  function render() {
    if (!products.length) return;
    const product = products[current];
    get("brand").textContent = product.brand || "TechNest";
    get("name").textContent = product.title;
    get("tagline").textContent = /airpods max/i.test(product.title)
      ? "Sound reimagined."
      : taglines[product.category];
    get("description").textContent = product.description || "Explore the product details.";
    get("price").textContent = money.format(product.price);
    get("link").href = `./pages/product.html?id=${product.id}`;
    image.src = featuredImage(product);
    image.alt = product.title;
    count.textContent = `${current + 1} of ${products.length}`;
    dotButtons.forEach((button, index) => {
      button.setAttribute("aria-current", String(index === current));
    });
  }

  function show(index) {
    if (!products.length) return;
    current = (index + products.length) % products.length;
    render();
  }

  previous.addEventListener("click", () => show(current - 1));
  next.addEventListener("click", () => show(current + 1));
  image.addEventListener("error", () => {
    if (!image.src.endsWith("/product-placeholder.svg")) image.src = placeholder;
  });

  async function refresh() {
    const requestId = ++request;
    const selectedId = products[current]?.id;
    status.textContent = "Loading featured products…";
    try {
      const items = selectFeaturedProducts(await loadProducts());
      if (requestId !== request) return;
      products = items;
      current = Math.max(0, products.findIndex((product) => product.id === selectedId));
      slide.hidden = products.length === 0;
      controls.hidden = products.length < 2;
      pagination.hidden = products.length === 0;
      status.textContent = products.length ? "" : "No featured products are currently available.";
      dotButtons = products.map((product, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "featured-dot";
        button.setAttribute("aria-label", `Show ${product.title}`);
        button.addEventListener("click", () => show(index));
        return button;
      });
      dots.replaceChildren(...dotButtons);
      render();
    } catch (error) {
      if (requestId !== request) return;
      console.error(error);
      products = [];
      slide.hidden = controls.hidden = pagination.hidden = true;
      status.textContent = "Unable to load featured products. Please refresh the page.";
    }
  }

  window.addEventListener("technest:catalogue-change", refresh);
  window.addEventListener("storage", refresh);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) refresh();
  });
  return refresh();
}
