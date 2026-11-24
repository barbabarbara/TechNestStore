# TechNestStore — Manual testing checklist

This checklist covers the complete TechNestStore application.


## 1. Test instructions

1. Open the latest project in VS Code and start Live Server from `index.html`.
2. Use the same URL, host and port throughout testing. Different origins have separate browser storage.
3. Use a dedicated browser profile or test environment. Start with **Admin → Reset all local changes → Confirm**. This deletes saved orders, favorites, cart and local product changes in that browser.
4. Record original API product prices and stock before purchasing or editing them. Do not assume the API always returns the same catalogue count.
5. Open DevTools (F12) and monitor Console and Network while testing.
6. Tick a checkbox only after its expected result has been observed. Record failed or blocked cases in the defect log below. Reuse the same product names and IDs when comparing pages.
7. Perform the final confirmed reset only after persistence and history tests are finished.

**Priority:** P0 = release-critical; P1 = important; P2 = exploratory/edge case. Run the P0 checkout, stock and reset cases first if time is limited.

**Scope:** All purchases and API writes are simulated. Data is local to the browser; there is no real payment, account authentication, shared server inventory or cross-device order history. These are not expected features.


## 2. Shared layout, navigation and homepage

- [ ] **NAV-01 (P1) — All pages:** Open Home, Catalogue, a Product Details page, Favorites, Cart, Orders and Admin. Expected: each page loads with its shared header, footer, meaningful title and appropriate content.
- [ ] **NAV-02 (P1) — Navigation links:** Follow each menu link from both Home and a page inside `pages/`. Expected: correct destination, no broken relative paths, and the current navigation item is marked active on the six menu pages.
- [ ] **NAV-03 (P1) — Branding:** Check the green logo, TechNest text and favicon on every page. Click the brand. Expected: assets load, logo links to Home and favicon is visible in the browser tab.
- [ ] **NAV-04 (P1) — Footer:** Click DummyJSON API. Expected: `https://dummyjson.com/docs/products` opens in a new tab; the original page remains open.
- [ ] **NAV-05 (P1) — Back/Forward:** Navigate between Catalogue, Product Details, Cart and Orders; use browser Back and Forward. Expected: correct pages, current local data after navigation/refresh, and no broken history navigation.
- [ ] **NAV-06 (P1) — Counters:** With an empty cart and no favorites, add/remove items. Expected: Cart badge counts units; Favorites badge counts distinct saved products; zero badges are hidden.
- [ ] **HOME-01 (P1) — Hero:** Check headline, description, phone illustration and category images. Expected: all content visible, no overlapping or clipped text.
- [ ] **HOME-02 (P1) — Explore products:** Click the main CTA, View all products and the closing banner link. Expected: Catalogue opens.
- [ ] **HOME-03 (P1) — About TechNest:** Click to show and hide the information twice. Expected: text visibility, button label and `aria-expanded` change correctly.
- [ ] **HOME-04 (P1) — Category links:** Click each of Smartphones, Laptops, Tablets and Mobile accessories. Expected: Catalogue opens with the matching filter selected and only matching products.

- [ ] **HOME-05 (P1) — Autoplay:** With ten eligible products and reduced motion disabled, start at product 1, enable Play and keep the pointer outside the carousel with the tab visible. Expected: the next product appears approximately every six seconds, the counter and active dot stay synchronized, and product 10 wraps to product 1 after a full 60-second cycle.
- [ ] **HOME-06 (P1) — Play/Pause and manual navigation:** Click Pause, move the pointer away and wait 12 seconds. Expected: product remains unchanged. Click Play and move the pointer away. Expected: rotation resumes. Click an arrow or dot. Expected: manual selection works and autoplay stops until Play is selected again. From product 1, click Previous to reach product 10, then Next to return to product 1; select dot 10 directly.
- [ ] **HOME-07 (P1) — Hover, focus and hidden tab:** Hover for six seconds. Expected: no change; moving the pointer away restarts the timer if autoplay was enabled. Tab to a control. Expected: autoplay stops until explicit Play. Switch tabs while autoplay is enabled. Expected: no rotation while hidden; it resumes after returning if not manually paused.
- [ ] **HOME-08 (P1) — Reduced motion and narrow screens:** Enable reduced motion in the operating system or DevTools and reload. Expected: carousel starts paused, manual controls remain usable. Check at 320, 390 and 768 px; all three buttons and ten dots fit (wrapping if needed), with no horizontal overflow, and controls have visible keyboard focus.
- [ ] **HOME-09 (P2) — Inventory and refresh:** Reduce available featured products to one or zero in a test environment. Expected: timer stops, unnecessary controls are hidden and the empty state is shown when appropriate. Restore the inventory and verify no duplicate timers.

