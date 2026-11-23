
"use strict";

// 1. Find the button in HTML.
const browseButton = document.querySelector("#browse-button");

// 2. Find the category section.
const categorySection = document.querySelector("#categories");

// 3. Listen for a click on the button.
browseButton.addEventListener("click", function () {

  // 4. Scroll to the category section.
  categorySection.scrollIntoView({
    behavior: "smooth"
  });

});