// Import the shared layout function.
import { initLayout } from "./ui.js";

// Create the header and footer.
initLayout();

// Find the homepage information button.
const informationButton = document.querySelector("#information-button");

// Find the paragraph controlled by the button.
const storeInformation = document.querySelector("#store-information");

// Only register the listener if both elements exist.
if (informationButton && storeInformation) {
  informationButton.addEventListener("click", () => {
    // Read the current expanded state.
    const isExpanded =
      informationButton.getAttribute("aria-expanded") === "true";

    // Toggle the state.
    const newState = !isExpanded;

    // Update the accessibility information.
    informationButton.setAttribute("aria-expanded", String(newState));

    // Toggle paragraph visibility.
    storeInformation.hidden = !newState;

    // Update the button label.
    // Update the button label.
    informationButton.textContent = newState
      ? "Close information"
      : "About TechNest";
  });
}
