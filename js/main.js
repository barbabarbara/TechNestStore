
// 1. Select the button from the HTML.
const informationButton = document.querySelector(
  "#information-button",
);

// 2. Select the paragraph containing store information.
const storeInformation = document.querySelector(
  "#store-information",
);

// 3. Listen for a click on the button, and run a function when it happens.
informationButton.addEventListener("click", () => {
  // 4. Find out whether the information is visible.
  const isExpanded =
    informationButton.getAttribute("aria-expanded") === "true";

  // 5. Reverse the current state, so if it was true, it becomes false, and vice versa.
  const newState = !isExpanded;

  // 6. Update the accessibility attribute, so screen readers know whether the information is visible.
  informationButton.setAttribute(
    "aria-expanded",
    String(newState),
  );

  // 7. Show or hide the paragraph, depending on the new state.
  storeInformation.hidden = !newState;

  // 8. Change the button text.
  informationButton.textContent = newState
    ? "Hide store information"
    : "Show store information";
});
