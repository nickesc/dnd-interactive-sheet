async function saveToImage() {
    const el = document.querySelector("main");
    const snap = getSnapdom();
    if (!el || !snap) {
        console.error("Save to image failed: SnapDOM is not loaded.");
        return;
    }

    const contentWidth = 815;
    const sidePadding = 24;
    const topPadding = 18;
    const exportScale = Math.max(4, window.devicePixelRatio || 1);
    const bgColor = colorToRgb(getComputedStyle(document.body).backgroundColor) || "#ffffff";
    const exportEl = createSnapdomExportElement(el, {
        contentWidth,
        sidePadding,
        topPadding,
        backgroundColor: bgColor,
    });

    try {
        const result = await snap(exportEl, {
            scale: exportScale,
            dpr: 1,
            embedFonts: true,
            backgroundColor: bgColor,
        });
        await result.download({format: "png", filename: "character.png"});
    } catch (error) {
        console.error("Save to image failed:", error);
    } finally {
        exportEl.remove();
    }
}

function getSnapdom() {
    if (typeof window.snapdom === "function") return window.snapdom;
    if (typeof window.snapdom?.snapdom === "function") return window.snapdom.snapdom;
    return null;
}

function createSnapdomExportElement(source, {contentWidth, sidePadding, topPadding, backgroundColor}) {
    const wrapper = document.createElement("div");
    const clone = source.cloneNode(true);
    const exportWidth = contentWidth + sidePadding * 2;

    syncFormControlState(source, clone);
    syncImageState(source, clone);

    wrapper.style.position = "fixed";
    wrapper.style.left = "-10000px";
    wrapper.style.top = "0";
    wrapper.style.boxSizing = "border-box";
    wrapper.style.width = `${exportWidth}px`;
    wrapper.style.padding = `${topPadding}px ${sidePadding}px 0`;
    wrapper.style.backgroundColor = backgroundColor;
    wrapper.style.pointerEvents = "none";
    wrapper.style.container = "page / inline-size";
    wrapper.setAttribute("data-exporting-image", "true");

    clone.style.width = `${contentWidth}px`;
    clone.style.maxWidth = `${contentWidth}px`;
    clone.style.marginLeft = "auto";
    clone.style.marginRight = "auto";

    wrapper.append(clone);
    document.body.append(wrapper);
    replaceRangeInputsForExport(clone);
    return wrapper;
}

function syncFormControlState(source, clone) {
    const sourceControls = source.querySelectorAll("input, textarea, select");
    const cloneControls = clone.querySelectorAll("input, textarea, select");

    sourceControls.forEach((sourceControl, index) => {
        const cloneControl = cloneControls[index];
        if (!cloneControl) return;

        if (sourceControl instanceof HTMLInputElement) {
            cloneControl.checked = sourceControl.checked;
            cloneControl.value = sourceControl.value;
            cloneControl.placeholder = "";
            cloneControl.removeAttribute("placeholder");
        } else if (sourceControl instanceof HTMLTextAreaElement) {
            cloneControl.value = sourceControl.value;
            cloneControl.placeholder = "";
            cloneControl.removeAttribute("placeholder");
        } else if (sourceControl instanceof HTMLSelectElement) {
            cloneControl.selectedIndex = sourceControl.selectedIndex;
        }
    });
}

function syncImageState(source, clone) {
    const sourceImages = source.querySelectorAll("img");
    const cloneImages = clone.querySelectorAll("img");

    sourceImages.forEach((sourceImage, index) => {
        const cloneImage = cloneImages[index];
        const src = sourceImage.currentSrc || sourceImage.src;
        if (!cloneImage || !src) return;

        cloneImage.src = src;
        cloneImage.setAttribute("src", src);
    });
}

