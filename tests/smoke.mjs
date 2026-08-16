/**
 * Zero-dependency smoke test: boot the module with mocked Foundry APIs
 * and make sure init / ready / animation / socket paths don't throw.
 *
 * Run with: node tests/smoke.mjs
 */
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// Mock canvas context: records every method call so we can assert drawing.
// ---------------------------------------------------------------------------
const ctxCalls = [];
const ctxStub = new Proxy({}, {
    get(target, prop) {
        if (prop in target) return target[prop];
        if (typeof prop === 'string') {
            target[prop] = (...args) => { ctxCalls.push(prop); };
        }
        return target[prop];
    },
    set(target, prop, value) {
        target[prop] = value;
        return true;
    }
});

const canvasStub = {
    id: '',
    width: 0,
    height: 0,
    style: {},
    getContext: () => ctxStub
};

// ---------------------------------------------------------------------------
// Mock DOM
// ---------------------------------------------------------------------------
const makeClassList = () => ({ add: () => {}, remove: () => {} });

const documentStub = {
    documentElement: { classList: makeClassList() },
    body: {
        classList: makeClassList(),
        appendChild: (node) => { appended.push(node); }
    },
    createElement: (tag) => {
        if (tag === 'canvas') return canvasStub;
        return { style: {}, addEventListener: () => {}, appendChild: () => {} };
    },
    addEventListener: () => {}
};
const appended = [];
globalThis.document = documentStub;

class ImageStub {
    set src(_v) { /* images never auto-load in the smoke test */ }
}
globalThis.Image = ImageStub;

// ---------------------------------------------------------------------------
// Mock window / rAF
// ---------------------------------------------------------------------------
const windowListeners = new Map();
const windowStub = {
    innerWidth: 1920,
    innerHeight: 1080,
    devicePixelRatio: 1,
    addEventListener: (type, fn) => {
        if (!windowListeners.has(type)) windowListeners.set(type, []);
        windowListeners.get(type).push(fn);
    }
};
globalThis.window = windowStub;

let rafQueue = []; // { id, cb }
let rafId = 0;
globalThis.requestAnimationFrame = (cb) => {
    const id = ++rafId;
    rafQueue.push({ id, cb });
    return id;
};
globalThis.cancelAnimationFrame = (id) => {
    const idx = rafQueue.findIndex((e) => e.id === id);
    if (idx >= 0) rafQueue.splice(idx, 1);
};

// ---------------------------------------------------------------------------
// Mock Foundry
// ---------------------------------------------------------------------------
const settingsStore = new Map();     // "ns.key" -> value
const onChangeHandlers = new Map();   // "ns.key" -> handler
const registeredSettings = new Map(); // "ns.key" -> registration data
const socketHandlers = new Map();

const gameStub = {
    settings: {
        register(ns, key, data) {
            const full = `${ns}.${key}`;
            registeredSettings.set(full, data);
            if (!settingsStore.has(full)) settingsStore.set(full, data.default);
            if (data.onChange) onChangeHandlers.set(full, data.onChange);
        },
        get(ns, key) {
            return settingsStore.get(`${ns}.${key}`);
        },
        set(ns, key, value) {
            settingsStore.set(`${ns}.${key}`, value);
            return Promise.resolve(value);
        }
    },
    socket: {
        on: (event, handler) => { socketHandlers.set(event, handler); },
        emit: () => Promise.resolve(1)
    },
    i18n: { localize: (k) => k },
    user: { id: 'smokeUser', isGM: true }
};
globalThis.game = gameStub;

globalThis.ui = { notifications: { info: () => {}, error: () => {} } };

