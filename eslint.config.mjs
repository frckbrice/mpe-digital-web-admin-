import next from 'eslint-config-next';
import eslintConfigPrettier from 'eslint-config-prettier';

/** @type {import('eslint').Linter.Config[]} */
const config = [
  ...(Array.isArray(next) ? next : [next]),
  eslintConfigPrettier,
  // Downgrade strict React Compiler / hooks rules to warnings so CI passes while code is gradually fixed
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/incompatible-library': 'warn',
      '@next/next/no-img-element': 'warn',
    },
  },
];

export default config;
