import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**'] },

  // TypeScript: typescript-eslint recommended (incl. @typescript-eslint/no-explicit-any)
  ...tseslint.configs.recommended,

  // Vue 3 correctness rules (vue-eslint-parser for .vue)
  ...pluginVue.configs['flat/essential'],

  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
    },
  },

  {
    files: ['**/*.{ts,vue}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // Not shipped by any eslint-plugin-vue preset — enable explicitly.
      'vue/html-button-has-type': 'error',
    },
  },
)