// ---------------------------------------------------------------------------
// Mock Hooks
// ---------------------------------------------------------------------------
const hookRegistry = new Map();
globalThis.Hooks = {
    once: (name, fn) => {
        if (!hookRegistry.has(name)) hookRegistry.set(name, []);
        hookRegistry.get(name).push({ once: true, fn });
    },
    on: (name, fn) => {
        if (!hookRegistry.has(name)) hookRegistry.set(name, []);
        hookRegistry.get(name).push({ once: false, fn });
    },
    call: (name, ...args) => {
        const list = hookRegistry.get(name) || [];
        for (const entry of [...list]) {
            entry.fn(...args);
            if (entry.once) list.splice(list.indexOf(entry), 1);
        }
    }
};

const stepFrame = (ts) => {
    const entry = rafQueue.shift();
    if (!entry) throw new Error('No animation frame scheduled');
    entry.cb(ts);
};

// ---------------------------------------------------------------------------
// Boot the module
// ---------------------------------------------------------------------------
await import('../scripts/main.js');

Hooks.call('init');
assert.ok(registeredSettings.size >= 14, 'settings registered');
assert.ok(registeredSettings.has('more-color-mouse.gmBroadcastConfig'), 'broadcast setting registered');
assert.equal(registeredSettings.get('more-color-mouse.gmBroadcastConfig').type, String, 'broadcast stored as String');

Hooks.call('ready');

// Canvas was created and appended, sized with DPR.
assert.equal(appended.length, 1, 'canvas appended to body');
assert.equal(canvasStub.width, 1920, 'canvas width matches window * dpr');
assert.equal(canvasStub.height, 1080, 'canvas height matches window * dpr');

// Simulate mouse movement and a few animation frames (simple trail default).
for (const fn of windowListeners.get('mousemove') || []) {
    fn({ clientX: 300, clientY: 200 });
}
for (let i = 0; i < 5; i++) stepFrame(i * 16.7);
assert.ok(ctxCalls.includes('clearRect'), 'frames cleared the canvas');
assert.ok(ctxCalls.includes('fill'), 'cursor was drawn');
assert.ok(ctxCalls.includes('stroke'), 'simple trail was drawn');

// Switch to particles: settings change triggers updateConfig via onChange.
settingsStore.set('more-color-mouse.trailStyle', 'particles');
onChangeHandlers.get('more-color-mouse.trailStyle')();
for (const fn of windowListeners.get('mousemove') || []) {
    fn({ clientX: 320, clientY: 220 });
}
const beforeParticles = ctxCalls.length;
for (let i = 0; i < 5; i++) stepFrame(500 + i * 16.7);
assert.ok(ctxCalls.length > beforeParticles, 'particles produced draw calls');

// Switch to "none" (no trail): should still render the cursor without errors.
settingsStore.set('more-color-mouse.trailStyle', 'none');
onChangeHandlers.get('more-color-mouse.trailStyle')();
for (let i = 0; i < 3; i++) stepFrame(600 + i * 16.7);
assert.ok(ctxCalls.includes('fill'), 'cursor still drawn with no trail');

// GM broadcast: a foreign userId should trigger a config refresh.
settingsStore.set('more-color-mouse.useGmCursor', true);
onChangeHandlers.get('more-color-mouse.useGmCursor')();
const socketHandler = socketHandlers.get('module.more-color-mouse');
assert.ok(socketHandler, 'socket handler registered');
socketHandler(
    { type: 'gmBroadcast', config: { enable: true, trailStyle: 'dots', trailLength: 10 } },
    'otherUser'
);
assert.equal(settingsStore.get('more-color-mouse.trailStyle'), 'none', 'local setting untouched by broadcast');
for (let i = 0; i < 3; i++) stepFrame(700 + i * 16.7);

// Disable the module: animation loop must stop and canvas hide.
// (Stop following the GM first, otherwise the broadcasted enable:true wins.)
settingsStore.set('more-color-mouse.useGmCursor', false);
onChangeHandlers.get('more-color-mouse.useGmCursor')();
settingsStore.set('more-color-mouse.enable', false);
onChangeHandlers.get('more-color-mouse.enable')();
const queueAfterDisable = rafQueue.length;
assert.equal(queueAfterDisable, 0, 'no frame scheduled while disabled');

console.log('Smoke test passed ✓');
