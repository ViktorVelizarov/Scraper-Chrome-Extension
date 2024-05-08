// index.ts

export {}; // Make the file a module

// Function to retrieve HTML content and log it to the console
function logHTMLContent() {
    // Get the HTML content of the current webpage
    const htmlContent = document.documentElement.outerHTML;

    // Log the HTML content to the console
    console.log(htmlContent);
}

// Execute the function when the DOM content is loaded
document.addEventListener('DOMContentLoaded', logHTMLContent);
