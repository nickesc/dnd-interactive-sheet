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

function exportCharacter() {
    const character = extractCharacterData();
    const json = JSON.stringify(character, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
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
    return Array.from(palette.querySelectorAll(".character-palette-circle input[type='color']")).map((input) => input.value);
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
