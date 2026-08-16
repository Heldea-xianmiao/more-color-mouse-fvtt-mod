export const MODULE_ID = 'more-color-mouse';

/**
 * Client settings that the GM may broadcast to players.
 * Order is kept stable so that broadcast snapshots stay comparable.
 */
export const BROADCAST_KEYS = [
    'enable', 'hideSystemCursor', 'trailLength', 'cursorShape',
    'cursorImage', 'cursorSize', 'rainbowMode', 'baseColor',
    'trailColor', 'trailImage', 'trailStyle', 'particlePreset'
];
