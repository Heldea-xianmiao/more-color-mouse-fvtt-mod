/**
 * Cursor shape path builders and the main-cursor renderer.
 * All functions take the canvas context explicitly.
 */

/**
 * Begin the path for the requested cursor shape (path is NOT stroked/filled here).
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} shape
 * @param {number} x
 * @param {number} y
 * @param {number} r  Cursor size (radius or half-size).
 */
export function buildShapePath(ctx, shape, x, y, r) {
    if (shape === 'square') {
        const size = r * 2;
        ctx.rect(x - r, y - r, size, size);
    } else if (shape === 'star') {
        drawStar(ctx, x, y, 5, r, r / 2);
    } else if (shape === 'heart') {
        drawHeart(ctx, x, y, r);
    } else if (shape === 'triangle') {
        drawTriangle(ctx, x, y, r);
    } else if (shape === 'diamond') {
        drawDiamond(ctx, x, y, r);
    } else if (shape === 'crosshair') {
        drawCrosshair(ctx, x, y, r);
    } else if (shape === 'arrow') {
        drawArrow(ctx, x, y, r);
    } else if (shape === 'moon') {
        drawMoon(ctx, x, y, r);
    } else if (shape === 'pentagon') {
        drawPentagon(ctx, x, y, r);
    } else if (shape === 'hexagon') {
        drawHexagon(ctx, x, y, r);
    } else {
        ctx.arc(x, y, r, 0, Math.PI * 2);
    }
}

/**
 * Render the main cursor (custom image or built-in shape).
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} opts
 * @param {number} opts.x
 * @param {number} opts.y
 * @param {number} opts.size       Cursor size setting (radius / scale).
 * @param {string} opts.shape      Cursor shape key.
 * @param {HTMLImageElement|null} opts.cursorImg
 * @param {string} opts.currentColor  Main cursor color.
 * @param {string} opts.trailColor    Trail color (used for the image glow).
 */
export function renderCursor(ctx, opts) {
    const { x, y, size, shape, cursorImg, currentColor, trailColor } = opts;

    if (cursorImg) {
        // Draw Custom Image. The image size = cursorSize * 4 (so size 8 -> 32px).
        const imgSize = size * 4;

        // Add a glow effect to the image so it blends with the trail.
        ctx.shadowBlur = 15;
        ctx.shadowColor = trailColor;

        // Center the image so the trail (at mouseX, mouseY) comes from the middle.
        ctx.drawImage(cursorImg, x - imgSize / 2, y - imgSize / 2, imgSize, imgSize);

        ctx.shadowBlur = 0; // Reset
        return;
    }

    // Draw Shape
    ctx.beginPath();
    const drawShape = shape || 'circle';
    buildShapePath(ctx, drawShape, x, y, size);

    if (drawShape === 'ring') {
        ctx.lineWidth = 3;
        ctx.strokeStyle = currentColor;
        ctx.stroke();
    } else if (drawShape === 'crosshair' || drawShape === 'arrow') {
        ctx.fillStyle = currentColor;
        ctx.fill();
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = 2;
        ctx.stroke();
    } else {
        // Single fill with the glow shadow (previously filled twice).
        ctx.fillStyle = currentColor;
        ctx.shadowBlur = 10;
        ctx.shadowColor = currentColor;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
}

function drawHeart(ctx, x, y, size) {
    // Center adjustments
    y = y - size * 0.3;

    ctx.moveTo(x, y + size * 0.3);
    ctx.bezierCurveTo(x, y, x - size, y - size, x - size, y - size * 0.3);
    ctx.bezierCurveTo(x - size, y + size * 0.5, x, y + size, x, y + size);
    ctx.bezierCurveTo(x, y + size, x + size, y + size * 0.5, x + size, y - size * 0.3);
    ctx.bezierCurveTo(x + size, y - size, x, y, x, y + size * 0.3);
    ctx.closePath();
}

function drawTriangle(ctx, x, y, size) {
    // Adjust to center
    y = y + size * 0.2;
    const height = size * Math.sqrt(3) / 2;
    ctx.moveTo(x, y - size); // Top
    ctx.lineTo(x + size * 0.866, y + size * 0.5); // Bottom right
    ctx.lineTo(x - size * 0.866, y + size * 0.5); // Bottom left
    ctx.closePath();
}

function drawDiamond(ctx, x, y, size) {
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size, y);
    ctx.closePath();
}

function drawCrosshair(ctx, x, y, size) {
    const s = size * 0.6;
    const g = size * 0.25;
    ctx.rect(x - g, y - s, g * 2, s * 2);
    ctx.rect(x - s, y - g, s * 2, g * 2);
    ctx.moveTo(x, y);
    ctx.arc(x, y, g, 0, Math.PI * 2);
}

function drawArrow(ctx, x, y, size) {
    const s = size * 1.2;
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s * 0.6, y - s * 0.2);
    ctx.lineTo(x + s * 0.2, y - s * 0.1);
    ctx.lineTo(x + s * 0.2, y + s);
    ctx.lineTo(x - s * 0.2, y + s);
    ctx.lineTo(x - s * 0.2, y - s * 0.1);
    ctx.lineTo(x - s * 0.6, y - s * 0.2);
    ctx.closePath();
}

function drawMoon(ctx, x, y, size) {
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.arc(x + size * 0.35, y - size * 0.15, size * 0.85, 0, Math.PI * 2, true);
}

function drawPentagon(ctx, x, y, size) {
    ctx.moveTo(x, y - size);
    for (let i = 1; i < 5; i++) {
        const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
        ctx.lineTo(x + size * Math.cos(angle), y + size * Math.sin(angle));
    }
    ctx.closePath();
}

function drawHexagon(ctx, x, y, size) {
    ctx.moveTo(x + size, y);
    for (let i = 1; i < 6; i++) {
        const angle = i * Math.PI / 3;
        ctx.lineTo(x + size * Math.cos(angle), y + size * Math.sin(angle));
    }
    ctx.closePath();
}
