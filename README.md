# TechNest

**A modern electronics store built with HTML, CSS and vanilla JavaScript.**

TechNest is a responsive e-commerce website developed as a group project. It provides a complete simulated shopping experience, from discovering products to placing orders, receiving receipts and managing inventory.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Node.js tests](https://img.shields.io/badge/Tests-Node.js-339933?logo=nodedotjs&logoColor=white)

## Features

| Feature | Description |
| --- | --- |
| Product catalogue | Browse electronics, search, filter by category and sort products. |
| Product details | View product information, image galleries, prices and stock availability. |
| Favorites | Save and remove favorite products. |
| Shopping cart | Manage quantities and calculate the total purchase amount. |
| Simulated checkout | Complete a purchase, receive a confirmation and reset the cart. |
| Order history | View the latest receipt in the cart and previous purchases on the Orders page. |
| Inventory management | Automatically deduct purchased quantities from local stock. |
| Administration | Create, read, update and delete products; restore the original store data. |
| Responsive design | Navigate on desktop, tablet and mobile using a shared, accessible navigation layout. |

## Getting started

1. Clone or download the repository.
2. Open the project folder in Visual Studio Code.
3. Start a local web server, such as Live Server, from `index.html`.
4. Open the website in your browser.

No frontend framework, build step or npm package installation is required. An internet connection is needed to retrieve product data from DummyJSON. Use a local web server rather than opening HTML files through `file://`, as the project uses JavaScript ES modules.

## Project tasks

- [Assignment requirements](docs/ASSIGNMENT.md)

## Testing

- [Manual testing checklist](MANUAL_TESTS.md) — functional, responsive, accessibility and edge-case scenarios.
- [Automated test files](tests/) — tests for application logic, storage, API integration and user interactions.

With a recent version of Node.js installed, run the following commands from the project root:

```bash
# Run all automated tests
npm test

# Run JavaScript syntax checks and automated tests
npm run check
```

## Data and simulation

TechNest retrieves product data from DummyJSON and uses browser storage to preserve local changes, favorites, cart contents, completed orders and inventory updates. The Admin reset restores the original product data and clears the saved shopping data and order history.

All purchases and API write operations are simulated. No real payments are processed, and no payment details are collected. Inventory and order history are local to the browser and are not shared across customers or devices.

---

**TechNest** · Educational group project · Built with vanilla JavaScript
