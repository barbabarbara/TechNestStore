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

      return `
        <li>
          <a
            class="nav-link${activeClass}"
            href="${rootPath}${item.path}"${currentAttribute}
          >
            ${item.label}
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

  // Insert the shared footer into the document.
  footerContainer.innerHTML = `
    <footer class="site-footer">
      <div class="shell footer-inner">
        <p>© ${new Date().getFullYear()} TechNest. Student Project. Simulated orders only</p>
      </div>
    </footer>
  `;
}
