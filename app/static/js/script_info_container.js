// This file contains a function that ensures the element with the class "info" is displayed

document.querySelectorAll('.info-container').forEach(container => {
    const info = container.querySelector('.info');

    // Show when the mouse enters the element with class "info-container"
    container.addEventListener('mouseenter', () => {
        info.style.display = 'block';
    });

    // Hide when the mouse leaves the container
    container.addEventListener('mouseleave', () => {
        info.style.display = 'none';
    });
});