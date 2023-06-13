import { ethers } from "hardhat";
import "hardhat-deploy";
import "hardhat-deploy-ethers";

// npx hardhat run scripts/deployStaking.ts --network bsc_mainnet
async function main() {
  const tokenAddress = "0xE66A9F115A44cbC5b2606307D7117a6423252d39";
  const adminAddress = "0x0d71a079a389817A832e43129Ba997002f01200a";
  const StakingContract = await ethers.getContractFactory("StakingContract");
  const stakingContract = await StakingContract.deploy(tokenAddress, adminAddress);

  await stakingContract.deployed();

  console.log(`Staking deployed to ${stakingContract.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
