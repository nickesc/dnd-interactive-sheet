function setRadioContainer(radioInputContainer, clickedIndex) {
    const radioInputs = [...radioInputContainer.querySelectorAll("input[type='radio']")];
    if (clickedIndex < 0 || clickedIndex >= radioInputs.length) return;

    // Second click on the lone filled dot clears the row (like un-setting a 1-star rating).
    const onlyFirstSelected = radioInputs[0]?.checked && radioInputs.slice(1).every((r) => !r.checked);
    if (clickedIndex === 0 && onlyFirstSelected) {
        radioInputs.forEach((radioInput) => {
            radioInput.checked = false;
        });
        return;
    }

    radioInputs.forEach((radioInput, index) => {
        radioInput.checked = index <= clickedIndex;
    });
}

const radioInputContainers = document.querySelectorAll(".radio-input-container");
radioInputContainers.forEach((radioInputContainer) => {
    const radioInputs = radioInputContainer.querySelectorAll("input[type='radio']");
    radioInputs.forEach((radio, clickedIndex) => {
        radio.addEventListener("pointerdown", (event) => {
            event.preventDefault();
            setRadioContainer(radioInputContainer, clickedIndex);
        });

        radio.addEventListener("click", (event) => {
            event.preventDefault();
        });
    });
});
