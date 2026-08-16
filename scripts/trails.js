/**
 * Trail renderers and particle simulation.
 * All functions take the canvas context and state explicitly.
 */

/** Trail styles that consume the position history buffer. */
export const HISTORY_TRAIL_STYLES = ['simple', 'image', 'glow', 'ribbon', 'dashed', 'dots'];

/**
 * Dispatch to the renderer for the configured trail style.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} data  { history, particles, hue, trailImg }
 * @param {object} config
 * @param {string} currentColor  Cursor color for this frame.
 * @param {string} trailColor    Effective trail color for this frame.
 */
export function renderTrail(ctx, data, config, currentColor, trailColor) {
    const { history, particles, hue, trailImg, dt = 1 } = data;

    switch (config.trailStyle) {
        case 'simple':
            return renderSimpleTrail(ctx, history, config, hue, trailColor);
        case 'image':
            // Fall back to the simple trail when no image was uploaded.
            if (!trailImg) return renderSimpleTrail(ctx, history, config, hue, trailColor);
            return renderImageTrail(ctx, history, config, trailImg);
        case 'particles':
            return renderParticles(ctx, particles, config, hue, currentColor, dt);
        case 'glow':
            return renderGlowTrail(ctx, history, config, hue, trailColor);
        case 'ribbon':
            return renderRibbonTrail(ctx, history, config, hue, trailColor);
        case 'dashed':
            return renderDashedTrail(ctx, history, config, hue, trailColor);
        case 'dots':
            return renderDotsTrail(ctx, history, config, hue, trailColor);
        default:
            return undefined;
    }
}

function renderImageTrail(ctx, history, config, trailImg) {
    if (!trailImg || history.length < 1) return;

    for (let i = 0; i < history.length; i++) {
        const p = history[i];
        const alpha = (i / history.length);
        const size = config.cursorSize * 2;

        ctx.globalAlpha = alpha;
        ctx.drawImage(trailImg, p.x - size / 2, p.y - size / 2, size, size);
    }
    ctx.globalAlpha = 1.0;
}

