import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = [
  {
    ignores: [
      '.next/**',
      'out/**',
      'node_modules/**',
      'backups/**',
      'lib/vendor/**',
    ],
  },
  ...nextCoreWebVitals,
  {
    rules: {
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];

export default eslintConfig;
