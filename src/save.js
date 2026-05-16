function saveToImage() {
    const container = document.querySelector("main");
    if (!container || typeof html2canvas === "undefined") return;
    const contentWidth = 815;
    const sidePadding = 24;
    const exportWidth = contentWidth + sidePadding * 2;
    const exportScale = Math.max(4, window.devicePixelRatio || 1);

    const rawName = document.getElementById("character-name")?.value?.trim() || "";
    const stem =
        rawName
            .replace(/[/\\?%*:|"<>]/g, "")
            .replace(/\s+/g, "-")
            .slice(0, 120) || "character";

    const bgColor = colorToRgb(getComputedStyle(document.body).backgroundColor) || "#ffffff";

    html2canvas(container, {
        backgroundColor: bgColor,
        onclone: (clonedDocument) => prepareCloneForImage(clonedDocument, contentWidth, exportWidth),
        useCORS: true,
        scale: exportScale,
        width: exportWidth,
        windowWidth: exportWidth,
    })
        .then((canvas) => {
            if (!canvas) {
                throw new Error("Could not render canvas");
            }

            return new Promise((resolve, reject) => {
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error("Could not convert canvas to blob"));
                    }
                }, "image/png");
            });
        })
        .then((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${stem}.png`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        })
        .catch((error) => {
            console.error("Save to image failed:", error);
        });
}

function prepareCloneForImage(clonedDocument, contentWidth, exportWidth) {
    resolveColorMixVariables(clonedDocument);

    const clonedMain = clonedDocument.querySelector("main");
    if (clonedMain) {
        clonedMain.style.width = `${exportWidth}px`;
        clonedMain.style.maxWidth = `${exportWidth}px`;
        clonedMain.style.marginLeft = "auto";
        clonedMain.style.marginRight = "auto";
        clonedMain.style.paddingTop = "18px";

        Array.from(clonedMain.children).forEach((child) => {
            child.style.width = `${contentWidth}px`;
            child.style.maxWidth = `${contentWidth}px`;
        });
    }

    const prioritiesSplit = clonedDocument.querySelector("#character-priorities .input-row-split");
    if (prioritiesSplit) {
        prioritiesSplit.style.justifyContent = "space-between";
    }
    clonedDocument
        .querySelectorAll("#character-priorities .input-row-right-column .input-row label")
        .forEach((label) => {
            label.style.flexBasis = "16ch";
        });
    clonedDocument.querySelectorAll("#character-mind .input-row-left-column .input-row label").forEach((label) => {
        label.style.flexBasis = "11.5ch";
    });
    clonedDocument.querySelectorAll("#character-body .input-row-right-column .input-row label").forEach((label) => {
        label.style.flexBasis = "6.5ch";
    });
    clonedDocument
        .querySelectorAll("#character-priorities .input-row-left-column .input-row label")
        .forEach((label) => {
            label.style.flexBasis = "6ch";
        });
    if (prioritiesSplit) {
        Array.from(prioritiesSplit.children).forEach((column) => {
            if (!column.classList.contains("column")) return;
            column.style.flex = "0 0 max-content";
            column.style.width = "max-content";
        });

        const rightColumn = prioritiesSplit.querySelector(".input-row-right-column");
        if (rightColumn) {
            const currentWidth =
                rightColumn.getBoundingClientRect().width ||
                parseFloat(clonedDocument.defaultView.getComputedStyle(rightColumn).width);

            if (Number.isFinite(currentWidth) && currentWidth > 0) {
                const widenedWidth = `calc(${currentWidth}px + 1ch)`;
                rightColumn.style.flex = `0 0 ${widenedWidth}`;
                rightColumn.style.width = widenedWidth;
            }
        }
    }

    clonedDocument.querySelectorAll("#remove-color-button, #add-color-button").forEach((el) => {
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
    });

    clonedDocument.querySelectorAll(".placeholder-text").forEach((el) => {
        el.style.color = "transparent";
    });

    clonedDocument.querySelectorAll('input[type="text"]').forEach(replaceTextInputForImage);
    clonedDocument.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(replaceChoiceInputForImage);
    clonedDocument.querySelectorAll('input[type="range"]').forEach(replaceRangeInputForImage);
    clonedDocument.querySelectorAll(".image-container img").forEach(replaceImageForImage);
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

function replaceImageForImage(img) {
    const container = img.closest(".image-container");
    if (!container || !img.currentSrc) return;

    const doc = img.ownerDocument;
    const imageStyle = doc.defaultView.getComputedStyle(img);
    const containerStyle = doc.defaultView.getComputedStyle(container);
    const replacement = doc.createElement("span");

    replacement.setAttribute("aria-hidden", "true");
    replacement.style.position = "absolute";
    replacement.style.left = containerStyle.paddingLeft;
    replacement.style.top = containerStyle.paddingTop;
    replacement.style.right = containerStyle.paddingRight;
    replacement.style.bottom = containerStyle.paddingBottom;
    replacement.style.borderRadius = imageStyle.borderRadius;
    replacement.style.backgroundImage = `url("${img.currentSrc}")`;
    replacement.style.backgroundPosition = "center";
    replacement.style.backgroundRepeat = "no-repeat";
    replacement.style.backgroundSize = "cover";
    replacement.style.opacity = imageStyle.opacity;

    img.replaceWith(replacement);
}

function replaceTextInputForImage(input) {
    const doc = input.ownerDocument;
    const style = doc.defaultView.getComputedStyle(input);
    const replacement = doc.createElement("span");

    if (input.value) {
        replacement.textContent = input.value;
    } else {
        const placeholder = doc.createElement("span");
        placeholder.textContent = "\u00a0";
        placeholder.style.visibility = "hidden";
        replacement.append(placeholder);
    }
    replacement.style.display = "inline-flex";
    replacement.style.alignItems = "center";
    replacement.style.boxSizing = "border-box";
    replacement.style.flex = style.flex;
    replacement.style.minWidth = style.minWidth;
    replacement.style.maxWidth = style.maxWidth;
    replacement.style.width = style.width;
    replacement.style.fontFamily = style.fontFamily;
    replacement.style.fontSize = style.fontSize;
    replacement.style.fontWeight = style.fontWeight;
    replacement.style.color = style.color;
    replacement.style.backgroundColor = "transparent";
    replacement.style.border = "none";
    replacement.style.borderBottom = style.borderBottom;
    replacement.style.borderRadius = "0";
    replacement.style.padding = style.padding;
    replacement.style.margin = style.margin;
    replacement.style.lineHeight = "1";
    replacement.style.verticalAlign = "baseline";
    replacement.style.overflow = "hidden";
    replacement.style.whiteSpace = "nowrap";
    replacement.style.textOverflow = "ellipsis";

    input.replaceWith(replacement);
}

function replaceChoiceInputForImage(input) {
    const replacement = input.ownerDocument.createElement("span");
    const style = input.ownerDocument.defaultView.getComputedStyle(input);
    const fillColor = getCssVariable(input.ownerDocument, "--fill-color", style.color);
    const backgroundColor = getCssVariable(input.ownerDocument, "--background-color", style.backgroundColor);
    const rect = input.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height, parseFloat(style.width), parseFloat(style.height)) || 16;

    replacement.setAttribute("aria-hidden", "true");
    replacement.style.display = "inline-block";
    replacement.style.boxSizing = "border-box";
    replacement.style.flex = style.flex || `0 0 ${size}px`;
    replacement.style.width = `${size}px`;
    replacement.style.height = `${size}px`;
    replacement.style.minWidth = `${size}px`;
    replacement.style.margin = style.margin;
    replacement.style.alignSelf = style.alignSelf;
    replacement.style.border = `${style.borderTopWidth} ${style.borderTopStyle} ${style.borderTopColor}`;
    replacement.style.borderRadius = input.type === "radio" ? "50%" : style.borderRadius;
    replacement.style.backgroundColor = input.checked ? fillColor : backgroundColor;

    input.replaceWith(replacement);
}

function replaceRangeInputForImage(input) {
    const doc = input.ownerDocument;
    const style = doc.defaultView.getComputedStyle(input);
    const lineColor = getCssVariable(doc, "--line-color", style.color);
    const fillColor = getCssVariable(doc, "--fill-color", style.color);
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
    wrapper.style.height = "16px";
    wrapper.style.margin = style.margin;
    wrapper.style.alignSelf = style.alignSelf;

    track.style.position = "absolute";
    track.style.left = "0";
    track.style.right = "0";
    track.style.top = "50%";
    track.style.height = "3px";
    track.style.background = lineColor;
    track.style.borderRadius = "10px";
    track.style.transform = "translateY(-50%)";

    thumb.style.position = "absolute";
    thumb.style.left = `${Math.max(0, Math.min(100, percent))}%`;
    thumb.style.top = "50%";
    thumb.style.width = "16px";
    thumb.style.height = "16px";
    thumb.style.boxSizing = "border-box";
    thumb.style.background = fillColor;
    thumb.style.border = `2px solid ${lineColor}`;
    thumb.style.borderRadius = "3px";
    thumb.style.transform = "translate(-50%, -50%) rotate(45deg)";

    wrapper.append(track, thumb);
    input.replaceWith(wrapper);
}

function getCssVariable(doc, name, fallback) {
    return doc.defaultView.getComputedStyle(doc.documentElement).getPropertyValue(name).trim() || fallback;
}