- [ ] **HOME-10 (P1) — Ten-product selection:** With at least ten valid, in-stock electronics products, pause the carousel and navigate all ten slides. Expected: counter shows 1 of 10 through 10 of 10, ten dots appear, no product ID repeats, and all four categories are represented when enough eligible products exist in each. Follow View product to verify the correct product ID.
- [ ] **HOME-11 (P1) — Preferred product unavailable:** In a test environment, set a preferred product stock to zero and refresh Home. Expected: the sold-out product is excluded, an available alternative is chosen from the category if possible, and other eligible products fill remaining slots up to ten. If fewer than ten eligible products exist, the counter and dots reflect the actual number. Restore test inventory afterward.

## 3. Product catalogue (GET, search, filters and sorting)

- [ ] **CAT-01 (P0) — API loading:** Open Catalogue after a clean start. Expected: loading status resolves to a product grid from the four electronics categories, with prices, images, brand, title, category and stock.
- [ ] **CAT-02 (P1) — Product count:** Count a small filtered result and compare with the displayed Showing X of Y text. Expected: counts agree with visible cards and unfiltered total.
- [ ] **CAT-03 (P1) — Search:** Search for a known product name, then brand, category and a word from its description. Expected: relevant matching results appear after the short debounce.
- [ ] **CAT-04 (P1) — Search normalization:** Search using uppercase/lowercase and leading/trailing spaces. Expected: equivalent results.
- [ ] **CAT-05 (P1) — No matches:** Search for `zz-no-such-product-999`. Expected: a clear no-results message, no stale cards and no error.
- [ ] **CAT-06 (P1) — Categories:** Select each category individually and then All categories. Expected: correct product groups and restoration of the full list.
- [ ] **CAT-07 (P1) — Brand filter:** Select a known brand and then All brands. Expected: only matching brands are shown, then all available brands.
- [ ] **CAT-08 (P1) — Combined filters:** Combine search, category and brand, including an incompatible combination. Expected: all active criteria apply together; incompatible criteria give no results.
- [ ] **CAT-09 (P1) — Sorting:** Test Name: A to Z, Price: Low to high, Price: High to low and Default order. Expected: correct alphabetical/numeric order; filters remain active; default restores source order for matching products.
- [ ] **CAT-10 (P1) — Reset filters:** Set all filters and sorting, then click Clear filters. Expected: search, category, brand and sorting return to defaults, all available products return.
- [ ] **CAT-11 (P2) — Rapid input:** Type quickly, immediately change a dropdown or clear filters. Expected: final selection wins; a pending search does not restore old results.
- [ ] **CAT-12 (P1) — Card actions:** Click a title/image, heart and Add to cart separately. Expected: details open correctly; heart and cart actions update saved data without unwanted navigation.
- [ ] **CAT-13 (P1) — Local product changes:** After Admin create/edit/delete, revisit Catalogue and search for the affected product. Expected: local changes appear without duplicate cards or obsolete data.

## 4. Product details and image gallery

- [ ] **PROD-01 (P1) — Details:** Open a product. Expected: correct title, description, price, brand, category, availability and any available specifications match the selected product.
- [ ] **PROD-02 (P1) — Gallery:** Choose a product with several images; click next/previous and thumbnails. Expected: main image, selected thumbnail and image counter update together; arrows wrap from last to first and vice versa.
- [ ] **PROD-03 (P1) — Single image:** Open the locally created QA Test Phone. Expected: placeholder image is visible; unnecessary gallery arrows and thumbnails are absent for a single image.
- [ ] **PROD-04 (P1) — Actions:** Save/remove a favorite and add the product to Cart. Expected: correct button states, feedback and navigation counts.
- [ ] **PROD-05 (P1) — Back to catalogue:** Click the return link. Expected: Catalogue opens without a broken path.
- [ ] **PROD-06 (P1) — Invalid IDs:** Open `pages/product.html` without an ID and with `?id=abc`, `?id=0`, `?id=-1` or `?id=1.5`. Expected: clear invalid-ID status, no usable purchase controls, no uncaught exception.
- [ ] **PROD-07 (P1) — Missing product:** Use a nonexistent positive ID or a previously deleted product ID. Expected: an error message and working navigation, no misleading product details.
- [ ] **PROD-08 (P1) — Availability:** Compare stock with Catalogue and Admin after a purchase. Expected: remaining quantity matches; zero stock is labeled Out of stock and Add to cart is disabled.

