import { MODULE_ID } from './constants.js';
import { registerSettings, readConfig, getBroadcastSnapshot } from './settings.js';
import { renderCursor } from './shapes.js';
import { HISTORY_TRAIL_STYLES, renderTrail, addParticles } from './trails.js';

class MouseManager {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.mouseX = -100;
        this.mouseY = -100;
        this.history = [];
        this.particles = [];
        this.hue = 0;
        this.animationId = null;
        this.resizeTimer = null;
        this.cursorImg = null;
        this.trailImg = null;
        this._gmConfig = null;
        this._socketReady = false;

        this.config = {};
    }

    init() {
        registerSettings(this);
    }

    updateConfig() {
        this.config = readConfig(this);

        this.toggleSystemCursor();
        this.loadCursorImage();
        this.loadTrailImage();
        this.particles = [];
        this.history = [];
    }

    loadTrailImage() {
        if (this.config.trailImage) {
            const currentSrc = this.config.trailImage;
            const img = new Image();
            img.src = currentSrc;
            img.onload = () => {
                // Prevent race condition: ensure config hasn't changed while loading
                if (this.config.trailImage === currentSrc) {
                    this.trailImg = img;
                }
            };
            img.onerror = () => {
                console.warn(`More Color Mouse: Failed to load trail image ${this.config.trailImage}`);
                if (this.config.trailImage === currentSrc) {
                    this.trailImg = null;
                }
            };
        } else {
            this.trailImg = null;
        }
    }

    loadCursorImage() {
        if (this.config.cursorImage) {
            const currentSrc = this.config.cursorImage;
            const img = new Image();
            img.src = currentSrc;
            img.onload = () => {
                if (this.config.cursorImage === currentSrc) {
                    this.cursorImg = img;
                }
            };
            img.onerror = () => {
                console.warn(`More Color Mouse: Failed to load image ${this.config.cursorImage}`);
                if (this.config.cursorImage === currentSrc) {
                    this.cursorImg = null;
                }
            };
        } else {
            this.cursorImg = null;
        }
    }

    broadcastToPlayers() {
        const config = getBroadcastSnapshot();

        game.settings.set(MODULE_ID, 'gmBroadcastConfig', JSON.stringify(config)).then(() => {
            game.socket.emit(`module.${MODULE_ID}`, {
                type: 'gmBroadcast',
                config
            }).then(() => {
                ui.notifications.info(game.i18n.localize('MCM.BroadcastSuccess'));
            }).catch((error) => {
                console.error('More Color Mouse | Broadcast failed:', error);
                ui.notifications.error(game.i18n.localize('MCM.BroadcastFail'));
            });
        });
    }

    setup() {
        if (this.canvas) return;

        this.updateConfig();

        if (!this._socketReady) {
            game.socket.on(`module.${MODULE_ID}`, (data, userId) => {
                if (data.type === 'gmBroadcast' && userId !== game.user.id) {
                    this._gmConfig = data.config;
                    if (game.settings.get(MODULE_ID, 'useGmCursor')) {
                        this.updateConfig();
                        if (this.config.enable) {
                            if (!this.animationId) this.loop();
                        }
                    }
                }
            });
            this._socketReady = true;
        }

        this.canvas = document.createElement('canvas');
        this.canvas.id = 'more-color-mouse-canvas';
        this.ctx = this.canvas.getContext('2d');
        document.body.appendChild(this.canvas);

        window.addEventListener('resize', () => {
            if (this.resizeTimer) cancelAnimationFrame(this.resizeTimer);
            this.resizeTimer = requestAnimationFrame(() => this.resize());
        });
        this.resize();

        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;

            if (this.config.enable && this.config.trailStyle === 'particles') {
                addParticles(this.particles, this.config, e.clientX, e.clientY);
            }
        });

        document.addEventListener('mouseleave', () => {
            this.mouseX = -100;
            this.mouseY = -100;
            this.history = [];
        });

        this.toggle();
    }

    resize() {
        if (this.canvas) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
    }

    toggle() {
        if (this.config.enable) {
            if (this.canvas) this.canvas.style.display = 'block';
            if (!this.animationId) this.loop();
        } else {
            if (this.canvas) this.canvas.style.display = 'none';
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
        }
        this.toggleSystemCursor();
    }

    toggleSystemCursor() {
        const root = document.documentElement;
        if (this.config.enable && this.config.hideSystemCursor) {
            root.classList.add('mcm-hide-cursor');
            document.body.classList.add('mcm-hide-cursor');
        } else {
            root.classList.remove('mcm-hide-cursor');
            document.body.classList.remove('mcm-hide-cursor');
        }
    }

    loop() {
        this.animationId = requestAnimationFrame(() => this.loop());

        if (!this.ctx) return;

        // Clear
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update Hue for Rainbow
        this.hue = (this.hue + 2) % 360;
        const currentColor = this.config.rainbowMode ? `hsl(${this.hue}, 100%, 50%)` : this.config.baseColor;
        const trailColor = this.config.trailColor ? this.config.trailColor : currentColor;

        // Track History
        if (HISTORY_TRAIL_STYLES.includes(this.config.trailStyle)) {
            this.history.push({ x: this.mouseX, y: this.mouseY });
            if (this.history.length > this.config.trailLength) {
                this.history.shift();
            }
        }

        // Render Trail
        renderTrail(this.ctx, {
            history: this.history,
            particles: this.particles,
            hue: this.hue,
            trailImg: this.trailImg
        }, this.config, currentColor, trailColor);

        // Render Main Cursor
        renderCursor(this.ctx, {
            x: this.mouseX,
            y: this.mouseY,
            size: this.config.cursorSize,
            shape: this.config.cursorShape,
            cursorImg: this.cursorImg,
            currentColor,
            trailColor
        });
    }
}

const mouseManager = new MouseManager();

Hooks.once('init', () => {
    mouseManager.init();
});

Hooks.once('ready', () => {
    mouseManager.setup();
});
