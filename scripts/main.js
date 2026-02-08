const MODULE_ID = 'more-color-mouse';

class MouseManager {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.mouseX = -100; // Start off-screen
        this.mouseY = -100;
        this.history = [];
        this.particles = [];
        this.hue = 0;
        this.animationId = null;
        this.cursorImg = null;
        this.trailImg = null;
        
        // Configuration cache
        this.config = {};
    }

    init() {
        this.registerSettings();
        this.updateConfig();
    }

    registerSettings() {
        // Define settings with direct Chinese strings
        const settings = [
            {
                key: 'enable',
                name: "启用自定义光标",
                hint: "开启或关闭自定义光标及拖尾效果。",
                type: Boolean,
                default: true,
                scope: 'client',
                config: true,
                onChange: () => { this.updateConfig(); this.toggle(); }
            },
            {
                key: 'hideSystemCursor',
                name: "隐藏系统默认光标",
                hint: "勾选后将强制隐藏电脑自带的鼠标指针。(需要重载世界生效)",
                type: Boolean,
                default: false,
                scope: 'client',
                config: true,
                onChange: () => { this.updateConfig(); this.toggleSystemCursor(); }
            },
            {
                key: 'trailLength',
                name: "拖尾停留时间/长度",
                hint: "轨迹保留的帧数，数值越大拖尾越长。",
                type: Number,
                default: 20,
                range: { min: 2, max: 100, step: 1 },
                scope: 'client',
                config: true,
                onChange: () => this.updateConfig()
            },
            {
                key: 'cursorShape',
                name: "光标形状",
                hint: "选择光标的显示形状。若已上传自定义图片，则优先显示图片。",
                type: String,
                default: 'circle',
                choices: {
                    'circle': '圆形 (Circle)',
                    'ring': '空心圆环 (Ring)',
                    'square': '正方形 (Square)',
                    'star': '星星 (Star)',
                    'heart': '爱心 (Heart)',
                    'triangle': '三角形 (Triangle)'
                },
                scope: 'client',
                config: true,
                onChange: () => this.updateConfig()
            },
            {
                key: 'cursorImage',
                name: "自定义光标图片",
                hint: "上传一张图片作为鼠标光标 (推荐 PNG 格式)。留空则使用上方设定的形状。",
                type: String,
                default: '',
                scope: 'client',
                config: true,
                filePicker: 'image',
                onChange: () => this.updateConfig()
            },
            {
                key: 'cursorSize',
                name: "光标大小",
                hint: "光标图形的半径或尺寸。",
                type: Number,
                default: 8,
                range: { min: 1, max: 30, step: 1 },
                scope: 'client',
                config: true,
                onChange: () => this.updateConfig()
            },
            {
                key: 'rainbowMode',
                name: "彩虹模式",
                hint: "开启后，光标和拖尾颜色会不断流转变化。",
                type: Boolean,
                default: true,
                scope: 'client',
                config: true,
                onChange: () => this.updateConfig()
            },
            {
                key: 'baseColor',
                name: "光标颜色",
                hint: "光标的主体颜色 (彩虹模式关闭时生效)。",
                type: String,
                default: '#ff0000',
                scope: 'client',
                config: true,
                onChange: () => this.updateConfig()
            },
            {
                key: 'trailColor',
                name: "拖尾颜色",
                hint: "单独设置拖尾的颜色，留空则跟随光标颜色。",
                type: String,
                default: '',
                scope: 'client',
                config: true,
                onChange: () => this.updateConfig()
            },
            {
                key: 'trailImage',
                name: "自定义拖尾图片",
                hint: "当拖尾样式选择“图片重复”时使用的图片。",
                type: String,
                default: '',
                scope: 'client',
                config: true,
                filePicker: 'image',
                onChange: () => this.updateConfig()
            },
            {
                key: 'trailStyle',
                name: "拖尾样式",
                hint: "选择拖尾的视觉表现形式。",
                type: String,
                default: 'simple',
                choices: {
                    'simple': '线性拖尾',
                    'particles': '粒子发射',
                    'image': '图片重复 (Image)'
                },
                scope: 'client',
                config: true,
                onChange: () => this.updateConfig()
            },
            {
                key: 'particlePreset',
                name: "粒子特效预设",
                hint: "当拖尾样式为“粒子”时，选择具体的粒子动作效果。",
                type: String,
                default: 'spread',
                choices: {
                    'spread': '扩散 (默认)',
                    'fire': '火焰 (上升)',
                    'snow': '雪花 (下落)',
                    'sparkle': '魔法闪烁 (静止闪耀)'
                },
                scope: 'client',
                config: true,
                onChange: () => this.updateConfig()
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
                filePicker: s.filePicker, // <--- Correctly pass the filePicker option
                onChange: s.onChange
            });
        });

        // UI Injection Hook (Only for Color Pickers now, let Foundry handle File Picker)
        Hooks.on("renderSettingsConfig", (app, html, data) => {
            // Ensure jQuery object
            const $html = $(html);

            // 1. Color Pickers
            const colorFields = ['baseColor', 'trailColor'];
            colorFields.forEach(fieldKey => {
                const name = `${MODULE_ID}.${fieldKey}`;
                const input = $html.find(`input[name="${name}"]`);
                
                if (!input.length) return;
                
                // Avoid double injection
                if (input.parent().hasClass('mcm-color-wrapper')) return;

                // Create a container that fits into Foundry's form structure
                // Usually inputs are inside .form-fields
                const wrapper = $('<div class="mcm-color-wrapper" style="display:flex; align-items:center; gap: 8px;"></div>');
                
                input.wrap(wrapper);
                const actualWrapper = input.parent();

                // Determine initial color (handle empty string)
                let initialColor = input.val();
                if (!initialColor || !initialColor.startsWith('#')) initialColor = '#000000';

                const colorPicker = $(`<input type="color" value="${initialColor}" style="height: 26px; width: 40px; border: 1px solid #787878; padding: 1px; cursor: pointer; margin: 0;">`);
                
                colorPicker.on('input', (e) => {
                    input.val(e.target.value);
                });
                
                input.on('change', (e) => {
                    let v = e.target.value;
                    if (v && v.startsWith('#') && v.length === 7) {
                        colorPicker.val(v);
                    }
                });
                
                actualWrapper.append(colorPicker);
            });

            // 2. Image Clear Buttons
            const imageFields = ['cursorImage', 'trailImage'];
            imageFields.forEach(fieldKey => {
                const name = `${MODULE_ID}.${fieldKey}`;
                const input = $html.find(`input[name="${name}"]`);
                if (!input.length) return;

                // Create Clear Button
                const clearBtn = $(`<button type="button" title="清除图片" style="flex:0 0 30px; line-height:24px; margin-left:5px;"><i class="fas fa-trash"></i></button>`);
                
                // Insert after the file-picker button if it exists
                const pickerBtn = input.next('button.file-picker');
                if (pickerBtn.length) {
                    pickerBtn.after(clearBtn);
                } else {
                    input.after(clearBtn);
                }

                // Click event
                clearBtn.on('click', () => {
                    input.val('');
                    input.trigger('change'); // Notify Foundry of change
                });
            });
        });
    }

    updateConfig() {
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
            particlePreset: game.settings.get(MODULE_ID, 'particlePreset')
        };
        
        // Ensure system cursor state is consistent with new settings
        this.toggleSystemCursor();
        this.loadCursorImage();
        this.loadTrailImage();
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
                // Prevent race condition
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

    setup() {
        if (this.canvas) return;

        // Create Canvas
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'more-color-mouse-canvas';
        this.ctx = this.canvas.getContext('2d');
        document.body.appendChild(this.canvas);

        // Resize Listener
        window.addEventListener('resize', () => this.resize());
        this.resize();

        // Mouse Move Listener
        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            
            // Add particles if in particle mode
            if (this.config.enable && this.config.trailStyle === 'particles') {
                 this.addParticles(e.clientX, e.clientY);
            }
        });

        // Start Loop
        this.loop();
        this.toggleSystemCursor();
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
        if (this.canvas) {
            this.canvas.style.display = this.config.enable ? 'block' : 'none';
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

        if (!this.config.enable || !this.ctx) return;

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
