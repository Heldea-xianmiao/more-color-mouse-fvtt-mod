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
                    'triangle': "MCM.CursorShape.Triangle"
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
                    'image': "MCM.TrailStyle.Image"
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
                    'sparkle': "MCM.ParticlePreset.Sparkle"
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
        
        if (preset === 'sparkle') count = 1; // Sparkles should be sparse
        if (preset === 'fire') count = 4;
        
        for (let i = 0; i < count; i++) {
            let vx, vy, life = 1.0, color = null;
            
            if (preset === 'fire') {
                // Fire moves up
                vx = (Math.random() - 0.5) * 1.5;
                vy = - Math.random() * 2 - 0.5;
                life = 0.8 + Math.random() * 0.4;
                // Fire colors: Yellow -> Red
                // We will handle color in render, or set base color here if not rainbow
            } else if (preset === 'snow') {
                // Snow moves down
                vx = (Math.random() - 0.5) * 1.5;
                vy = Math.random() * 2 + 0.5;
                life = 1.5 + Math.random();
            } else if (preset === 'sparkle') {
                // Static sparkle
                vx = 0;
                vy = 0;
                life = 2.0;
            } else {
                // Spread (Default)
                vx = (Math.random() - 0.5) * 2;
                vy = (Math.random() - 0.5) * 2;
            }

            // Determine particle color
            let pColor = this.config.trailColor || (this.config.rainbowMode ? null : this.config.baseColor);
            
            // Override for specific non-rainbow defaults if user hasn't forced a trail color
            if (!this.config.trailColor && !this.config.rainbowMode) {
                 if (preset === 'fire') pColor = '#ff4500'; // OrangeRed
                 if (preset === 'snow') pColor = '#ffffff';
                 if (preset === 'sparkle') pColor = '#ffd700';
            }

            this.particles.push({
                x: x,
                y: y,
                vx: vx,
                vy: vy,
                life: life,
                maxLife: life, // Store initial life for ratio
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
        // Only add to history if mouse has moved slightly or list is empty to avoid stacking
        if (this.config.trailStyle === 'simple' || this.config.trailStyle === 'image') {
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
            this.renderParticles(currentColor); // Particles handle their own color logic
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
            } else {
                 // Circle and Ring
                 this.ctx.arc(this.mouseX, this.mouseY, r, 0, Math.PI * 2);
            }
            
            if (drawShape === 'ring') {
                this.ctx.lineWidth = 3;
                this.ctx.strokeStyle = currentColor;
                this.ctx.stroke();
            } else {
                this.ctx.fillStyle = currentColor;
                this.ctx.fill();
                 // Add a glow effect
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = currentColor;
                if (drawShape !== 'ring') this.ctx.fill();
                this.ctx.shadowBlur = 0; // Reset
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
                     // Fire Effect: Yellow to Red based on life
                     // Life goes from 1.0 to 0.
                     // 1.0 = Yellow (60), 0.0 = Red (0)
                     const fireHue = (p.life / p.maxLife) * 50; 
                     drawColor = `hsl(${fireHue}, 100%, 50%)`;
                 } else {
                     // Rainbow default
                     drawColor = `hsl(${this.hue}, 100%, 50%)`;
                 }
            } else if (p.preset === 'sparkle') {
                 // Sparkle flashes opacity
                 this.ctx.globalAlpha = p.life * (Math.random() > 0.5 ? 1 : 0.2);
            }

            this.ctx.globalAlpha = Math.min(1, p.life); // Base alpha fade
            this.ctx.fillStyle = drawColor;
            
            this.ctx.beginPath();
            
            if (p.preset === 'sparkle') {
                 // Draw a little cross or diamond
                 const size = this.config.cursorSize * 0.4;
                 this.ctx.rect(p.x - size/2, p.y - size/2, size, size);
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