## 5. Favorites

- [ ] **FAV-01 (P1) — Empty state:** Open Favorites after reset. Expected: no saved products message and a link back to Catalogue.
- [ ] **FAV-02 (P1) — Save:** Save two different products from Catalogue and Product Details. Expected: two distinct favorites, correct hearts and badge count.
- [ ] **FAV-03 (P1) — Toggle:** Toggle the same product off and on. Expected: no duplicate entries, correct badge and saved state.
- [ ] **FAV-04 (P1) — Remove:** Remove a favorite from the Favorites page. Expected: its card disappears, other favorites remain, count updates.
- [ ] **FAV-05 (P1) — Persistence:** Refresh and navigate away/back. Expected: saved products remain.
- [ ] **FAV-06 (P1) — Add to cart:** Add a favorite product to Cart. Expected: cart count increases; the product remains saved as a favorite.
- [ ] **FAV-07 (P1) — Purchase and stock:** Purchase a saved product. Expected: favorite is preserved and its remaining stock is correct when Favorites is reopened; sold-out products cannot be added to Cart.
- [ ] **FAV-08 (P1) — Admin deletion:** Delete a product saved as a favorite. Expected: its saved reference is removed and badge decreases; other favorites remain.

## 6. Shopping cart before payment

- [ ] **CART-01 (P0) — Fresh empty cart:** With no previous orders, open Cart. Expected: empty-cart panel and Continue shopping; no enabled Buy now button.
- [ ] **CART-02 (P0) — Add products:** Add different products from Catalogue, Product Details and Favorites. Expected: correct products, images, unit prices and quantities in Cart.
- [ ] **CART-03 (P0) — Repeated addition:** Add the same product twice within stock limits. Expected: one row, quantity 2, badge counts two units.
- [ ] **CART-04 (P0) — Quantity increase:** Click +. Expected: quantity, line total, subtotal, item count and badge increase consistently.
- [ ] **CART-05 (P0) — Quantity decrease:** Click − above quantity 1. Expected: all amounts and counts decrease consistently.
- [ ] **CART-06 (P0) — Remove at zero:** Click − when quantity is 1. Expected: row disappears, totals and counts update, keyboard focus moves to another sensible control/status.
- [ ] **CART-07 (P0) — Remove button:** Remove one of several items. Expected: only that item is removed; other quantities and totals remain correct.
- [ ] **CART-08 (P0) — Money:** Use QA Test Phone quantity 2 ($39.98) plus another product. Expected: each line total equals unit price × quantity and subtotal equals the sum, formatted as USD with two decimals.
- [ ] **CART-09 (P1) — Product links:** Click a cart item title and image. Expected: matching Product Details page opens.
- [ ] **CART-10 (P0) — Persistence:** Refresh, go to Home, then reopen Cart. Expected: items, quantities and totals persist.
- [ ] **CART-11 (P0) — Stock ceiling:** Add QA Test Phone up to its available stock and attempt one extra unit from Catalogue, Details and Cart. Expected: quantity never exceeds available stock; increment is disabled at the limit; no silent extra item.
- [ ] **CART-12 (P1) — Maximum quantity:** Create a product with stock above 99 and attempt to add more than 99 units. Expected: maximum quantity per product is 99; no overflow or incorrect totals.
- [ ] **CART-13 (P0) — Stock changes before checkout:** Put three units of a product in Cart, reduce its stock to one in Admin, reopen/refresh Cart. Expected: Buy now is disabled, stock warning shown, and reducing quantity to one allows checkout.
- [ ] **CART-14 (P1) — Admin deletion:** Delete a cart product in Admin and return to Cart. Expected: deleted product reference removed and totals/badge updated.
- [ ] **CART-15 (P1) — No reservation:** Add a product, change quantity or remove it without buying. Expected: Admin stock remains unchanged; inventory is deducted only after checkout.

## 7. Simulated checkout — critical acceptance tests

Run these before the final Admin reset. Record initial stock, current cart subtotal and favorites first.

