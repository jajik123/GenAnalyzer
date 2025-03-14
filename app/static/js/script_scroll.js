// Function that smoothly scrolls the page to the specified section.

function scrollToSection(sectionId) {
    // Get the section element by its ID, if it exists, scroll 
    let section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: "start" });
    }
}

