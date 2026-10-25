// Lint: the TV runtime is ES5 (it must run on old WebViews); Node tooling is modern.
import js from '@eslint/js';
import globals from 'globals';

const recommended = js.configs.recommended.rules;

export default [
  { ignores: ['node_modules/', 'dist/', '.local/', 'android/**/build/', 'app/assets/**/*.js', 'site/app/sw.js'] },
  {
    // Interface and phone companion: ES5, run as classic scripts in a browser.
    files: ['app/**/*.js', 'android/app/src/main/assets-android/companion/**/*.js', 'site/app/**/*.js'],
    languageOptions: { ecmaVersion: 5, sourceType: 'script', globals: { ...globals.browser, FrameDevice: 'readonly', CleanFrameAndroid: 'readonly', CleanFrameI18n: 'writable', CleanFrameWeather: 'readonly', Promise: 'readonly', Intl: 'readonly', tizen: 'readonly' } },
    rules: { ...recommended, 'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }], 'no-empty': ['error', { allowEmptyCatch: true }], 'no-redeclare': 'warn', 'no-prototype-builtins': 'off', 'no-useless-escape': 'off', 'no-control-regex': 'off' },
  },
  {
    // Add-ons run inside main.js's scope (see app/addons/AGENTS.md), so its names are not defined here.
    files: ['app/addons/*.js'],
    rules: { 'no-undef': 'off', 'no-unused-vars': 'off' },
  },
  {
    // Service workers.
    files: ['android/app/src/main/assets-android/companion/sw.js', 'site/app/sw.js'],
    languageOptions: { ecmaVersion: 2017, sourceType: 'script', globals: globals.serviceworker },
  },
  {
    // Node tooling.
    files: ['scripts/**/*.mjs', 'eslint.config.mjs'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: { ...globals.node, ...globals.browser, ShoreQA: 'readonly', __tv: 'readonly', __failWrites: 'writable', __setHidden: 'readonly', CleanFrameWallpapers: 'readonly' } },
    rules: { ...recommended, 'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }], 'no-empty': ['error', { allowEmptyCatch: true }] },
  },
];
