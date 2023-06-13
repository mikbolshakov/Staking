import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "solidity-coverage";
import dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    hardhat: {
      forking: {
        url: `${process.env.BSC_MAINNET}`,
        blockNumber: 17321000,
      },
    },
    bsc_mainnet: {
      url: `${process.env.BSC_MAINNET}`,
      accounts: [<string>process.env.ADMIN_PRIVATE_KEY],
    },
  },
};

export default config;