- [ ] **BUY-01 (P0) — Successful purchase:** Add two QA Test Phone units and click Buy now. Expected: clear success message appears; exactly one new completed receipt is saved; order total is $39.98.
- [ ] **BUY-02 (P0) — Cart reset:** Immediately after BUY-01, verify no cart rows remain, Current cart shows 0 items and $0.00, Cart badge is hidden, and Buy now is hidden/disabled.
- [ ] **BUY-03 (P0) — Immediate receipt:** On the same Cart page, confirm Latest order appears expanded automatically and shows the order number, date/time, name, brand, quantity 2, unit price $19.99, line total $39.98 and order total $39.98.
- [ ] **BUY-04 (P0) — Stock deduction:** After BUY-01, check Catalogue, Product Details, Favorites (if saved) and Admin. Expected: stock decreases from 3 to 1, not by three or by one per distinct row.
- [ ] **BUY-05 (P0) — Favorites preserved:** Save a product before checkout. Expected: purchasing clears only Cart, not Favorites.
- [ ] **BUY-06 (P0) — Duplicate purchase prevention:** Double-click Buy now rapidly and try again after success. Expected: only one receipt, one stock deduction and one successful checkout; no second purchase from an empty cart.
- [ ] **BUY-07 (P0) — Second purchase:** Buy the last QA Test Phone unit. Expected: new receipt totals $19.99, stock becomes 0, first receipt remains $39.98. Cart shows only the latest receipt, expanded immediately.
- [ ] **BUY-08 (P0) — Sold out:** Check all shopping entry points after BUY-07. Expected: Out of stock, disabled Add to cart on product cards/details; no negative stock or extra purchase.
- [ ] **BUY-09 (P0) — Mixed order:** Purchase two different available products with different quantities. Expected: every receipt line is correct, stock decreases separately for each product, total quantity and amount match the pre-purchase cart.
- [ ] **BUY-10 (P1) — API product:** Purchase an original DummyJSON product and compare stock before/after in Admin and Catalogue. Expected: correct local deduction; the original server inventory is not modified.
- [ ] **BUY-11 (P0) — Refresh after payment:** Refresh Cart and reopen it from another page while empty. Expected: latest receipt and zero current cart persist; refreshing does not create an order or deduct stock again.
- [ ] **BUY-12 (P0) — New shopping session:** Click Continue shopping, add a product and return to Cart. Expected: active cart controls return, previous receipt is no longer shown in Cart while it contains items; previous receipts still exist in Orders.
- [ ] **BUY-13 (P1) — Remove instead of purchase:** With order history present, add a new item then remove the last item without buying. Expected: no new receipt or stock deduction; older latest receipt may reappear, but a removal must not be presented as a new successful purchase.
- [ ] **BUY-14 (P0) — Unavailable product:** With a cart item whose API details cannot load, verify its removable unavailable row and excluded price. Expected: Buy now remains disabled until the unavailable item is removed or successfully loaded.
- [ ] **BUY-15 (P0) — Stale stock across tabs:** Open Cart in tab A. In tab B reduce the same product's stock below the cart quantity via Admin. Return to A without refreshing and attempt purchase. Expected: checkout rejects insufficient stock; cart, receipts and stock stay unchanged by the failed attempt. Refresh and correct quantity.
- [ ] **BUY-16 (P0) — Stale price across tabs:** Open Cart in tab A, change the product price in Admin tab B, then attempt purchase in A. Expected: price change is rejected with feedback; no order or stock deduction until Cart is refreshed and the new price accepted.
- [ ] **BUY-17 (P1) — Simulation boundary:** Inspect Network during checkout. Expected: no real payment or order submission request, no payment details requested, and receipt clearly says the order is simulated.

## 8. Orders page and persistent receipts