function renderGlowTrail(ctx, history, config, hue, color) {
    if (history.length < 2) return;
    const maxW = config.cursorSize * 3;
    for (let i = 0; i < history.length - 1; i++) {
        const p = history[i];
        const alpha = i / history.length;
        const width = maxW * alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, width * 0.5, 0, Math.PI * 2);
        let c;
        if (config.trailColor) c = hexToRgba(config.trailColor, alpha * 0.3);
        else if (config.rainbowMode) c = `hsla(${(hue - i * 3) % 360}, 100%, 60%, ${alpha * 0.3})`;
        else c = hexToRgba(color, alpha * 0.3);
        ctx.fillStyle = c;
        ctx.shadowBlur = 20;
        ctx.shadowColor = c;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

function renderRibbonTrail(ctx, history, config, hue, color) {
    if (history.length < 3) return;
    ctx.lineCap = 'butt';
    for (let i = 1; i < history.length - 1; i++) {
        const prev = history[i - 1];
        const p = history[i];
        const next = history[i + 1];
        const alpha = i / history.length;
        const width = config.cursorSize * 0.6 * alpha;
        const angle = Math.atan2(next.y - prev.y, next.x - prev.x);
        const perpX = -Math.sin(angle) * width;
        const perpY = Math.cos(angle) * width;
        ctx.beginPath();
        ctx.moveTo(p.x + perpX, p.y + perpY);
        ctx.lineTo(p.x - perpX, p.y - perpY);
        let c;
        if (config.trailColor) c = hexToRgba(config.trailColor, alpha);
        else if (config.rainbowMode) c = `hsla(${(hue - i * 4) % 360}, 100%, 50%, ${alpha})`;
        else c = hexToRgba(color, alpha);
        ctx.strokeStyle = c;
        ctx.lineWidth = width * 1.5;
        ctx.stroke();
    }
}

function renderDashedTrail(ctx, history, config, hue, color) {
    if (history.length < 2) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([6, 4]);
    for (let i = 0; i < history.length - 1; i++) {
        const p1 = history[i];
        const p2 = history[i + 1];
        const alpha = i / history.length;
        const width = config.cursorSize * 0.5 * alpha;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        let c;
        if (config.trailColor) c = hexToRgba(config.trailColor, alpha);
        else if (config.rainbowMode) c = `hsla(${(hue - i * 5) % 360}, 100%, 50%, ${alpha})`;
        else c = hexToRgba(color, alpha);
        ctx.strokeStyle = c;
        ctx.lineWidth = Math.max(1, width);
        ctx.stroke();
    }
    ctx.setLineDash([]);
}

function renderDotsTrail(ctx, history, config, hue, color) {
    if (history.length < 2) return;
    for (let i = 0; i < history.length; i++) {
        const p = history[i];
        const alpha = i / history.length;
        const radius = config.cursorSize * 0.3 * alpha;
        if (radius < 0.5) continue;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        let c;
        if (config.trailColor) c = hexToRgba(config.trailColor, alpha);
        else if (config.rainbowMode) c = `hsla(${(hue - i * 6) % 360}, 100%, 50%, ${alpha})`;
        else c = hexToRgba(color, alpha);
        ctx.fillStyle = c;
        ctx.fill();
    }
}

function renderSimpleTrail(ctx, history, config, hue, color) {
    // Draw lines between history points
    if (history.length < 2) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Connected lines with fading opacity
    for (let i = 0; i < history.length - 1; i++) {
        const p1 = history[i];
        const p2 = history[i + 1];

        const alpha = (i / history.length); // Fade out tail
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        // Width decreases
        const width = config.cursorSize * alpha;
        ctx.lineWidth = width;

        // If a specific trail color is forced, use it.
        // Otherwise use the rainbow hue (if enabled) or the base color.
        let strokeStyle;
        if (config.trailColor) {
            strokeStyle = hexToRgba(config.trailColor, alpha);
        } else if (config.rainbowMode) {
            strokeStyle = `hsla(${(hue - (history.length - i) * 5)}, 100%, 50%, ${alpha})`;
        } else {
            strokeStyle = hexToRgba(color, alpha);
        }

        ctx.strokeStyle = strokeStyle;
        ctx.stroke();
    }
}

/**
 * Spawn particles at the cursor position according to the configured preset.
 * @param {Array<object>} particles  Mutable particle array.
 * @param {object} config
 * @param {number} x
 * @param {number} y
 */
export function addParticles(particles, config, x, y) {
    let count = 3;
    const preset = config.particlePreset;

    if (preset === 'sparkle') count = 1;
    if (preset === 'fire') count = 4;
    if (preset === 'bubble') count = 2;
    if (preset === 'smoke') count = 2;
    if (preset === 'lightning') count = 1;

    for (let i = 0; i < count; i++) {
        let vx, vy, life = 1.0, color = null;

        if (preset === 'fire') {
            vx = (Math.random() - 0.5) * 1.5;
            vy = - Math.random() * 2 - 0.5;
            life = 0.8 + Math.random() * 0.4;
        } else if (preset === 'snow') {
            vx = (Math.random() - 0.5) * 1.5;
            vy = Math.random() * 2 + 0.5;
            life = 1.5 + Math.random();
        } else if (preset === 'sparkle') {
            vx = 0;
            vy = 0;
            life = 2.0;
        } else if (preset === 'bubble') {
            vx = (Math.random() - 0.5) * 0.8;
            vy = -Math.random() * 1.5 - 0.3;
            life = 1.5 + Math.random() * 1.0;
        } else if (preset === 'smoke') {
            vx = (Math.random() - 0.5) * 0.4;
            vy = -Math.random() * 0.8 - 0.2;
            life = 2.0 + Math.random() * 1.5;
        } else if (preset === 'gravity') {
            vx = (Math.random() - 0.5) * 3;
            vy = -Math.random() * 4 - 2;
            life = 1.2 + Math.random() * 0.6;
        } else if (preset === 'lightning') {
            vx = (Math.random() - 0.5) * 6;
            vy = (Math.random() - 0.5) * 6;
            life = 0.3 + Math.random() * 0.2;
        } else {
            vx = (Math.random() - 0.5) * 2;
            vy = (Math.random() - 0.5) * 2;
        }

        let pColor = config.trailColor || (config.rainbowMode ? null : config.baseColor);

        if (!config.trailColor && !config.rainbowMode) {
            if (preset === 'fire') pColor = '#ff4500';
            if (preset === 'snow') pColor = '#ffffff';
            if (preset === 'sparkle') pColor = '#ffd700';
            if (preset === 'bubble') pColor = '#88ccff';
            if (preset === 'smoke') pColor = '#aaaaaa';
            if (preset === 'lightning') pColor = '#ffff44';
        }

        particles.push({
            x: x,
            y: y,
            vx: vx,
            vy: vy,
            life: life,
            maxLife: life,
            color: pColor,
            preset: preset
        });
    }
}

function renderParticles(ctx, particles, config, hue, defaultColor, dt = 1) {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        if (p.preset === 'gravity') p.vy += 0.15 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= 0.02 * dt;

        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }

        // Determine rendering color:
        // 1. If p.color is set (custom trail color or a preset default), use it.
        // 2. If p.color is null (rainbow mode), use the current hue.
        let drawColor = p.color;

        if (!drawColor) {
            if (p.preset === 'fire') {
                const fireHue = (p.life / p.maxLife) * 50;
                drawColor = `hsl(${fireHue}, 100%, 50%)`;
            } else if (p.preset === 'bubble') {
                drawColor = `hsla(200, 80%, 70%, ${0.4 + 0.6 * (p.life / p.maxLife)})`;
            } else if (p.preset === 'smoke') {
                const a = 0.3 + 0.4 * (p.life / p.maxLife);
                drawColor = `rgba(180, 180, 180, ${a})`;
            } else if (p.preset === 'lightning') {
                drawColor = `hsl(55, 100%, 60%)`;
            } else {
                drawColor = `hsl(${hue}, 100%, 50%)`;
            }
        } else if (p.preset === 'sparkle') {
            ctx.globalAlpha = p.life * (Math.random() > 0.5 ? 1 : 0.2);
        }

        ctx.globalAlpha = Math.min(1, p.life);
        ctx.fillStyle = drawColor;

        ctx.beginPath();

        if (p.preset === 'sparkle') {
            const size = config.cursorSize * 0.4;
            ctx.rect(p.x - size / 2, p.y - size / 2, size, size);
        } else if (p.preset === 'bubble') {
            const r = config.cursorSize * 0.5 * (p.life / p.maxLife);
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = Math.min(0.3, p.life * 0.3);
            ctx.strokeStyle = drawColor;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        } else if (p.preset === 'smoke') {
            const r = config.cursorSize * 0.8 * (p.life / p.maxLife);
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.preset === 'gravity') {
            const r = config.cursorSize * 0.3;
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        } else if (p.preset === 'lightning') {
            const len = config.cursorSize * 2 * (1 - p.life / p.maxLife);
            const angle = Math.atan2(p.vy, p.vx);
            ctx.moveTo(p.x, p.y);
            let lx = p.x, ly = p.y;
            for (let s = 0; s < 4; s++) {
                lx += Math.cos(angle + (Math.random() - 0.5) * 0.8) * len / 4;
                ly += Math.sin(angle + (Math.random() - 0.5) * 0.8) * len / 4;
                ctx.lineTo(lx, ly);
            }
            ctx.lineWidth = 2;
            ctx.stroke();
            continue;
        } else {
            ctx.arc(p.x, p.y, config.cursorSize * 0.5 * (p.life / p.maxLife), 0, Math.PI * 2);
        }

        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

export function hexToRgba(hex, alpha) {
    // Basic hex parser
    let c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length == 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')';
    }
    return hex; // fallback if already rgba or name
}
