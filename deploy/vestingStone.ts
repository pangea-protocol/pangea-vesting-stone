import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {Stone, VestingStone} from "../types";
import {BigNumber} from "ethers";

const deployFunction: DeployFunction = async function ({
                                                         deployments,
                                                         getNamedAccounts,
                                                         ethers,
                                                       }: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const stone = (await ethers.getContract('Stone')) as Stone;

  const {address} = await deploy('StoneImage',{
    from:deployer
  });

  await deploy('VestingStone', {
    from:deployer,
    args:[stone.address],
    log:true,
    gasPrice: BigNumber.from("250000000000"),
    libraries: {
      StoneImage: address
    }
  });
};

export default deployFunction;

deployFunction.dependencies = ['stone'];

deployFunction.tags = ["vestingStone"];
