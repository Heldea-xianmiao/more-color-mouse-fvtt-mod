import { MODULE_ID, BROADCAST_KEYS } from './constants.js';

/**
 * Register all module settings, plus the settings-page UI enhancements
 * (color pickers, clear-image buttons and the GM broadcast button).
 * @param {object} manager  The MouseManager instance.
 */
export function registerSettings(manager) {
    const onChange = (fn) => () => {
        try {
            fn();
        } catch (e) {
            console.error(`More Color Mouse | onChange error:`, e);
        }
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
            onChange: onChange(() => { manager.updateConfig(); manager.toggle(); })
        },
        {
            key: 'hideSystemCursor',
            name: "MCM.Settings.HideSystemCursor.Name",
            hint: "MCM.Settings.HideSystemCursor.Hint",
            type: Boolean,
            default: false,
            scope: 'client',
            config: true,
            onChange: onChange(() => { manager.updateConfig(); manager.toggleSystemCursor(); })
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
            onChange: onChange(() => { manager.updateConfig(); })
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
            onChange: onChange(() => { manager.updateConfig(); })
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
            onChange: onChange(() => { manager.updateConfig(); })
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
            onChange: onChange(() => { manager.updateConfig(); })
        },
        {
            key: 'rainbowMode',
            name: "MCM.Settings.RainbowMode.Name",
            hint: "MCM.Settings.RainbowMode.Hint",
            type: Boolean,
            default: true,
            scope: 'client',
            config: true,
            onChange: onChange(() => { manager.updateConfig(); })
        },
        {
            key: 'baseColor',
            name: "MCM.Settings.BaseColor.Name",
            hint: "MCM.Settings.BaseColor.Hint",
            type: String,
            default: '#ff0000',
            scope: 'client',
            config: true,
            onChange: onChange(() => { manager.updateConfig(); })
        },
        {
            key: 'trailColor',
            name: "MCM.Settings.TrailColor.Name",
            hint: "MCM.Settings.TrailColor.Hint",
            type: String,
            default: '',
            scope: 'client',
            config: true,
            onChange: onChange(() => { manager.updateConfig(); })
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
            onChange: onChange(() => { manager.updateConfig(); })
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
            onChange: onChange(() => { manager.updateConfig(); })
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
            onChange: onChange(() => { manager.updateConfig(); })
        },
        {
            key: 'useGmCursor',
            name: "MCM.Settings.UseGmCursor.Name",
            hint: "MCM.Settings.UseGmCursor.Hint",
            type: Boolean,
            default: false,
            scope: 'client',
            config: true,
            onChange: onChange(() => { manager.updateConfig(); })
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
        type: String,
        default: '{}'
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
                    manager.broadcastToPlayers();
                });
            }
        }
    });
}

/**
 * Build the effective client config from the current settings,
 * optionally overridden by the GM's broadcasted configuration.
 * @param {object} manager  The MouseManager instance.
 * @returns {object}  The resolved config object.
 */
export function readConfig(manager) {
    const useGmCursor = game.settings.get(MODULE_ID, 'useGmCursor');

    const config = {
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
        const gmConfig = manager._gmConfig || readBroadcastConfig();
        if (gmConfig && Object.keys(gmConfig).length > 0) {
            for (const key of BROADCAST_KEYS) {
                if (key in gmConfig) {
                    config[key] = gmConfig[key];
                }
            }
        }
        config.useGmCursor = true;
    }

    return config;
}

/**
 * Snapshot the GM's current broadcastable settings.
 * @returns {object}  Plain object of BROADCAST_KEYS values.
 */
export function getBroadcastSnapshot() {
    const config = {};
    for (const key of BROADCAST_KEYS) {
        config[key] = game.settings.get(MODULE_ID, key);
    }
    return config;
}

/**
 * Read the persisted GM broadcast config (JSON string since 1.4.0).
 * Best-effort migration for pre-1.4.0 Object-type values.
 * @returns {object}  The broadcast config object (empty object on failure).
 */
export function readBroadcastConfig() {
    try {
        const raw = game.settings.get(MODULE_ID, 'gmBroadcastConfig');
        if (!raw) return {};
        if (typeof raw === 'string') return JSON.parse(raw);
        if (typeof raw === 'object') {
            // Legacy Object-type value (pre-1.4.0): migrate it to a JSON string.
            // Writing world-scope settings requires GM permission, so best-effort only.
            try {
                const json = JSON.stringify(raw);
                game.settings.set(MODULE_ID, 'gmBroadcastConfig', json).catch(() => {});
            } catch (e) {
                // Ignore: the legacy value remains usable for this session.
            }
            return raw;
        }
    } catch (e) {
        console.warn('More Color Mouse | Failed to read broadcast config:', e);
    }
    return {};
}
