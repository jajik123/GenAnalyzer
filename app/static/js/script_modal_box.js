// This function Attaches event listeners to question buttons, modal close buttons, and the window to handle modal opening and closing.

function applyEventListeners() {
    var questionButtons = document.querySelectorAll(".question");
    var modals = document.querySelectorAll(".answer");
    var closeButtons = document.querySelectorAll(".close");

    // Add onclick event to each question button to open the corresponding modal
    questionButtons.forEach((btn, index) => {
        btn.addEventListener("click", function () {
            modals[index].style.display = "block";
        });
    });

    // mMake the close buttons close the corresponding modal box
    closeButtons.forEach((btn, index) => {
        btn.addEventListener("click", function () {
            modals[index].style.display = "none";
        });
    });

    // Close the modal when clicking outside of it
    window.onclick = function (event) {
        modals.forEach((modal) => {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        });
    };

}

// run the function when the script loads
applyEventListeners();

