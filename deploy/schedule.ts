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
    // 2022-11-18
    Date.UTC(2022, 10, 18),

    // 2023-02-18
    Date.UTC(2023, 1, 18),
    Date.UTC(2023, 4, 18),
    Date.UTC(2023, 7, 18),
    Date.UTC(2023, 10, 18),

    // 2024-02-18
    Date.UTC(2024, 1, 18),
    Date.UTC(2024, 4, 18),
    Date.UTC(2024, 7, 18),
    Date.UTC(2024, 10, 18),

    // 2025-02-18
    Date.UTC(2025, 1, 18),
    Date.UTC(2025, 4, 18),
    Date.UTC(2025, 7, 18),
    Date.UTC(2025, 10, 18),

    // 2026-02-18
    Date.UTC(2026, 1, 18),
    Date.UTC(2026, 4, 18),
    Date.UTC(2026, 7, 18),
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
          i == N ? teamAmount.sub(teamAmount.div(N).mul(N-1)) : teamAmount.div(N),
          expirationTime
        )
    );

    await doTransaction(
        vestingStone.grantOption(
            investor0,
            i == N ? investor0Amount.sub(investor0Amount.div(N).mul(N-1)) : investor0Amount.div(N),
            expirationTime
        )
    );

    await doTransaction(
        vestingStone.grantOption(
            investor1,
            i == N ? investor1Amount.sub(investor1Amount.div(N).mul(N-1)) : investor1Amount.div(N),
            expirationTime
        )
    );

    await doTransaction(
        vestingStone.grantOption(
            investor2,
            i == N ? investor2Amount.sub(investor2Amount.div(N).mul(N-1)) : investor2Amount.div(N),
            expirationTime
        )
    );

    // vesting treasury starts from 3M
    await doTransaction(
        vestingStone.grantOption(
            treasury,
            i == N ? treasuryAmount.sub(treasuryAmount.div(N+1).mul(N)) : treasuryAmount.div(N+1),
            expirationTime
        )
    );
  }
  const { deploy } = deployments;
  const {address:minterAddress} = await deploy('Minter', {
    from:deployer,
    log:true,
    args:[
        stone.address,
        treasury,
        vestingSchedule[vestingSchedule.length-1]
    ]
  });

  await doTransaction(
      stone.transferOwnership(minterAddress)
  );
};

export default deployFunction;

deployFunction.dependencies = ['vestingStone'];

deployFunction.tags = ["schedule"];
