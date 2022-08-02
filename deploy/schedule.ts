import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {Minter, Stone, VestingStone} from "../types";
import {doTransaction} from "./utils";
import {BigNumber} from "ethers";

const deployFunction: DeployFunction = async function ({
                                                         deployments,
                                                         getNamedAccounts,
                                                         ethers,
                                                       }: HardhatRuntimeEnvironment) {
  const {
    deployer,
    team,
    investor0,
    investor1,
    investor2,
    marketing,
    treasury
  } = await getNamedAccounts();

  const stone = (await ethers.getContract('Stone')) as Stone;
  const vestingStone = (await ethers.getContract('VestingStone')) as VestingStone;

  const vestingSchedule = [
    Date.UTC(2022, 11, 18),

    Date.UTC(2023, 2, 18),
    Date.UTC(2023, 5, 18),
    Date.UTC(2023, 8, 18),
    Date.UTC(2023, 11, 18),

    Date.UTC(2024, 2, 18),
    Date.UTC(2024, 5, 18),
    Date.UTC(2024, 8, 18),
    Date.UTC(2024, 11, 18),

    Date.UTC(2025, 2, 18),
    Date.UTC(2025, 5, 18),
    Date.UTC(2025, 8, 18),
    Date.UTC(2025, 11, 18),

    Date.UTC(2026, 2, 18),
    Date.UTC(2026, 5, 18),
    Date.UTC(2026, 8, 18),
  ].map(e=> BigNumber.from(Math.floor(e / 1000)))


  // first approve All
  await doTransaction(
      stone.approve(vestingStone.address, ethers.constants.MaxInt256)
  );

  // distribute to Marketing & Treasury
  const marketingAmount = ethers.utils.parseEther('500000');
  const treasuryAmount = ethers.utils.parseEther('6300000');
  await doTransaction(
      vestingStone.grantOption(
          marketing,
          marketingAmount,
          vestingSchedule[0]
      )
  )

  await doTransaction(
      vestingStone.grantOption(
          treasury,
          treasuryAmount.div(vestingSchedule.length),
          vestingSchedule[0]
      )
  )

  // distribute to Team & Investors
  const teamAmount = ethers.utils.parseEther('1020000');
  const investor0Amount = ethers.utils.parseEther('680000');
  const investor1Amount = ethers.utils.parseEther('1000000');
  const investor2Amount = ethers.utils.parseEther('500000');

  let N = vestingSchedule.length - 1;
  for (let i = 1; i < vestingSchedule.length; i++) {
    // Team & Investor are offered the same vesting conditions
    const expirationTime = vestingSchedule[i];

    await doTransaction(
        vestingStone.grantOption(
          team,
          teamAmount.div(N),
          expirationTime
        )
    );

    await doTransaction(
        vestingStone.grantOption(
            investor0,
            investor0Amount.div(N),
            expirationTime
        )
    );

    await doTransaction(
        vestingStone.grantOption(
            investor1,
            investor1Amount.div(N),
            expirationTime
        )
    );

    await doTransaction(
        vestingStone.grantOption(
            investor2,
            investor2Amount.div(N),
            expirationTime
        )
    );

    // vesting treasury starts from 3M
    await doTransaction(
        vestingStone.grantOption(
            treasury,
            treasuryAmount.div(N+1),
            expirationTime
        )
    );
  }
  const { deploy } = deployments;
  await deploy('Minter', {
    from:deployer,
    log:true,
    args:[
        stone.address,
        treasury,
        vestingSchedule[vestingSchedule.length-1]
    ]
  });
};

export default deployFunction;

deployFunction.dependencies = ['vestingStone'];

deployFunction.tags = ["schedule"];
