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

    html2canvas(container, {
        backgroundColor: getComputedStyle(document.body).backgroundColor || "#ffffff",
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

    clonedDocument.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(replaceChoiceInputForImage);
    clonedDocument.querySelectorAll('input[type="range"]').forEach(replaceRangeInputForImage);
    clonedDocument.querySelectorAll(".image-container img").forEach(replaceImageForImage);
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
