/**
 * Patches nativewind/babel.js and react-native-css-interop/babel.js to remove
 * the "react-native-worklets/plugin" entry which requires reanimated v4+.
 * We use reanimated v3, so this plugin does not exist and causes build failures.
 */
const fs = require('fs');
const path = require('path');

const targets = [
  'node_modules/nativewind/babel.js',
  'node_modules/react-native-css-interop/babel.js',
];

for (const rel of targets) {
  const p = path.resolve(__dirname, '..', rel);
  if (!fs.existsSync(p)) continue;
  const original = fs.readFileSync(p, 'utf8');
  const patched = original
    .replace(/\s*\/\/ Use this plugin in reanimated 4 and later\n\s*"react-native-worklets\/plugin",?/g, '')
    .replace(/"react-native-worklets\/plugin",?\s*/g, '');
  if (original !== patched) {
    fs.writeFileSync(p, patched);
    console.log('patched:', rel);
  }
}
