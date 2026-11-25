import expoConfig from 'eslint-config-expo/flat.js';

export default [
  ...expoConfig,
  {
    ignores: [
      'dist/**',
      '.expo/**',
      'node_modules/**',
      'babel.config.js',
      'metro.config.js',
      'tailwind.config.js',
    ],
  },
];
