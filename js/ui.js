import { getFavoriteIds, getCartItemCount } from "./storage.js";

// Navigation data: one object for each page.
const navigationItems = [
  {
    label: "Home",
    path: "index.html",
    page: "home",
  },
  {
    label: "Catalogue",
    path: "pages/products.html",
    page: "products",
  },
  {
    label: "Favorites",
    path: "pages/favorites.html",
    page: "favorites",
  },
  {
    label: "Cart",
    path: "pages/cart.html",
    page: "cart",
  },
  {
    label: "Admin",
    path: "pages/admin.html",
    page: "admin",
  },
];

// Register window listeners only once, even if initLayout runs again.
let countListenersAttached = false;

// Export the function for use on other pages.
export function initLayout() {
  // Find the placeholders in the HTML.
  const headerContainer = document.querySelector("#site-header");
  const footerContainer = document.querySelector("#site-footer");

  // Stop if the required placeholders are missing.
  if (!headerContainer || !footerContainer) {
    console.error("Shared layout containers were not found.");
    return;
  }

  // Read the current page configuration.
  const rootPath = document.body.dataset.root || "./";
  const currentPage = document.body.dataset.page || "";

  // Convert navigation objects into HTML links.
  const navigationHTML = navigationItems
    .map((item) => {
      const isActive = item.page === currentPage;

      const activeClass = isActive ? " is-active" : "";

      const currentAttribute = isActive ? ' aria-current="page"' : "";

      // Only Favorites and Cart need an item-count badge.
      const countBadge =
        item.page === "favorites" || item.page === "cart"
          ? `<span class="nav-count" data-nav-count="${item.page}" aria-hidden="true" hidden></span>`
          : "";

      return `
        <li>
          <a
            class="nav-link${activeClass}"
            href="${rootPath}${item.path}"${currentAttribute}
            data-nav-page="${item.page}"
          >
            ${item.label}${countBadge}
          </a>
        </li>
      `;
    })
    .join("");

  // Insert the shared header into the document.
  headerContainer.innerHTML = `
    <header class="site-header">
      <div class="shell header-inner">
        <a
          class="brand"
          href="${rootPath}index.html"
          aria-label="TechNest home"
        >
          TechNest<span class="brand-dot" aria-hidden="true">.</span>
        </a>

        <nav class="site-nav" aria-label="Main navigation">
          <ul class="nav-list">
            ${navigationHTML}
          </ul>
        </nav>
      </div>
    </header>
  `;

  // Initialize counts after the navigation links exist in the DOM.
  updateNavigationCounts();

  // A custom event updates this tab; storage covers other browser tabs.
  if (!countListenersAttached) {
    window.addEventListener("technest:storage-change", updateNavigationCounts);
    window.addEventListener("storage", (event) => {
      if (
        event.key === "technest-favorites" ||
        event.key === "technest-cart-v1" ||
        event.key === null
      ) {
        updateNavigationCounts();
      }
    });
    window.addEventListener("pageshow", updateNavigationCounts);
    countListenersAttached = true;
  }

  // Insert the shared footer into the document.
  footerContainer.innerHTML = `
    <footer class="site-footer">
      <div class="shell footer-inner">
        <p>© ${new Date().getFullYear()} TechNest. Student Project. Simulated orders only</p>
      </div>
    </footer>
  `;
}

// Refresh the Favorites and Cart badges using the stored values.
export function updateNavigationCounts() {
  const counts = {
    favorites: getFavoriteIds().length,
    cart: getCartItemCount(),
  };

  for (const [page, count] of Object.entries(counts)) {
    const badge = document.querySelector(`[data-nav-count="${page}"]`);
    const link = document.querySelector(`[data-nav-page="${page}"]`);

    if (!badge || !link) continue;

    badge.textContent = String(count);
    badge.hidden = count === 0;

    const label =
      page === "favorites"
        ? `Favorites, ${count} saved ${count === 1 ? "product" : "products"}`
        : `Cart, ${count} ${count === 1 ? "item" : "items"}`;

    link.setAttribute("aria-label", label);
  }
}
