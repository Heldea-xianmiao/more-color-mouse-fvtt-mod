const MODULE_ID = 'more-color-mouse';

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

    static BROADCAST_KEYS = [
        'enable', 'hideSystemCursor', 'trailLength', 'cursorShape',
        'cursorImage', 'cursorSize', 'rainbowMode', 'baseColor',
        'trailColor', 'trailImage', 'trailStyle', 'particlePreset'
    ];

    init() {
        this.registerSettings();
    }

    registerSettings() {
        const onChange = (fn) => {
            return () => {
                try {
                    fn.call(this);
                } catch (e) {
                    console.error(`More Color Mouse | onChange error:`, e);
                }
            };
        };

        const settings = [
            {
                key: 'enable',
                name: "MCM.Settings.Enable.Name",
                hint: "MCM.Settings.Enable.Hint",
                type: Boolean,
                default: true,
                scope: 'client',
                config: true,
                onChange: onChange(function() { this.updateConfig(); this.toggle(); })
            },
            {
                key: 'hideSystemCursor',
                name: "MCM.Settings.HideSystemCursor.Name",
                hint: "MCM.Settings.HideSystemCursor.Hint",
                type: Boolean,
                default: false,
                scope: 'client',
                config: true,
                onChange: onChange(function() { this.updateConfig(); this.toggleSystemCursor(); })
            },
            {
                key: 'trailLength',
                name: "MCM.Settings.TrailLength.Name",
                hint: "MCM.Settings.TrailLength.Hint",
                type: Number,
                default: 20,
                range: { min: 2, max: 100, step: 1 },
                scope: 'client',
                config: true,
                onChange: onChange(function() { this.updateConfig(); })
            },
            {
                key: 'cursorShape',
                name: "MCM.Settings.CursorShape.Name",
                hint: "MCM.Settings.CursorShape.Hint",
                type: String,
                default: 'circle',
                choices: {
                    'circle': "MCM.CursorShape.Circle",
                    'ring': "MCM.CursorShape.Ring",
                    'square': "MCM.CursorShape.Square",
                    'star': "MCM.CursorShape.Star",
                    'heart': "MCM.CursorShape.Heart",
                    'triangle': "MCM.CursorShape.Triangle",
                    'diamond': "MCM.CursorShape.Diamond",
                    'crosshair': "MCM.CursorShape.Crosshair",
                    'arrow': "MCM.CursorShape.Arrow",
                    'moon': "MCM.CursorShape.Moon",
                    'pentagon': "MCM.CursorShape.Pentagon",
                    'hexagon': "MCM.CursorShape.Hexagon"
                },
                scope: 'client',
                config: true,
                onChange: onChange(function() { this.updateConfig(); })
            },
            {
                key: 'cursorImage',
                name: "MCM.Settings.CursorImage.Name",
                hint: "MCM.Settings.CursorImage.Hint",
                type: String,
                default: '',
                scope: 'client',
                config: true,
                filePicker: 'image',
                onChange: onChange(function() { this.updateConfig(); })
            },
            {
                key: 'cursorSize',
                name: "MCM.Settings.CursorSize.Name",
                hint: "MCM.Settings.CursorSize.Hint",
                type: Number,
                default: 8,
                range: { min: 1, max: 30, step: 1 },
                scope: 'client',
                config: true,
                onChange: onChange(function() { this.updateConfig(); })
            },
            {
                key: 'rainbowMode',
                name: "MCM.Settings.RainbowMode.Name",
                hint: "MCM.Settings.RainbowMode.Hint",
                type: Boolean,
                default: true,
                scope: 'client',
                config: true,
                onChange: onChange(function() { this.updateConfig(); })
            },
            {
                key: 'baseColor',
                name: "MCM.Settings.BaseColor.Name",
                hint: "MCM.Settings.BaseColor.Hint",
                type: String,
                default: '#ff0000',
                scope: 'client',
                config: true,
                onChange: onChange(function() { this.updateConfig(); })
            },
            {
                key: 'trailColor',
                name: "MCM.Settings.TrailColor.Name",
                hint: "MCM.Settings.TrailColor.Hint",
                type: String,
                default: '',
                scope: 'client',
                config: true,
                onChange: onChange(function() { this.updateConfig(); })
            },
            {
                key: 'trailImage',
                name: "MCM.Settings.TrailImage.Name",
                hint: "MCM.Settings.TrailImage.Hint",
                type: String,
                default: '',
                scope: 'client',
                config: true,
                filePicker: 'image',
                onChange: onChange(function() { this.updateConfig(); })
            },
            {
                key: 'trailStyle',
                name: "MCM.Settings.TrailStyle.Name",
                hint: "MCM.Settings.TrailStyle.Hint",
                type: String,
                default: 'simple',
                choices: {
                    'simple': "MCM.TrailStyle.Simple",
                    'particles': "MCM.TrailStyle.Particles",
                    'image': "MCM.TrailStyle.Image",
                    'glow': "MCM.TrailStyle.Glow",
                    'ribbon': "MCM.TrailStyle.Ribbon",
                    'dashed': "MCM.TrailStyle.Dashed",
                    'dots': "MCM.TrailStyle.Dots"
                },
                scope: 'client',
                config: true,
                onChange: onChange(function() { this.updateConfig(); })
            },
            {
                key: 'particlePreset',
                name: "MCM.Settings.ParticlePreset.Name",
                hint: "MCM.Settings.ParticlePreset.Hint",
                type: String,
                default: 'spread',
                choices: {
                    'spread': "MCM.ParticlePreset.Spread",
                    'fire': "MCM.ParticlePreset.Fire",
                    'snow': "MCM.ParticlePreset.Snow",
                    'sparkle': "MCM.ParticlePreset.Sparkle",
                    'bubble': "MCM.ParticlePreset.Bubble",
                    'smoke': "MCM.ParticlePreset.Smoke",
                    'gravity': "MCM.ParticlePreset.Gravity",
                    'lightning': "MCM.ParticlePreset.Lightning"
                },
                scope: 'client',
                config: true,
                onChange: onChange(function() { this.updateConfig(); })
            },
            {
                key: 'useGmCursor',
                name: "MCM.Settings.UseGmCursor.Name",
                hint: "MCM.Settings.UseGmCursor.Hint",
                type: Boolean,
                default: false,
                scope: 'client',
                config: true,
                onChange: onChange(function() { this.updateConfig(); })
            }
        ];

        settings.forEach(s => {
            game.settings.register(MODULE_ID, s.key, {
                name: s.name,
                hint: s.hint,
                scope: s.scope,
                config: s.config,
                default: s.default,
                type: s.type,
                range: s.range,
                choices: s.choices,
                filePicker: s.filePicker,
                onChange: s.onChange
            });
        });

        game.settings.register(MODULE_ID, 'gmBroadcastConfig', {
            name: 'GM Broadcast Config',
            hint: 'Stores the GM\'s last broadcasted cursor configuration.',
            scope: 'world',
            config: false,
            type: Object,
            default: {}
        });

        Hooks.on("renderSettingsConfig", (app, html, data) => {
            const root = html instanceof HTMLElement ? html : html[0] || html;

            const colorFields = ['baseColor', 'trailColor'];
            colorFields.forEach(fieldKey => {
                const name = `${MODULE_ID}.${fieldKey}`;
                const input = root.querySelector(`input[name="${name}"]`);
                if (!input) return;

                if (input.parentElement.classList.contains('mcm-color-wrapper')) return;

                const wrapper = document.createElement('div');
                wrapper.className = 'mcm-color-wrapper';
                wrapper.style.cssText = 'display:flex; align-items:center; gap: 8px;';

                input.parentNode.insertBefore(wrapper, input);
                wrapper.appendChild(input);

                let initialColor = input.value;
                if (!initialColor || !initialColor.startsWith('#')) initialColor = '#000000';

                const colorPicker = document.createElement('input');
                colorPicker.type = 'color';
                colorPicker.value = initialColor;
                colorPicker.style.cssText = 'height: 26px; width: 40px; border: 1px solid #787878; padding: 1px; cursor: pointer; margin: 0;';

                colorPicker.addEventListener('input', (e) => {
                    input.value = e.target.value;
                });

                input.addEventListener('change', (e) => {
                    const v = e.target.value;
                    if (v && v.startsWith('#') && v.length === 7) {
                        colorPicker.value = v;
                    }
                });

                wrapper.appendChild(colorPicker);
            });

            const imageFields = ['cursorImage', 'trailImage'];
            imageFields.forEach(fieldKey => {
                const name = `${MODULE_ID}.${fieldKey}`;
                const input = root.querySelector(`input[name="${name}"]`);
                if (!input) return;

                const clearBtn = document.createElement('button');
                clearBtn.type = 'button';
                clearBtn.title = game.i18n.localize('MCM.ClearImage');
                clearBtn.style.cssText = 'flex:0 0 30px; line-height:24px; margin-left:5px;';
                clearBtn.innerHTML = '<i class="fas fa-trash"></i>';

                const pickerBtn = input.nextElementSibling?.matches('button.file-picker') ? input.nextElementSibling : null;
                if (pickerBtn) {
                    pickerBtn.insertAdjacentElement('afterend', clearBtn);
                } else {
                    const formFields = input.closest('.form-fields');
                    if (formFields) {
                        formFields.appendChild(clearBtn);
                    } else {
                        input.insertAdjacentElement('afterend', clearBtn);
                    }
                }

                clearBtn.addEventListener('click', () => {
                    input.value = '';
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                });
            });

            if (game.user.isGM) {
                const lastInput = root.querySelector(`input[name="${MODULE_ID}.useGmCursor"]`);
                const marker = lastInput?.closest('.form-group') || root.querySelector('.settings-list > .form-group:last-child');
                if (marker) {
                    const broadcastGroup = document.createElement('div');
                    broadcastGroup.className = 'form-group';
                    broadcastGroup.innerHTML = `<label>${game.i18n.localize('MCM.BroadcastLabel')}</label><div class="form-fields"><button type="button" class="mcm-broadcast-btn" style="flex:1;"><i class="fas fa-bullhorn"></i> ${game.i18n.localize('MCM.BroadcastButton')}</button></div>`;
                    marker.insertAdjacentElement('afterend', broadcastGroup);
                    broadcastGroup.querySelector('.mcm-broadcast-btn').addEventListener('click', () => {
                        mouseManager.broadcastToPlayers();
                    });
                }
            }
        });
    }

    updateConfig() {
        const useGmCursor = game.settings.get(MODULE_ID, 'useGmCursor');

        this.config = {
            enable: game.settings.get(MODULE_ID, 'enable'),
            hideSystemCursor: game.settings.get(MODULE_ID, 'hideSystemCursor'),
            trailLength: game.settings.get(MODULE_ID, 'trailLength'),
            cursorShape: game.settings.get(MODULE_ID, 'cursorShape'),
            cursorImage: (game.settings.get(MODULE_ID, 'cursorImage') || '').trim(),
            cursorSize: game.settings.get(MODULE_ID, 'cursorSize'),
            rainbowMode: game.settings.get(MODULE_ID, 'rainbowMode'),
            baseColor: game.settings.get(MODULE_ID, 'baseColor'),
            trailColor: game.settings.get(MODULE_ID, 'trailColor'),
            trailImage: (game.settings.get(MODULE_ID, 'trailImage') || '').trim(),
            trailStyle: game.settings.get(MODULE_ID, 'trailStyle'),
            particlePreset: game.settings.get(MODULE_ID, 'particlePreset'),
            useGmCursor
        };

        if (useGmCursor) {
            const gmConfig = this._gmConfig || game.settings.get(MODULE_ID, 'gmBroadcastConfig');
            if (gmConfig && Object.keys(gmConfig).length > 0) {
                for (const key of MouseManager.BROADCAST_KEYS) {
                    if (key in gmConfig) {
                        this.config[key] = gmConfig[key];
                    }
                }
            }
            this.config.useGmCursor = true;
        }

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
        const config = {};
        for (const key of MouseManager.BROADCAST_KEYS) {
            config[key] = game.settings.get(MODULE_ID, key);
        }

        game.settings.set(MODULE_ID, 'gmBroadcastConfig', config).then(() => {
            game.socket.emit(`module.${MODULE_ID}`, {
                type: 'gmBroadcast',
                senderId: game.user.id,
                config
            }, (error) => {
                if (error) {
                    console.error('More Color Mouse | Broadcast failed:', error);
                    ui.notifications.error(game.i18n.localize('MCM.BroadcastFail'));
                    return;
                }
                ui.notifications.info(game.i18n.localize('MCM.BroadcastSuccess'));
            });
        });
    }

    setup() {
        if (this.canvas) return;

        this.updateConfig();

        if (!this._socketReady) {
            game.socket.on(`module.${MODULE_ID}`, (data) => {
                if (data.type === 'gmBroadcast' && data.senderId !== game.user.id) {
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
                 this.addParticles(e.clientX, e.clientY);
            }
        });

        document.addEventListener('mouseleave', () => {
            this.mouseX = -100;
            this.mouseY = -100;
            this.history = [];
        });

        this.toggle();
    }
    
    addParticles(x, y) {
        let count = 3;
        const preset = this.config.particlePreset;
        
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

            let pColor = this.config.trailColor || (this.config.rainbowMode ? null : this.config.baseColor);
            
            if (!this.config.trailColor && !this.config.rainbowMode) {
                 if (preset === 'fire') pColor = '#ff4500';
                 if (preset === 'snow') pColor = '#ffffff';
                 if (preset === 'sparkle') pColor = '#ffd700';
                 if (preset === 'bubble') pColor = '#88ccff';
                 if (preset === 'smoke') pColor = '#aaaaaa';
                 if (preset === 'lightning') pColor = '#ffff44';
            }

            this.particles.push({
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
        const needsHistory = ['simple', 'image', 'glow', 'ribbon', 'dashed', 'dots'];
        if (needsHistory.includes(this.config.trailStyle)) {
            this.history.push({ x: this.mouseX, y: this.mouseY });
            if (this.history.length > this.config.trailLength) {
                this.history.shift();
            }
        }

        // Render Trail
        if (this.config.trailStyle === 'simple') {
            this.renderSimpleTrail(trailColor);
        } else if (this.config.trailStyle === 'image') {
            this.renderImageTrail();
        } else if (this.config.trailStyle === 'particles') {
            this.renderParticles(currentColor);
        } else if (this.config.trailStyle === 'glow') {
            this.renderGlowTrail(trailColor);
        } else if (this.config.trailStyle === 'ribbon') {
            this.renderRibbonTrail(trailColor);
        } else if (this.config.trailStyle === 'dashed') {
            this.renderDashedTrail(trailColor);
        } else if (this.config.trailStyle === 'dots') {
            this.renderDotsTrail(trailColor);
        }

        // Render Main Cursor
        if (this.cursorImg) {
            // Draw Custom Image
            // We use cursorSize as a scale factor or absolute size.
            // Let's make the image size = cursorSize * 4 (so size 8 -> 32px)
            const size = this.config.cursorSize * 4; 
            
            // Add a glow effect to the image so it blends with the trail
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = trailColor;
            
            // Center the image so the trail (at mouseX, mouseY) comes from the middle
            this.ctx.drawImage(this.cursorImg, this.mouseX - size / 2, this.mouseY - size / 2, size, size);
            
            this.ctx.shadowBlur = 0; // Reset
        } else {
            // Draw Shape
            this.ctx.beginPath();
            let drawShape = this.config.cursorShape || 'circle';
            const r = this.config.cursorSize;
            
            if (drawShape === 'square') {
                const size = r * 2;
                this.ctx.rect(this.mouseX - r, this.mouseY - r, size, size);
            } else if (drawShape === 'star') {
                this.drawStar(this.mouseX, this.mouseY, 5, r, r / 2);
            } else if (drawShape === 'heart') {
                this.drawHeart(this.mouseX, this.mouseY, r);
            } else if (drawShape === 'triangle') {
                this.drawTriangle(this.mouseX, this.mouseY, r);
            } else if (drawShape === 'diamond') {
                this.drawDiamond(this.mouseX, this.mouseY, r);
            } else if (drawShape === 'crosshair') {
                this.drawCrosshair(this.mouseX, this.mouseY, r);
            } else if (drawShape === 'arrow') {
                this.drawArrow(this.mouseX, this.mouseY, r);
            } else if (drawShape === 'moon') {
                this.drawMoon(this.mouseX, this.mouseY, r);
            } else if (drawShape === 'pentagon') {
                this.drawPentagon(this.mouseX, this.mouseY, r);
            } else if (drawShape === 'hexagon') {
                this.drawHexagon(this.mouseX, this.mouseY, r);
            } else {
                 this.ctx.arc(this.mouseX, this.mouseY, r, 0, Math.PI * 2);
            }
            
            if (drawShape === 'ring') {
                this.ctx.lineWidth = 3;
                this.ctx.strokeStyle = currentColor;
                this.ctx.stroke();
            } else if (drawShape === 'crosshair' || drawShape === 'arrow') {
                this.ctx.fillStyle = currentColor;
                this.ctx.fill();
                this.ctx.strokeStyle = currentColor;
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            } else {
                this.ctx.fillStyle = currentColor;
                this.ctx.fill();
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = currentColor;
                if (drawShape !== 'ring') this.ctx.fill();
                this.ctx.shadowBlur = 0;
            }
        }
    }

    renderImageTrail() {
        if (!this.trailImg || this.history.length < 1) return;
        
        for (let i = 0; i < this.history.length; i++) {
            const p = this.history[i];
            const alpha = (i / this.history.length);
            const size = this.config.cursorSize * 2;
            
            this.ctx.globalAlpha = alpha;
            this.ctx.drawImage(this.trailImg, p.x - size/2, p.y - size/2, size, size);
        }
        this.ctx.globalAlpha = 1.0;
    }

    renderGlowTrail(color) {
        if (this.history.length < 2) return;
        const maxW = this.config.cursorSize * 3;
        for (let i = 0; i < this.history.length - 1; i++) {
            const p = this.history[i];
            const alpha = i / this.history.length;
            const width = maxW * alpha;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, width * 0.5, 0, Math.PI * 2);
            let c;
            if (this.config.trailColor) c = this.hexToRgba(this.config.trailColor, alpha * 0.3);
            else if (this.config.rainbowMode) c = `hsla(${(this.hue - i * 3) % 360}, 100%, 60%, ${alpha * 0.3})`;
            else c = this.hexToRgba(color, alpha * 0.3);
            this.ctx.fillStyle = c;
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = c;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }
    }

    renderRibbonTrail(color) {
        if (this.history.length < 3) return;
        this.ctx.lineCap = 'butt';
        for (let i = 1; i < this.history.length - 1; i++) {
            const prev = this.history[i - 1];
            const p = this.history[i];
            const next = this.history[i + 1];
            const alpha = i / this.history.length;
            const width = this.config.cursorSize * 0.6 * alpha;
            const angle = Math.atan2(next.y - prev.y, next.x - prev.x);
            const perpX = -Math.sin(angle) * width;
            const perpY = Math.cos(angle) * width;
            this.ctx.beginPath();
            this.ctx.moveTo(p.x + perpX, p.y + perpY);
            this.ctx.lineTo(p.x - perpX, p.y - perpY);
            let c;
            if (this.config.trailColor) c = this.hexToRgba(this.config.trailColor, alpha);
            else if (this.config.rainbowMode) c = `hsla(${(this.hue - i * 4) % 360}, 100%, 50%, ${alpha})`;
            else c = this.hexToRgba(color, alpha);
            this.ctx.strokeStyle = c;
            this.ctx.lineWidth = width * 1.5;
            this.ctx.stroke();
        }
    }

    renderDashedTrail(color) {
        if (this.history.length < 2) return;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.setLineDash([6, 4]);
        for (let i = 0; i < this.history.length - 1; i++) {
            const p1 = this.history[i];
            const p2 = this.history[i + 1];
            const alpha = i / this.history.length;
            const width = this.config.cursorSize * 0.5 * alpha;
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            let c;
            if (this.config.trailColor) c = this.hexToRgba(this.config.trailColor, alpha);
            else if (this.config.rainbowMode) c = `hsla(${(this.hue - i * 5) % 360}, 100%, 50%, ${alpha})`;
            else c = this.hexToRgba(color, alpha);
            this.ctx.strokeStyle = c;
            this.ctx.lineWidth = Math.max(1, width);
            this.ctx.stroke();
        }
        this.ctx.setLineDash([]);
    }

    renderDotsTrail(color) {
        if (this.history.length < 2) return;
        for (let i = 0; i < this.history.length; i++) {
            const p = this.history[i];
            const alpha = i / this.history.length;
            const radius = this.config.cursorSize * 0.3 * alpha;
            if (radius < 0.5) continue;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            let c;
            if (this.config.trailColor) c = this.hexToRgba(this.config.trailColor, alpha);
            else if (this.config.rainbowMode) c = `hsla(${(this.hue - i * 6) % 360}, 100%, 50%, ${alpha})`;
            else c = this.hexToRgba(color, alpha);
            this.ctx.fillStyle = c;
            this.ctx.fill();
        }
    }

    drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        this.ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            this.ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
        }
        this.ctx.lineTo(cx, cy - outerRadius);
        this.ctx.closePath();
    }

    drawHeart(x, y, size) {
        // Center adjustments
        y = y - size * 0.3;
        
        this.ctx.moveTo(x, y + size * 0.3);
        this.ctx.bezierCurveTo(x, y, x - size, y - size, x - size, y - size * 0.3);
        this.ctx.bezierCurveTo(x - size, y + size * 0.5, x, y + size, x, y + size);
        this.ctx.bezierCurveTo(x, y + size, x + size, y + size * 0.5, x + size, y - size * 0.3);
        this.ctx.bezierCurveTo(x + size, y - size, x, y, x, y + size * 0.3);
        this.ctx.closePath();
    }

    drawTriangle(x, y, size) {
        // Adjust to center
        y = y + size * 0.2; 
        const height = size * Math.sqrt(3) / 2;
        this.ctx.moveTo(x, y - size); // Top
        this.ctx.lineTo(x + size*0.866, y + size*0.5); // Bottom right
        this.ctx.lineTo(x - size*0.866, y + size*0.5); // Bottom left
        this.ctx.closePath();
    }

    drawDiamond(x, y, size) {
        this.ctx.moveTo(x, y - size);
        this.ctx.lineTo(x + size, y);
        this.ctx.lineTo(x, y + size);
        this.ctx.lineTo(x - size, y);
        this.ctx.closePath();
    }

    drawCrosshair(x, y, size) {
        const s = size * 0.6;
        const g = size * 0.25;
        this.ctx.rect(x - g, y - s, g * 2, s * 2);
        this.ctx.rect(x - s, y - g, s * 2, g * 2);
        this.ctx.moveTo(x, y);
        this.ctx.arc(x, y, g, 0, Math.PI * 2);
    }

    drawArrow(x, y, size) {
        const s = size * 1.2;
        this.ctx.moveTo(x, y - s);
        this.ctx.lineTo(x + s * 0.6, y - s * 0.2);
        this.ctx.lineTo(x + s * 0.2, y - s * 0.1);
        this.ctx.lineTo(x + s * 0.2, y + s);
        this.ctx.lineTo(x - s * 0.2, y + s);
        this.ctx.lineTo(x - s * 0.2, y - s * 0.1);
        this.ctx.lineTo(x - s * 0.6, y - s * 0.2);
        this.ctx.closePath();
    }

    drawMoon(x, y, size) {
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.35, y - size * 0.15, size * 0.85, 0, Math.PI * 2, true);
    }

    drawPentagon(x, y, size) {
        this.ctx.moveTo(x, y - size);
        for (let i = 1; i < 5; i++) {
            const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
            this.ctx.lineTo(x + size * Math.cos(angle), y + size * Math.sin(angle));
        }
        this.ctx.closePath();
    }

    drawHexagon(x, y, size) {
        this.ctx.moveTo(x + size, y);
        for (let i = 1; i < 6; i++) {
            const angle = i * Math.PI / 3;
            this.ctx.lineTo(x + size * Math.cos(angle), y + size * Math.sin(angle));
        }
        this.ctx.closePath();
    }

    renderSimpleTrail(color) {
        // Draw lines between history points
        if (this.history.length < 2) return;

        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Method 1: Connected lines with fading opacity
        for (let i = 0; i < this.history.length - 1; i++) {
            const p1 = this.history[i];
            const p2 = this.history[i+1];
            
            const alpha = (i / this.history.length); // Fade out tail
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            
            // Width decreases
            const width = this.config.cursorSize * alpha;
            this.ctx.lineWidth = width;
            
            // Use specific trail color if simple trail and rainbow mode is OFF, OR if a specific trail color is forced
            // If Rainbow Mode is On AND No Force Trail Color => Rainbow
            // If Force Trail Color => Use it
            // If Rainbow Off AND No Force => Use passed color (which is base color)
            
            let strokeStyle;
            if (this.config.trailColor) {
                 strokeStyle = this.hexToRgba(this.config.trailColor, alpha);
            } else if (this.config.rainbowMode) {
                 strokeStyle = `hsla(${(this.hue - (this.history.length - i) * 5)}, 100%, 50%, ${alpha})`;
            } else {
                 strokeStyle = this.hexToRgba(color, alpha);
            }

            this.ctx.strokeStyle = strokeStyle;
            this.ctx.stroke();
        }
    }

    renderParticles(defaultColor) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            if (p.preset === 'gravity') p.vy += 0.15;
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            // Determine rendering color
            let drawColor = p.color;
            
            // If rainbow mode is on and no specific trail color is set, cycle colors
            // But if it's fire/snow/etc, p.color might be set to null if rainbow is On.
            // Let's ensure logic: 
            // 1. If p.color is set (Custom Trail Color or Specific Preset default like Fire Orange), use it.
            // 2. If p.color is null (Rainbow Mode), use current Hue.
            
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
                     drawColor = `hsl(${this.hue}, 100%, 50%)`;
                 }
            } else if (p.preset === 'sparkle') {
                 this.ctx.globalAlpha = p.life * (Math.random() > 0.5 ? 1 : 0.2);
            }

            this.ctx.globalAlpha = Math.min(1, p.life);
            this.ctx.fillStyle = drawColor;
            
            this.ctx.beginPath();
            
            if (p.preset === 'sparkle') {
                 const size = this.config.cursorSize * 0.4;
                 this.ctx.rect(p.x - size/2, p.y - size/2, size, size);
            } else if (p.preset === 'bubble') {
                 const r = this.config.cursorSize * 0.5 * (p.life / p.maxLife);
                 this.ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
                 this.ctx.fill();
                 this.ctx.globalAlpha = Math.min(0.3, p.life * 0.3);
                 this.ctx.strokeStyle = drawColor;
                 this.ctx.lineWidth = 1;
                 this.ctx.stroke();
                 this.ctx.globalAlpha = 1.0;
            } else if (p.preset === 'smoke') {
                 const r = this.config.cursorSize * 0.8 * (p.life / p.maxLife);
                 this.ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
                 this.ctx.fill();
            } else if (p.preset === 'gravity') {
                 const r = this.config.cursorSize * 0.3;
                 this.ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            } else if (p.preset === 'lightning') {
                 const len = this.config.cursorSize * 2 * (1 - p.life / p.maxLife);
                 const angle = Math.atan2(p.vy, p.vx);
                 this.ctx.moveTo(p.x, p.y);
                 let lx = p.x, ly = p.y;
                 for (let s = 0; s < 4; s++) {
                     lx += Math.cos(angle + (Math.random() - 0.5) * 0.8) * len / 4;
                     ly += Math.sin(angle + (Math.random() - 0.5) * 0.8) * len / 4;
                     this.ctx.lineTo(lx, ly);
                 }
                 this.ctx.lineWidth = 2;
                 this.ctx.stroke();
                 continue;
            } else {
                 this.ctx.arc(p.x, p.y, this.config.cursorSize * 0.5 * (p.life / p.maxLife), 0, Math.PI * 2);
            }
            
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
        }
    }

    hexToRgba(hex, alpha) {
        // Basic hex parser
        let c;
        if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
            c= hex.substring(1).split('');
            if(c.length== 3){
                c= [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c= '0x'+c.join('');
            return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
        }
        return hex; // fallback if already rgba or name
    }
}

const mouseManager = new MouseManager();

Hooks.once('init', () => {
    mouseManager.init();
});

Hooks.once('ready', () => {
    mouseManager.setup();
});
