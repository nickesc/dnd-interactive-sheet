function importCharacter(event) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result);
            applyCharacterData(data);
        } catch (err) {
            console.error("Import failed: invalid JSON", err);
        }
        input.value = "";
    };
    reader.onerror = () => {
        console.error("Import failed: could not read file");
        input.value = "";
    };
    reader.readAsText(file);
}

function applyCharacterData(data) {
    if (!data || typeof data !== "object") {
        console.error("Import failed: invalid data");
        return;
    }

    document.querySelectorAll('input[type="text"][id]').forEach((input) => {
        if (Object.prototype.hasOwnProperty.call(data, input.id)) {
            const v = data[input.id];
            input.value = v == null ? "" : String(v);
        }
    });

    document.querySelectorAll(".radio-input-container").forEach((container) => {
        const row = container.closest(".radio-input.input-row");
        const groupId = container.id || row?.id;
        if (!groupId || !Object.prototype.hasOwnProperty.call(data, groupId)) return;
        applyRadioCount(container, data[groupId]);
    });

    document.querySelectorAll('input[type="range"][id]').forEach((input) => {
        if (Object.prototype.hasOwnProperty.call(data, input.id)) {
            input.value = String(data[input.id]);
        }
    });

    document.querySelectorAll('input[type="checkbox"][id]').forEach((input) => {
        if (Object.prototype.hasOwnProperty.call(data, input.id)) {
            input.checked = Boolean(data[input.id]);
        }
    });

    if (Array.isArray(data.palette)) {
        applyPalette(data.palette);
    }

    if (Array.isArray(data.images)) {
        applyGalleryImages(data.images);
    }

    if (typeof data.portrait === "string") {
        const portraitImg = document.querySelector("#portrait-palette-container .image-container img");
        if (portraitImg) portraitImg.src = data.portrait;
    }
}

function applyRadioCount(container, count) {
    const radios = [...container.querySelectorAll("input[type='radio']")];
    if (radios.length === 0) return;

    const n = Math.max(0, Math.floor(Number(count)) || 0);
    if (n === 0) {
        radios.forEach((r) => {
            r.checked = false;
        });
        return;
    }

    const clickedIndex = Math.min(n, radios.length) - 1;
    radios.forEach((radio, index) => {
        radio.checked = index <= clickedIndex;
    });
}

function applyPalette(colors) {
    const palette = document.getElementById("character-palette");
    if (!palette) return;

    let circles = palette.querySelectorAll(".character-palette-circle");
    while (circles.length > colors.length) {
        removeColor();
        circles = palette.querySelectorAll(".character-palette-circle");
    }
    while (circles.length < colors.length) {
        addColor();
        circles = palette.querySelectorAll(".character-palette-circle");
    }

    circles.forEach((circle, i) => {
        const hex = colors[i];
        if (typeof hex !== "string" || hex.trim() === "") return;
        const colorInput = circle.querySelector("input[type='color']");
        if (!colorInput) return;
        colorInput.value = hex;
        colorInput.dispatchEvent(new Event("change", {bubbles: true}));
    });
}

function applyGalleryImages(sources) {
    const root = document.getElementById("character-images");
    if (!root) return;

    const imgs = root.querySelectorAll(".image-container img");
    imgs.forEach((img, i) => {
        img.src = typeof sources[i] === "string" ? sources[i] : "img/placeholder.svg";
    });
}

function exportCharacter() {
    const character = extractCharacterData();
    console.log(character);
    const json = JSON.stringify(character, null, 2);
    const blob = new Blob([json], {type: "application/json;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const rawName = typeof character["character-name"] === "string" ? character["character-name"].trim() : "";
    const stem =
        rawName
            .replace(/[/\\?%*:|"<>]/g, "")
            .replace(/\s+/g, "-")
            .slice(0, 120) || "character";
    link.download = `${stem}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function extractCharacterData() {
    const data = {};

    document.querySelectorAll('input[type="text"][id]').forEach((input) => {
        data[input.id] = input.value;
    });

    document.querySelectorAll(".radio-input-container").forEach((container) => {
        const row = container.closest(".radio-input.input-row");
        const groupId = container.id || row?.id;
        if (!groupId) return;
        data[groupId] = container.querySelectorAll("input[type='radio']:checked").length;
    });

    document.querySelectorAll('input[type="range"][id]').forEach((input) => {
        data[input.id] = input.value;
    });

    document.querySelectorAll('input[type="checkbox"][id]').forEach((input) => {
        data[input.id] = input.checked;
    });

    data.palette = getPalette();

    data.images = getImages();

    data.portrait = getPortrait();

    return data;
}

function getPalette() {
    const palette = document.getElementById("character-palette");
    if (!palette) return [];
    return Array.from(palette.querySelectorAll(".character-palette-circle")).map((circle) => {
        const input = circle.querySelector("input[type='color']");
        if (!input) return "";
        const bgComputed = getComputedStyle(circle).backgroundColor;
        if (paletteCircleBackgroundMatchesPicker(bgComputed, input.value)) {
            return input.value;
        }
        return "";
    });
}

function resolveBackgroundColor(cssColor) {
    const el = document.createElement("div");
    el.style.cssText =
        "position:absolute;left:-9999px;top:0;visibility:hidden;background-color:" +
        String(cssColor).replace(/;/g, "") +
        ";";
    document.body.appendChild(el);
    const rgb = getComputedStyle(el).backgroundColor;
    el.remove();
    return rgb;
}

function paletteCircleBackgroundMatchesPicker(computedBackground, pickerValue) {
    return resolveBackgroundColor(computedBackground) === resolveBackgroundColor(pickerValue);
}

function getPortrait() {
    const portrait = document.getElementById("portrait-palette-container");
    if (!portrait) return [];
    return portrait.querySelector(".image-container img").src;
}

function getImages() {
    const images = document.getElementById("character-images");
    if (!images) return [];
    return Array.from(images.querySelectorAll(".image-container img")).map((img) => img.src);
}