- [ ] **ORD-01 (P0) — Empty history:** Before buying or after a confirmed reset, open Orders. Expected: 0 completed orders, empty message, Explore products link.
- [ ] **ORD-02 (P0) — History link:** After checkout, click View all orders in Cart and the Orders navigation item. Expected: both open `pages/orders.html` with the correct active navigation item.
- [ ] **ORD-03 (P0) — Multiple orders:** After two purchases, open Orders. Expected: both receipts, newest first, distinct order numbers, correct completed-order count; receipts initially collapsed.
- [ ] **ORD-04 (P1) — Expand/collapse:** Open and close each receipt individually with mouse and keyboard. Expected: details show/hide without changing saved data or the other receipt.
- [ ] **ORD-05 (P0) — Historical accuracy:** After a purchase, change product name, price or brand in Admin, or delete the product. Expected: the old receipt retains its original name, brand, price, quantity and total; later orders reflect current values.
- [ ] **ORD-06 (P0) — Persistence:** Refresh Orders, close the tab, reopen the same local URL in the same browser profile. Expected: all receipts persist; no duplicates. Normal storage settings are assumed.
- [ ] **ORD-07 (P0) — Cart separation:** While a new cart contains items, open Orders. Expected: only completed orders, no pending cart items; cart subtotal and historical totals remain independent.
- [ ] **ORD-08 (P1) — Multi-tab update:** Keep Orders open in tab A and make a purchase in tab B on the same origin. Expected: history and order count update in tab A through storage events.
- [ ] **ORD-09 (P1) — Many receipts:** Make several small purchases. Expected: newest-first history, readable cards, functional expand/collapse, no clipping or duplicate order numbers.
- [ ] **ORD-10 (P1) — Independent browser:** Open a separate browser profile or private window without copied storage. Expected: that environment does not inherit the normal profile's receipts, cart or local stock changes.

## 9. Admin — inventory and CRUD

- [ ] **ADM-01 (P0) — Initial inventory:** Open Admin after reset. Expected: inventory loads, electronics count matches Catalogue, and Locally created, Locally edited and Hidden products are all 0.
- [ ] **ADM-02 (P1) — Inventory search:** Search by product name, brand and displayed ID; test a nonexistent search. Expected: matching rows and a clear empty result, with correct counts and working search clearing.
- [ ] **ADM-03 (P0) — Create:** Create QA Test Phone with valid fields. Expected: success feedback, a unique local ID, Locally created increases, form returns to create mode, and the product is visible in Catalogue and Product Details.
- [ ] **ADM-04 (P1) — Optional image:** Create a product without Image URL and another with a valid HTTPS image URL. Expected: neutral placeholder for the first and supplied image for the second; verify Catalogue and Product Details.
- [ ] **ADM-05 (P1) — Unique local IDs:** Create two products, delete one and create another. Expected: unique IDs, no accidental replacement or duplicated rows.
- [ ] **ADM-06 (P0) — Required fields:** Submit an empty form and then omit each required field individually. Expected: validation prevents creation and identifies invalid input; inventory stays unchanged.
- [ ] **ADM-07 (P1) — Invalid text:** Try whitespace-only name, brand or description; attempt text longer than the field limits (name 120, brand 70, description 1,000 characters). Expected: invalid input is blocked or constrained; no invalid product saved.
- [ ] **ADM-08 (P0) — Price validation:** Try blank, zero, negative, more than two decimal places and above $1,000,000. Expected: invalid values rejected. Verify valid $0.01 and $19.99 values are accepted.
- [ ] **ADM-09 (P0) — Stock validation:** Try blank, negative, fractional and above 100,000. Expected: invalid values rejected. Stock 0 is valid and must display Out of stock.
- [ ] **ADM-10 (P1) — Image URL validation:** Try malformed URL and an unsupported protocol such as `javascript:` or `ftp:`. Expected: validation rejects the value without executing anything. Valid HTTP/HTTPS URLs are accepted.
- [ ] **ADM-11 (P0) — Edit API product:** Click Edit on an original product; update name, price and stock; save. Expected: populated edit form, successful save, changed values in Admin and shopping pages, Locally edited increases if this product had no existing override.
- [ ] **ADM-12 (P0) — Edit local product:** Change an Admin-created product's name, description, category and price. Expected: same local ID and correct updated details; Locally created count stays the same.
- [ ] **ADM-13 (P1) — Edit image:** Change a product's image URL. Expected: product card and detail gallery show the new image after reopening.
- [ ] **ADM-14 (P1) — Cancel edit:** Start editing, change fields and click Cancel without saving. Expected: original data remains; form returns to Create product mode.
- [ ] **ADM-15 (P0) — Cancel deletion:** Click Delete then cancel the confirmation. Expected: product, stock, cart, favorites and receipts remain unchanged.
- [ ] **ADM-16 (P0) — Delete API product:** Confirm deletion of an original product. Expected: product hidden locally; Hidden products increases; no longer available in Catalogue; existing cart/favorite references removed. Original API data remains unchanged.
- [ ] **ADM-17 (P0) — Delete local product:** Confirm deletion of a created product. Expected: it disappears from inventory and shopping pages, Locally created decreases, direct product URL no longer loads its details.
- [ ] **ADM-18 (P0) — Persistence:** Refresh Admin and shopping pages after create/edit/delete. Expected: all local changes persist, with no duplicate records.
- [ ] **ADM-19 (P1) — Busy state:** Throttle the network and submit an API create/edit/delete operation. Expected: controls disabled during the operation, suitable progress feedback, no duplicate submission, controls restored after completion.
- [ ] **ADM-20 (P1) — API operations:** In DevTools Network, inspect create/update/delete for original API products. Expected: POST to `/products/add`, PUT to `/products/{id}`, DELETE to `/products/{id}` as appropriate. Editing/deleting locally created products does not use nonexistent remote IDs.
- [ ] **ADM-21 (P1) — Stock and product counts:** Purchase multiple units from an API product and a local product. Expected: correct remaining stock per inventory row. Buying stock does not reduce the number of catalogue products; zero-stock products remain listed. An API stock deduction counts as a local edit.
- [ ] **ADM-22 (P1) — Inventory layout:** Scroll the inventory list and use Edit/Delete for rows near the bottom. Expected: rows and controls remain accessible; no horizontal clipping or unexpected panel movement.

