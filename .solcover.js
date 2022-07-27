module.exports = {
  testCommand: "yarn test",
  compileCommand: "yarn build",
  skipFiles: [
    "interfaces",
  ],
  mocha: {
    grep: "@skip-on-coverage",
    invert: true,
  },
};
