# Assignment – Build an E-commerce Website with HTML, CSS and JavaScript

*English translation of the original Swedish assignment. The original Swedish version follows below.*

## 1. Assignment description

In this assignment, you will develop a functional e-commerce website using **HTML, CSS and JavaScript**.

The website must allow users to browse products, search, filter, sort, manage favorites, add products to a shopping cart and complete a simulated purchase.

You must retrieve product information from an external API and implement CRUD functionality for products.

The focus is on JavaScript, API handling, DOM manipulation, usability, responsive design and accessibility.

## 2. Technologies and tools

The following technologies must be used:

- **HTML5** – for the website's structure.
- **CSS3** – for design, layout and responsiveness.
- **JavaScript (Vanilla JS)** – for functionality and interactivity.
- **Fetch API** – for communication with the API.
- **LocalStorage or SessionStorage** – for storing information in the browser.
- **Git and GitHub** – for version control and submission.

You must use the following API:

[https://dummyjson.com/docs/products](https://dummyjson.com/docs/products)

## 3. Website page requirements

The website must contain **at least four different pages or views**, with working navigation between them.

Examples of pages:

### Home page

- Introduce the website and its purpose.
- Display featured products from the API.
- Provide a clear link to the product catalog.

### Product catalog

- Display products retrieved from the API.
- Display product images, names, prices and other relevant information.
- Implement searching, filtering and sorting.
- Allow users to add products to the shopping cart and favorites list.
- Provide links to the corresponding product detail pages.

### Product details

- Display information about a selected product.
- Display the product image, name, description, price and category.
- Allow users to add the product to the shopping cart and favorites list.

### Favorites

- Display products that users have marked as favorites.
- Allow users to remove products from the favorites list.
- Display a clear message when the favorites list is empty.

### Shopping cart and checkout

- Display products that users have added to the shopping cart.
- Display quantities, prices and the total amount.
- Allow users to change quantities or remove products.
- Provide a button to complete a simulated purchase.
- Display a clear confirmation message when the purchase has been completed.

You are welcome to create additional pages and features.

## 4. Functional requirements

### 4.1 API and CRUD

All products must be retrieved from the DummyJSON Products API.

You must implement the following CRUD operations:

- **Create:** Add a new product through the API.
- **Read:** Retrieve and display products from the API.
- **Update:** Update information about an existing product through the API.
- **Delete:** Remove a product through the API.

A user interface must be provided for performing these operations, for example through forms and buttons.

**Important:** DummyJSON is a test API. Create, Update and Delete operations are simulated by the API and are not permanently stored on the server. You must be able to demonstrate that the API requests work and handle the responses correctly in the user interface.

### 4.2 Searching, filtering and sorting

Users must be able to:

- Search for products by name.
- Filter products by category.
- Sort products by price in both ascending and descending order.

These features must work together. For example, users must be able to search for a product within a selected category and then sort the results by price.

If no products match the search or filter criteria, a clear message must be displayed.

### 4.3 Favorites list

- Users must be able to add products to their favorites.
- Favorites must be displayed on a separate page.
- Users must be able to remove favorites.
- The favorites list must be saved using LocalStorage or SessionStorage.

### 4.4 Shopping cart and payment

- Users must be able to add products to the shopping cart.
- The same product must be able to be added multiple times.
- Users must be able to change product quantities.
- Users must be able to remove products.
- The total amount must be calculated automatically.
- The shopping cart must be displayed at checkout.

**Simulated payment:**

When the user clicks the "Buy" button, a purchase must be simulated.

After a successful purchase:

1. A clear confirmation message must be displayed on the page, for example, "Thank you for your purchase! Your order has been completed."
2. The shopping cart must be emptied.
3. The total amount must be reset.

No real payment service needs to be integrated, and no real payment information must be collected.

### 4.5 Loading states and error handling

**All Fetch API requests must have a loading state.**

This means that users must receive visual feedback while an API request is in progress.

Examples:

- Display a spinner or the text "Loading products..."
- Display "Saving product..." during Create or Update operations.
- Display "Deleting product..." during Delete operations.
- Hide the loading indicator when the request has completed.
- Display a clear, understandable error message if the API request fails.

Users should not have to wonder whether the website is working or has stopped functioning.

### 4.6 LocalStorage or SessionStorage

You must use at least one of the following:

- `localStorage`
- `sessionStorage`

These can be used, for example, for the favorites list, shopping cart or other user preferences.

You must be able to explain what information you store and why.

### 4.7 setTimeout or setInterval

You must use at least one of the following JavaScript functions:

- `setTimeout()`
- `setInterval()`

The function must serve a clear purpose.

Examples:

- Display a confirmation message that disappears after a few seconds.
- Create an automatic image carousel.
- Implement a timer.

You must be able to explain how and why the function is used.

## 5. Design, navigation and responsiveness

The website must have a well-planned, consistent and user-friendly design.

### Header and navigation

- A clear header displaying the website's name or logo.
- Navigation between all pages.
- A working mobile menu (hamburger menu).
- Clear indicators or feedback for navigation and interactive elements.

### Responsive design

The website must work on:

- Mobile phones
- Tablets
- Computers

The layout must adapt to the screen size, and no important functionality may be lost on smaller screens.

### Accessibility and WCAG

The website must follow relevant accessibility principles in accordance with WCAG 2.2 Level AA.

## 6. Code quality and structure

Your code must be clear, organized and easy to understand.

The following are expected:

- Semantic HTML.
- Structured CSS.
- JavaScript organized into reusable functions.
- Clear variable and function names.
- Avoid unnecessary code duplication.
- Use `async/await` or Promises for API requests.
- Handle errors using, for example, `try/catch`.
- Avoid JavaScript errors in the browser console.

---


# Inlämningsuppgift – Bygg en E-commerce med HTML, CSS och JavaScript

## 1. Uppgiftsbeskrivning

I den här uppgiften ska ni utveckla en fungerande E-commerce-webbplats (e-handel) med hjälp av **HTML, CSS och JavaScript**.

Webbplatsen ska låta användaren bläddra bland produkter, söka, filtrera, sortera, hantera favoriter, lägga produkter i en varukorg och genomföra ett simulerat köp.

Ni ska hämta produktinformation från ett externt API och implementera CRUD-funktionalitet för produkterna.

Fokus ligger på JavaScript, API-hantering, DOM-manipulation, användarvänlighet, responsiv design och tillgänglighet.

## 2. Tekniker och verktyg

Följande tekniker ska användas:

- **HTML5** – för webbplatsens struktur.
- **CSS3** – för design, layout och responsivitet.
- **JavaScript (Vanilla JS)** – för funktionalitet och interaktivitet.
- **Fetch API** – för kommunikation med API.
- **LocalStorage eller SessionStorage** – för att lagra information i webbläsaren.
- **Git och GitHub** – för versionshantering och inlämning.

Ni ska använda följande API:

[https://dummyjson.com/docs/products](https://dummyjson.com/docs/products)

## 3. Krav på webbplatsens sidor

Webbplatsen ska innehålla **minst fyra olika sidor eller vyer** med fungerande navigation mellan dem.

Exempel på sidor:

### Startsida

- Presentera webbplatsen och dess syfte.
- Visa utvalda produkter från API.
- Ha en tydlig länk till produktkatalogen.

### Produktkatalog

- Visa produkter som hämtas från API.
- Visa produktbild, namn, pris och annan relevant information.
- Implementera sökning, filtrering och sortering.
- Ge användaren möjlighet att lägga till produkter i varukorgen och favoritlistan.
- Länka vidare till respektive produkts detaljsida.

### Produktdetaljer

- Visa information om en vald produkt.
- Visa produktbild, namn, beskrivning, pris och kategori.
- Ge användaren möjlighet att lägga till produkten i varukorgen och favoritlistan.

### Favoriter

- Visa produkter som användaren har markerat som favoriter.
- Ge möjlighet att ta bort produkter från favoritlistan.
- Visa ett tydligt meddelande om favoritlistan är tom.

### Varukorg och kassa

- Visa produkter som användaren har lagt till i varukorgen.
- Visa antal, pris och totalbelopp.
- Ge möjlighet att ändra antal eller ta bort produkter.
- Ha en knapp för att genomföra ett simulerat köp.
- Visa ett tydligt bekräftelsemeddelande när köpet har genomförts.

Ni får gärna skapa fler sidor och funktioner.

## 4. Funktionella krav

### 4.1 API och CRUD

Alla produkter ska hämtas från DummyJSON Products API.

Ni ska implementera följande CRUD-operationer:

- **Create:** Lägg till en ny produkt via API.
- **Read:** Hämta och visa produkter från API.
- **Update:** Uppdatera information om en befintlig produkt via API.
- **Delete:** Ta bort en produkt via API.

Det ska finnas ett användargränssnitt där dessa operationer kan utföras, exempelvis via formulär och knappar.

**Viktigt:** DummyJSON är ett test-API. Create, Update och Delete simuleras av API och sparas inte permanent på servern. Ni ska kunna visa att API-anropen fungerar och hantera svaren korrekt i gränssnittet.

### 4.2 Sökning, filtrering och sortering

Användaren ska kunna:

- Söka efter produkter baserat på namn.
- Filtrera produkter efter kategori.
- Sortera produkter efter pris, både stigande och fallande.

Funktionerna ska fungera tillsammans. Exempelvis ska användaren kunna söka efter en produkt inom en vald kategori och sedan sortera resultaten efter pris.

Om inga produkter matchar sökningen eller filtreringen ska ett tydligt meddelande visas.

### 4.3 Favoritlista

- Användaren ska kunna lägga till produkter som favoriter.
- Favoriterna ska visas på en separat sida.
- Användaren ska kunna ta bort favoriter.
- Favoritlistan ska sparas med LocalStorage eller SessionStorage.

### 4.4 Varukorg och betalning

- Användaren ska kunna lägga till produkter i varukorgen.
- Samma produkt ska kunna läggas till flera gånger.
- Användaren ska kunna ändra antalet produkter.
- Användaren ska kunna ta bort produkter.
- Totalbeloppet ska beräknas automatiskt.
- Varukorgen ska visas i kassan.

**Simulerad betalning:**

När användaren klickar på knappen "Köp" ska ett köp simuleras.

Efter ett lyckat köp ska:

1. Ett tydligt bekräftelsemeddelande visas på sidan, exempelvis "Tack för ditt köp! Din beställning har genomförts."
2. Varukorgen tömmas.
3. Totalbeloppet återställas.

Ingen riktig betalningstjänst behöver integreras och inga riktiga betalningsuppgifter ska samlas in.

### 4.5 Loading States och felhantering

**Alla Fetch API-anrop ska ha en loading state.**

Det innebär att användaren ska få visuell återkoppling medan ett API-anrop pågår.

Exempel:

- Visa en spinner eller texten "Laddar produkter..."
- Visa "Sparar produkt..." vid Create eller Update.
- Visa "Tar bort produkt..." vid Delete.
- Dölj loading-indikatorn när anropet är klart.
- Visa ett begripligt felmeddelande om API-anropet misslyckas.

Användaren ska inte behöva undra om webbplatsen arbetar eller har slutat fungera.

### 4.6 LocalStorage eller SessionStorage

Ni måste använda minst en av följande:

- `localStorage`
- `sessionStorage`

Det kan exempelvis användas för favoritlistan, varukorgen eller andra användarinställningar.

Ni ska kunna förklara vilken information ni lagrar och varför.

### 4.7 setTimeout eller setInterval

Ni ska använda minst en av följande JavaScript-funktioner:

- `setTimeout()`
- `setInterval()`

Funktionen ska ha ett tydligt syfte.

Exempel:

- Visa ett bekräftelsemeddelande som försvinner efter några sekunder.
- Skapa en automatisk bildkarusell.
- Implementera en timer.

Ni ska kunna förklara hur och varför funktionen används.

## 5. Design, navigation och responsivitet

Webbplatsen ska ha en genomtänkt, enhetlig och användarvänlig design.

### Header och navigation

- En tydlig header med webbplatsens namn eller logotyp.
- Navigation mellan samtliga sidor.
- En fungerande mobilmeny (hamburgermeny).
- Tydlig markering eller återkoppling för navigation och interaktiva element.

### Responsiv design

Webbplatsen ska fungera på:

- Mobiltelefon
- Surfplatta
- Dator

Layouten ska anpassas efter skärmstorleken och inga viktiga funktioner får försvinna på mindre skärmar.

### Tillgänglighet och WCAG

Webbplatsen ska följa relevanta tillgänglighetsprinciper enligt WCAG 2.2 nivå AA.

## 6. Kodkvalitet och struktur

Er kod ska vara tydlig, organiserad och lätt att förstå.

Följande förväntas:

- Semantisk HTML.
- Strukturerad CSS.
- JavaScript uppdelad i återanvändbara funktioner.
- Tydliga variabel- och funktionsnamn.
- Undvik onödig duplicering av kod.
- Använd `async/await` eller Promises vid API-anrop.
- Hantera fel med exempelvis `try/catch`.
- Undvik JavaScript-fel i webbläsarens konsol.
