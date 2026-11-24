// Homepage carousel. Reuse the catalogue API and its local stock overrides.
import { getElectronicsProducts, ELECTRONICS_CATEGORIES } from "./api.js";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const ROTATION_INTERVAL_MS = 6000;

const preferred = [
  ["mobile-accessories", /airpods max/i],
  ["tablets", /ipad mini/i],
  ["smartphones", /iphone 5s/i],
  ["laptops", /macbook/i],
  ["smartphones", /samsung/i],
  ["laptops", /lenovo/i],
  ["tablets", /samsung/i],
  ["mobile-accessories", /watch/i],
  ["smartphones", /iphone 6/i],
  ["laptops", /huawei/i],
];

const taglines = {
  "mobile-accessories": "The details make the difference.",
  tablets: "More room for your ideas.",
  smartphones: "Stay connected, every day.",
  laptops: "Made for work and play.",
};

export function selectFeaturedProducts(products) {
  const available = products.filter(
    (product) =>
      Number.isSafeInteger(product.id) &&
      product.id > 0 &&
      Number.isSafeInteger(product.stock) &&
      product.stock > 0 &&
      Number.isFinite(product.price) &&
      product.price >= 0 &&
      ELECTRONICS_CATEGORIES.includes(product.category),
  );

  const selected = [];

  // Select preferred products without duplicates.
  for (const [category, title] of preferred) {
    const candidates = available.filter(
      (product) =>
        product.category === category &&
        !selected.some((item) => item.id === product.id),
    );

    const product =
      candidates.find((item) => title.test(item.title)) || candidates[0];

    if (product) selected.push(product);
  }

  // Fill missing slots with other available products.
  for (const product of available) {
    if (selected.length >= preferred.length) break;

    if (!selected.some((item) => item.id === product.id)) {
      selected.push(product);
    }
  }

  return selected;
}

const placeholder = "./assets/images/product-placeholder.svg";

function featuredImage(product) {
  const sources = [
    ...(Array.isArray(product.images) ? product.images : []),
    product.thumbnail,
  ];
  return (
    sources.find(
      (source) => typeof source === "string" && /^https?:\/\//i.test(source),
    ) || placeholder
  );
}

export function initFeaturedProducts({
  loadProducts = getElectronicsProducts,
} = {}) {
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
  const carousel = get("carousel");
  const rotation = get("rotation");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let products = [];
  let current = 0;
  let dotButtons = [];
  let request = 0;
  let timer = null;
  let rotationRequested = !motion.matches;
  let hovering = false;
  let loading = true;
  let pointerAction = null;

  function stopTimer() {
    if (timer !== null) clearInterval(timer);
    timer = null;
  }

  function syncRotation() {
    stopTimer();
    if (
      rotationRequested &&
      !hovering &&
      !document.hidden &&
      !loading &&
      products.length > 1
    ) {
      timer = setInterval(() => show(current + 1), ROTATION_INTERVAL_MS);
    }
    rotation.textContent = rotationRequested ? "Ⅱ" : "▶";
    rotation.setAttribute(
      "aria-label",
      rotationRequested
        ? "Pause automatic rotation"
        : "Start automatic rotation",
    );
    slide.setAttribute("aria-live", timer === null ? "polite" : "off");
  }

  function stopRotation() {
    rotationRequested = false;
    syncRotation();
  }

  function showManually(index) {
    stopRotation();
    show(index);
  }

  function render() {
    if (!products.length) return;
    const product = products[current];
    get("brand").textContent = product.brand || "TechNest";
    get("name").textContent = product.title;
    get("tagline").textContent = /airpods max/i.test(product.title)
      ? "Sound reimagined."
      : taglines[product.category];
    get("description").textContent =
      product.description || "Explore the product details.";
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

  previous.addEventListener("click", () => showManually(current - 1));
  next.addEventListener("click", () => showManually(current + 1));
  carousel.addEventListener("mouseenter", () => {
    hovering = true;
    syncRotation();
  });
  carousel.addEventListener("mouseleave", () => {
    hovering = false;
    syncRotation();
  });
  carousel.addEventListener("focusin", stopRotation);

  // Capture the intended action before a pointer click moves keyboard focus.
  rotation.addEventListener("pointerdown", () => {
    pointerAction = !rotationRequested;
  });
  rotation.addEventListener("pointercancel", () => {
    pointerAction = null;
  });
  rotation.addEventListener("click", (event) => {
    rotationRequested =
      event.detail > 0 && pointerAction !== null
        ? pointerAction
        : !rotationRequested;
    pointerAction = null;
    syncRotation();
  });
  motion.addEventListener("change", (event) => {
    if (event.matches) stopRotation();
  });
  document.addEventListener("visibilitychange", syncRotation);
  window.addEventListener("pagehide", stopTimer);
  image.addEventListener("error", () => {
    if (!image.src.endsWith("/product-placeholder.svg"))
      image.src = placeholder;
  });

  async function refresh() {
    const requestId = ++request;
    loading = true;
    syncRotation();
    const selectedId = products[current]?.id;
    status.textContent = "Loading featured products…";
    try {
      let warning = "";
      const items = selectFeaturedProducts(
        await loadProducts({
          onWarning(message) {
            warning = message;
          },
        }),
      );
      if (requestId !== request) return;
      products = items;
      current = Math.max(
        0,
        products.findIndex((product) => product.id === selectedId),
      );
      slide.hidden = products.length === 0;
      controls.hidden = products.length < 2;
      pagination.hidden = products.length === 0;
      status.textContent = [
        warning,
        products.length ? "" : "No featured products are currently available.",
      ]
        .filter(Boolean)
        .join(" ");
      dotButtons = products.map((product, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "featured-dot";
        button.setAttribute("aria-label", `Show ${product.title}`);
        button.addEventListener("click", () => showManually(index));
        return button;
      });
      dots.replaceChildren(...dotButtons);
      render();
    } catch (error) {
      if (requestId !== request) return;
      console.error(error);
      products = [];
      slide.hidden = controls.hidden = pagination.hidden = true;
      status.textContent =
        "Unable to load featured products. Please refresh the page.";
    } finally {
      if (requestId === request) {
        loading = false;
        syncRotation();
      }
    }
  }

  window.addEventListener("technest:catalogue-change", refresh);
  window.addEventListener("storage", refresh);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) refresh();
  });
  return refresh();
}
