import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {Stone, VestingStone} from "../types";
import {BigNumber} from "ethers";

const deployFunction: DeployFunction = async function ({
                                                         deployments,
                                                         getNamedAccounts,
                                                         ethers,
                                                         network
                                                       }: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const stone = (await ethers.getContract('Stone')) as Stone;

  if (network.name == 'baobab') {
    await deploy('CirculatingInfo', {
      from:deployer,
      args:[
          "0x816BE2E0594D7cFF6a745591E72BB7397F272385",
          "0x42Be93d262FdfB9F3FAa3eA028CB99f5A73F78bc",
          "0x44021d0f12b3f8902e0fe59c988736632b04059e",
          "0xF987965CEeE049a9f97fd0198d2D7D6BED3cE295"
      ],
      log:true,
      gasPrice: BigNumber.from("250000000000")
    });
  } else if (network.name == 'cypress') {
    await deploy('CirculatingInfo', {
      from:deployer,
      args:[
        "0xB49E754228bc716129E63b1a7b0b6cf27299979e",
        "0xa3A842fb8c9e1E9700a8A85348dECe08f0cBe3C4",
        "0x44021d0f12b3f8902e0fe59c988736632b04059e",
        "0xde9A09ceFF3C71b7dB80A13508D6088E50f5572c"
      ],
      log:true,
      gasPrice: BigNumber.from("250000000000")
    });
  }

};

export default deployFunction;

deployFunction.tags = ["circulatingInfo"];