## 10. Admin reset — complete lifecycle

Prepare before testing: create one product, edit an original product, delete another, complete at least two orders, retain a favorite, and add an unpurchased item to Cart. Keep Orders open in a second tab if possible. Record baseline stock and prices.

- [ ] **RESET-01 (P0) — Cancel reset:** Click Reset all local changes and cancel. Expected: all products, stock deductions, cart contents, favorites and saved receipts are unchanged.
- [ ] **RESET-02 (P0) — Confirm reset:** Click Reset all local changes and confirm. Expected: success feedback explicitly mentions cleared data and restored stock; no uncaught error.
- [ ] **RESET-03 (P0) — Original catalogue:** Verify created products disappear, edited names/prices/categories revert, deleted API products return and all original stock quantities are restored.
- [ ] **RESET-04 (P0) — Admin counters:** Verify Locally created, Locally edited and Hidden products return to zero and inventory count matches the original available API catalogue.
- [ ] **RESET-05 (P0) — Cart and favorites:** Open Cart and Favorites. Expected: both empty; badges hidden; Cart shows ordinary empty state rather than an old receipt or success confirmation.
- [ ] **RESET-06 (P0) — Order history:** Open and refresh Orders. Expected: 0 completed orders, no saved receipts, and an empty-history message. Latest order is no longer displayed in Cart.
- [ ] **RESET-07 (P1) — Other open tab:** Check the Orders page in the second tab after resetting. Expected: saved receipts disappear via storage events; navigation badges also update. Refresh other shopping pages if needed to reload their product data.
- [ ] **RESET-08 (P0) — Persistence of reset:** Close and reopen the same site and navigate to all relevant pages. Expected: cleared orders, cart and local changes do not reappear from cached API data.
- [ ] **RESET-09 (P1) — Reset again:** Confirm reset a second time. Expected: safe repeat operation; no unexpected errors or changes to the already restored catalogue.
- [ ] **RESET-10 (P0) — Shop again:** Add and purchase a restored API product after reset. Expected: fresh order history and normal stock deduction; the application remains fully functional.

## 11. Responsive layout and mobile navigation

Use Chrome DevTools device toolbar (F12, Ctrl+Shift+M). Recommended viewports: 1440×900 desktop, 1024×768 small desktop/tablet, 768×1024 tablet, 440×956 iPhone 16 Pro Max, 375×667 phone and 320×568 narrow phone. Test a real phone if available.

