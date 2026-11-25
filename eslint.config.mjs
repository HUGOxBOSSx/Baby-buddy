import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export const basePackageLintConfig = tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);

export default basePackageLintConfig;
