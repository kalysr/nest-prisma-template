module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'custom-scope-rule': [2, 'always'],
  },
  plugins: [
    {
      rules: {
        'custom-scope-rule': ({ scope }) => {
          return [/^JIRA-\d+$/.test(scope), `Your scope invalid, example: JIRA-0001`];
        },
      },
    },
  ],
};
