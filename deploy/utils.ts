import {ContractTransaction} from "ethers";
import {DeployFunction} from "hardhat-deploy/types";
import {HardhatRuntimeEnvironment} from "hardhat/types";

export async function doTransaction(transaction: Promise<ContractTransaction>) {
  const tx = await transaction;
  const hre = require("hardhat")
  const chainId = await hre.getChainId();
  if (chainId === '31337' || chainId === '203') {
    return;
  }

  const receipt = await tx.wait()
  console.log(`tx : ${receipt.transactionHash} | gasUsed : ${receipt.gasUsed}`)
}


const deployFunction: DeployFunction = async function ({}: HardhatRuntimeEnvironment) {};

export default deployFunction;
