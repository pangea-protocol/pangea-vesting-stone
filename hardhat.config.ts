import "dotenv/config";
import "@nomiclabs/hardhat-solhint";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "hardhat-abi-exporter";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-contract-sizer";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "./tasks";

import { HardhatUserConfig } from "hardhat/config";

const accounts = {
  mnemonic: process.env.MNEMONIC || "test test test test test test test test test test test junk",
};

const config: HardhatUserConfig = {
  gasReporter: {
    gasPrice: 250,
    currency: "ETH"
  },
  defaultNetwork: process.env.NETWORK ? process.env.NETWORK : "cypress",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      live: false,
      saveDeployments: true,
      tags: ["test", "local"],
      gasPrice: 250000000000,
      // Solidity-coverage overrides gasPrice to 1 which is not compatible with EIP1559
      hardfork: process.env.CODE_COVERAGE ? "berlin" : "london",
    },
    baobab: {
      chainId: 1001,
      url: "https://public-node-api.klaytnapi.com/v1/baobab",
      accounts,
      gasPrice: 250000000000,
    },
    cypress: {
      chainId: 8217,
      url: "https://public-node-api.klaytnapi.com/v1/cypress",
      accounts,
      gasPrice: 250000000000,
    },
  },
  // NEED TO SET!
  namedAccounts: {
    deployer: {
      default: 0,
      baobab : "0x0000000000000000000000000000000000000000",
      cypress: "0x0000000000000000000000000000000000000000"
    },
    dev: {
      default: 1,
      baobab : "0x0000000000000000000000000000000000000000",
      cypress: "0x0000000000000000000000000000000000000000"
    },
    team: {
      default: 2,
      baobab : "0x0000000000000000000000000000000000000000",
      cypress: "0x0000000000000000000000000000000000000000"
    },
    investor0: {
      default: 3,
      baobab : "0x0000000000000000000000000000000000000000",
      cypress: "0x0000000000000000000000000000000000000000"
    },
    investor1: {
      default: 4,
      baobab : "0x0000000000000000000000000000000000000000",
      cypress: "0x0000000000000000000000000000000000000000"
    },
    investor2: {
      default: 5,
      baobab : "0x0000000000000000000000000000000000000000",
      cypress: "0x0000000000000000000000000000000000000000"
    },
    marketing: {
      default: 6,
      baobab : "0x0000000000000000000000000000000000000000",
      cypress: "0x0000000000000000000000000000000000000000"
    },
    treasury: {
      default: 7,
      baobab : "0x0000000000000000000000000000000000000000",
      cypress: "0x0000000000000000000000000000000000000000"
    },
  },
  paths: {
    artifacts: "artifacts",
    cache: "cache",
    deploy: "deploy",
    deployments: "deployments",
    imports: "imports",
    sources: "contracts",
    tests: "test",
  },
  solidity: {
    compilers: [
      {
        version: "0.8.9",
        settings: {
          optimizer: {
            enabled: true,
            runs: 9999999,
          },
        },
      },
    ],
  },
  typechain: {
    outDir: "types",
    target: "ethers-v5",
  },
  abiExporter: {
    path: "deployments/abis",
    runOnCompile: true,
    clear: true,
    flat: true,
    spacing: 2,
    pretty: false,
  },
  mocha: {
    timeout: 300000,
  },
};

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more
export default config;