- [ ] **MOB-01 (P1) — All pages:** At every viewport, visit Home, Catalogue, Product Details, Favorites, Cart, Orders and Admin. Expected: no horizontal scrolling, cut-off text, overlapping controls or inaccessible content.
- [ ] **MOB-02 (P1) — Desktop header:** Above 780px, verify normal navigation is visible and hamburger is hidden. Check layout with all six navigation links and nonzero badges.
- [ ] **MOB-03 (P1) — Mobile header:** At 780px and below, verify logo and hamburger are visible, navigation initially closed. Click hamburger twice. Expected: menu opens and closes correctly with all six links.
- [ ] **MOB-04 (P1) — Menu navigation:** Open hamburger and select each link, including Orders and Admin. Expected: correct destination, menu closed after selection, active link correct.
- [ ] **MOB-05 (P1) — Escape:** Open hamburger with keyboard and press Escape while focus is within the header. Expected: menu closes and focus returns to toggle.
- [ ] **MOB-06 (P1) — Resize/orientation:** Resize across 780px and rotate a phone viewport with menu closed and open. Expected: usable header; no permanently hidden navigation or stranded overlay.
- [ ] **MOB-07 (P1) — Homepage:** Verify hero heading wraps naturally, action buttons fit, illustration moves below text, categories and banner remain readable.
- [ ] **MOB-08 (P1) — Catalogue and Favorites:** Check card grid, images, filter toolbar, hearts and add buttons; test search/filter on mobile. Expected: all actions reachable without clipping.
- [ ] **MOB-09 (P1) — Product Details:** Gallery, thumbnails, description, stock and buttons fit and can be operated by touch.
- [ ] **MOB-10 (P0) — Mobile checkout:** Complete a purchase on a phone viewport. Expected: cart quantity controls, Buy now, green confirmation, latest receipt and zero cart total all visible and usable.
- [ ] **MOB-11 (P1) — Mobile Orders:** Expand receipts with long product names and large totals. Expected: readable layout, no horizontal overflow; all details and links remain reachable.
- [ ] **MOB-12 (P1) — Mobile Admin:** Create/edit/delete a test product, scroll inventory and cancel reset. Expected: form and inventory stack as appropriate; buttons and input fields remain usable.
- [ ] **MOB-13 (P2) — Zoom:** Test browser zoom at 200% and narrow viewport. Expected: information remains readable and all essential functionality remains reachable.

## 12. Accessibility and no-JavaScript fallback

- [ ] **A11Y-01 (P1) — Keyboard navigation:** Use Tab/Shift+Tab through each page without a mouse. Expected: logical focus order, visible focus indication and no inaccessible interactive elements.
- [ ] **A11Y-02 (P1) — Skip link:** Press Tab at the beginning of the page, then Enter on Skip to main content. Expected: focus/navigation moves to main content.
- [ ] **A11Y-03 (P1) — Keyboard controls:** Activate links, buttons, heart toggles, hamburger, filters and order receipt summaries using appropriate keyboard keys. Expected: same behavior as mouse/touch.
- [ ] **A11Y-04 (P1) — Labels and state:** In DevTools Accessibility pane, inspect search/filters, Admin inputs, image arrows, favorites and quantity controls. Expected: meaningful names, labels and states such as `aria-pressed`, `aria-expanded` and `aria-current` where applicable.
- [ ] **A11Y-05 (P1) — Purchase focus:** Complete checkout with keyboard. Expected: focus moves to the confirmation; it is clearly announced if using a screen reader; no keyboard trap.
- [ ] **A11Y-06 (P1) — Cart removal focus:** Remove the focused cart item using keyboard. Expected: focus moves to a nearby control or appropriate status rather than being lost.
- [ ] **A11Y-07 (P1) — Contrast and content:** Check text, buttons, links, feedback and disabled states. Expected: clear readable contrast; errors, success and stock are communicated by text, not color alone. Check meaningful image alternatives.
- [ ] **A11Y-08 (P2) — Reduced motion:** Emulate `prefers-reduced-motion: reduce` in DevTools Rendering. Expected: nonessential CSS transitions are reduced and controls still function. Report any remaining problematic motion.
- [ ] **A11Y-09 (P1) — Fallback hidden:** With JavaScript enabled, check all pages. Expected: normal shared header only; no fallback links or raw `<nav>` markup displayed.
- [ ] **A11Y-10 (P1) — Disable JavaScript:** In Chrome DevTools press Ctrl+Shift+P, select Disable JavaScript and reload while DevTools remains open. Expected: fallback navigation is visible on every page, including Orders, and links work. Dynamic shopping features, JS-generated branding/footer and favicon are not guaranteed without JavaScript.
- [ ] **A11Y-11 (P1) — Re-enable JavaScript:** Use Ctrl+Shift+P → Enable JavaScript, then reload. Expected: normal navigation and shopping functionality return; no duplicate header or raw fallback markup.

## 13. API errors, browser storage and regression edge cases

Run destructive storage experiments only in a dedicated test profile. Restore the original online state afterwards.

