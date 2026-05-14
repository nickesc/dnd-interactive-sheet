function updateImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    const container = event.target.closest(".image-container");
    const img = container?.querySelector("img");
    if (!img) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function updatePaletteColor(event) {
    const color = event.target.value;
    const container = event.target.closest(".character-palette-circle");

    const index = Array.from(container.parentElement.children).indexOf(container);

    if (index === 1) {
        document.documentElement.style.setProperty("--fill-color", color);
    } else if (index === 2) {
        const lineColor = `color-mix(in srgb, ${color} 75%, black)`;
        document.documentElement.style.setProperty("--line-color", lineColor);
        const accentColor = `color-mix(in srgb, ${color} 50%, black)`;
        document.documentElement.style.setProperty("--accent-color", accentColor);
    } else if (index === 3) {
        const bgColor = `color-mix(in srgb, ${color} 25%, white)`;
        document.documentElement.style.setProperty("--background-color", bgColor);
    }

    // update the background color of the palette circle
    if (container) container.style.backgroundColor = color;
}

function addColor() {
    const paletteCircleElementTemplate = `
        <div class="character-palette-circle clickable" onclick="this.querySelector('input[type=color]').click()">
            <input class="hidden-input" type="color" onchange="updatePaletteColor(event)" />
        </div>
    `;
    const palette = document.getElementById("character-palette");
    const addButton = document.getElementById("add-color-button");
    palette.insertBefore(document.createRange().createContextualFragment(paletteCircleElementTemplate), addButton);
}

function removeColor() {
    const addButton = document.getElementById("add-color-button");
    const lastColor = addButton?.previousElementSibling;
    if (lastColor && lastColor.classList.contains("character-palette-circle")) {
        lastColor.remove();
    }
}