function replaceRangeInputsForExport(root) {
    root.querySelectorAll('input[type="range"]').forEach((input) => {
        const doc = input.ownerDocument;
        const style = doc.defaultView.getComputedStyle(input);
        const lineColor = getCssVariable(doc, "--line-color", style.color);
        const fillColor = getCssVariable(doc, "--fill-color", style.color);
        const inputBorder = getCssVariable(doc, "--input-border-style", "2px solid currentColor");
        const trackHeight = getCssVariable(doc, "--range-track-height", "3px");
        const trackRadius = getCssVariable(doc, "--corners", "10px");
        const thumbSize = getCssVariable(doc, "--range-thumb-size", "16px");
        const thumbRadius = getCssVariable(doc, "--input-border-radius", "3px");
        const wrapper = doc.createElement("span");
        const track = doc.createElement("span");
        const thumb = doc.createElement("span");
        const min = Number(input.min || 0);
        const max = Number(input.max || 100);
        const value = Number(input.value || (max - min) / 2);
        const percent = max === min ? 0 : ((value - min) / (max - min)) * 100;

        wrapper.setAttribute("aria-hidden", "true");
        wrapper.style.position = "relative";
        wrapper.style.display = "block";
        wrapper.style.boxSizing = "border-box";
        wrapper.style.flex = style.flex || "1 1 auto";
        wrapper.style.minWidth = style.minWidth;
        wrapper.style.width = style.width;
        wrapper.style.height = thumbSize;
        wrapper.style.margin = style.margin;
        wrapper.style.alignSelf = style.alignSelf;

        track.style.position = "absolute";
        track.style.left = "0";
        track.style.right = "0";
        track.style.top = "50%";
        track.style.height = trackHeight;
        track.style.background = lineColor;
        track.style.borderRadius = trackRadius;
        track.style.transform = "translateY(-50%)";

        thumb.style.position = "absolute";
        thumb.style.left = `${Math.max(0, Math.min(100, percent))}%`;
        thumb.style.top = "50%";
        thumb.style.width = thumbSize;
        thumb.style.height = thumbSize;
        thumb.style.boxSizing = "border-box";
        thumb.style.background = fillColor;
        thumb.style.border = inputBorder;
        thumb.style.borderRadius = thumbRadius;
        thumb.style.transform = "translate(-50%, -50%) rotate(45deg)";

        wrapper.append(track, thumb);
        input.replaceWith(wrapper);
    });
}

function getCssVariable(doc, name, fallback) {
    return doc.defaultView.getComputedStyle(doc.documentElement).getPropertyValue(name).trim() || fallback;
}

function resolveColorMixVariables(clonedDocument) {
    const cssVars = [
        "--background-color",
        "--line-color",
        "--accent-color",
        "--accent-color-dark",
        "--accent-color-hover",
        "--accent-color-dark-hover",
        "--accent-color-visited",
        "--accent-color-dark-visited",
        "--accent-color-active",
        "--accent-color-dark-active",
        "--fill-color",
        "--fill-color-hover",
    ];

    const resolved = {};
    cssVars.forEach((name) => {
        resolved[name] = resolveColorVariable(name);
    });

    clonedDocument.querySelectorAll("[style]").forEach((el) => {
        const raw = el.getAttribute("style") || "";
        if (!/color-mix|color\(|oklab\(/.test(raw)) return;
        const cleaned = raw
            .split(";")
            .filter((decl) => !/color-mix|color\(|oklab\(/.test(decl))
            .join(";");
        el.setAttribute("style", cleaned);
    });

    const root = clonedDocument.documentElement;
    cssVars.forEach((name) => {
        if (resolved[name]) {
            root.style.setProperty(name, resolved[name]);
        }
    });

    console.log("[save-debug] resolved CSS vars:", resolved);
    console.log("[save-debug] final <html> style:", root.getAttribute("style"));
}

function resolveColorVariable(varName) {
    const probe = document.createElement("div");
    probe.style.cssText = "position:absolute;left:-9999px;top:0;visibility:hidden;";
    probe.style.color = `var(${varName})`;
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe).color;
    probe.remove();
    return colorToRgb(computed);
}

function colorToRgb(colorStr) {
    if (!colorStr || colorStr === "transparent") return colorStr;
    if (/^rgb[a]?\(/.test(colorStr) && !/color-mix|color\(|oklab\(/.test(colorStr)) return colorStr;
    if (/^#[0-9a-f]{3,8}$/i.test(colorStr)) return colorStr;

    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = colorStr;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    if (a < 255) return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
    return `rgb(${r}, ${g}, ${b})`;
}
