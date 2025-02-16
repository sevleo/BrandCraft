module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended', // For Vue 3
    // 'plugin:vue/recommended',   // For Vue 2
    '@vue/eslint-config-prettier',
  ],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': ['error'],
  },
};