- [ ] **ERR-01 (P1) — Slow connection:** Use DevTools Network throttling with a fresh page. Expected: loading text while requests are pending; usable layout; controls become available after success.
- [ ] **ERR-02 (P1) — Catalogue unavailable:** Block requests to `https://dummyjson.com/products*` in DevTools; remove the site's `technest-electronics-api-v1` SessionStorage cache or use a fresh tab/profile with no cache, then reload Catalogue. Expected: understandable load error; no infinite loading or falsely successful result.
- [ ] **ERR-03 (P2) — Partial API failure:** Block one category endpoint, clear the catalogue session cache, reload Catalogue. Expected: successful categories still appear; partial data is not cached as a complete catalogue. Remove the block and reload to recover all categories.
- [ ] **ERR-04 (P1) — Product unavailable:** Block an individual product-details request and visit its Details page. Expected: visible error, no purchase controls for missing details, navigation still works.
- [ ] **ERR-05 (P1) — Favorites partial failure:** Save multiple API products, block one product-details request and open Favorites. Expected: successfully loaded favorites still appear; feedback explains missing items; no silent loss of all saved favorites.
- [ ] **ERR-06 (P0) — Cart partial failure:** With two API products in Cart, block the details request for one, reload Cart. Expected: unavailable row is removable, badge includes its quantity, price excluded from subtotal, Buy now disabled. Remove unavailable row and verify remaining valid item can be purchased.
- [ ] **ERR-07 (P1) — Admin load failure and retry:** Block all product requests, clear session catalogue cache, open Admin. Expected: error and Retry button. Unblock requests and click Retry; inventory loads again.
- [ ] **ERR-08 (P0) — Admin write failure:** After Admin inventory loads, block relevant API create/update/delete request; attempt each action. Expected: clear failure feedback, no falsely successful local change or stuck busy state. Unblock and retry.
- [ ] **ERR-09 (P2) — Storage write failure:** If your browser/test setup can deny or exhaust LocalStorage, attempt checkout and a favorite/cart update. Expected: clear failure message; no false purchase confirmation, no partial stock/receipt change and no lost cart on a failed purchase. Mark Blocked if this cannot be reproduced safely.
- [ ] **ERR-10 (P2) — Corrupted cart/favorites data:** In a disposable profile, use DevTools Application → Local Storage to replace `technest-cart-v1` or `technest-favorites` with invalid JSON; reload. Expected: app handles unreadable data without an uncaught exception and presents safe empty data. Restore/reset afterwards.
- [ ] **ERR-11 (P1) — Cross-tab counters:** Open two tabs using the same URL origin. Add/remove cart items and favorites in one tab. Expected: navigation badges update in the other tab. Refresh shopping pages to verify full content and current stock; live rendering of every open shopping page is not required.
- [ ] **ERR-12 (P1) — Cached catalogue and local changes:** Load Catalogue twice within its five-minute session-cache period. Edit or purchase a product, then reopen Catalogue. Expected: cache may reduce API calls but current local overrides/stock are always applied. After Admin reset, old local changes must not return.
- [ ] **ERR-13 (P2) — Text safety:** Create a test product with a harmless literal string such as `<b>QA test</b>` in its name/description. Expected: text is displayed literally, not interpreted as markup, in Admin, shopping pages and receipts.
- [ ] **ERR-14 (P1) — Console and assets:** Browse all pages online with valid data. Expected: no uncaught JavaScript exceptions, missing local assets or unexpected failed module requests. Deliberately blocked network requests in failure tests may log expected errors.
- [ ] **ERR-15 (P2) — Near-simultaneous checkout:** In a disposable profile, open the same populated Cart in two tabs and attempt checkout nearly simultaneously. Expected: no duplicate receipt or overselling. Record any race condition as a defect; LocalStorage is not a transactional multi-user database.

## 14. Final release smoke test

After individual scenarios, restore network conditions and enable JavaScript. Run this entire journey once on desktop and once on mobile:

- [ ] **SMOKE-01 (P0):** Reset local changes → Home → Catalogue → search/filter → Product Details → save favorite → add product to Cart → adjust quantity → verify totals → Buy now → verify confirmation and expanded latest receipt → Orders → refresh → verify stock in Admin → confirm reset → verify Orders, Cart and Favorites empty and original stock restored.
- [ ] **SMOKE-02 (P1):** Open the project from a clean copy or deployed URL, if available. Verify relative paths, favicon, logo, navigation, API access and checkout work outside the original Live Server folder.
- [ ] **SMOKE-03 (P1):** Run the automated regression suite in the project root (`npm run check`). This supplements manual testing; record the actual test count and result, not an assumed pass. The latest Orders version previously reported 82 tests.

```bash
npm run check
```


