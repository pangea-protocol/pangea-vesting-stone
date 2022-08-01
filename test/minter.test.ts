import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import chai, { expect } from "chai";
import {FakeContract, smock} from "@defi-wonderland/smock";
import {INotifyMint, Minter, Stone} from "../types";

chai.use(smock.matchers);

describe.only("Minter", function () {

  let _snapshotId: string;
  let snapshotId: string;

  let deployer: SignerWithAddress;
  let treasury: SignerWithAddress;
  let treasuryContract: FakeContract<INotifyMint>;

  let minter: Minter;
  let stone: Stone;

  before(async () => {
    _snapshotId = await ethers.provider.send("evm_snapshot", []);

    // ======== SIGNER ==========
    [deployer, treasury] = await ethers.getSigners();

    // ======== CONTRACTS ==========
    const Stone = await ethers.getContractFactory('Stone')
    stone = await Stone.deploy() as Stone;

    const Minter = await ethers.getContractFactory("Minter");
    minter = await Minter.deploy() as Minter;

    treasuryContract = await smock.fake<INotifyMint>("INotifyMint");

    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  afterEach(async () => {
    await network.provider.send("evm_revert", [snapshotId]);
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  after(async () => {
    await network.provider.send("evm_revert", [_snapshotId]);
    _snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  async function setNextTimeStamp(currentTime: number) {
    await ethers.provider.send("evm_setNextBlockTimestamp", [currentTime]);
    await ethers.provider.send("evm_mine", []);
  }

  describe("# initialize", async () => {

    it("revert stone == address(0)", async () => {
      const {timestamp} = await ethers.provider.getBlock('latest');

      await expect(minter.initialize(
          ethers.constants.AddressZero,
          treasury.address,
          timestamp + 100
          )).to.be.reverted;
    })

    it("revert treasury == address(0)", async () => {
      const {timestamp} = await ethers.provider.getBlock('latest');

      await expect(minter.initialize(
          stone.address,
          ethers.constants.AddressZero,
          timestamp + 100
      )).to.be.reverted;
    })

    it("revert epochStartTime <= block.timestamp", async () => {
      const {timestamp} = await ethers.provider.getBlock('latest');

      await expect(minter.initialize(
          stone.address,
          treasury.address,
          timestamp - 100
      )).to.be.reverted;
    })

    it("initialize success", async () => {
      const {timestamp} = await ethers.provider.getBlock('latest');

      await expect(minter.initialize(
          stone.address,
          treasury.address,
          timestamp + 100
      )).to.be.not.reverted;
    })
  })

  describe("# mintStone", async () => {

    let epochStartTime: number;

    beforeEach("initialize", async () => {
      const {timestamp} = await ethers.provider.getBlock('latest');
      epochStartTime = timestamp + 3600;

      await minter.initialize(
          stone.address,
          treasury.address,
          epochStartTime
      );

      // migrate Minter role
      await stone.setMinter(minter.address);
    })

    it("revert mintStone before epoch end", async () => {
      await expect(minter.mintStone()).to.be.reverted;
    })

    it("mintStone after epoch end", async () => {
      // after end
      const newEpochStartTime = epochStartTime + 3600 * 24 * 90;
      await setNextTimeStamp(newEpochStartTime);

      await minter.mintStone();

      expect(await stone.balanceOf(treasury.address)).to.be.eq(ethers.utils.parseEther("50000"));
      expect(await minter.epochStartTime()).to.be.eq(newEpochStartTime);
    })

    it("mintStone twice", async () => {
      // after end
      epochStartTime = epochStartTime + 3600 * 24 * 90;
      await setNextTimeStamp(epochStartTime);
      await minter.mintStone();

      epochStartTime = epochStartTime + 3600 * 24 * 90;
      await setNextTimeStamp(epochStartTime);
      await minter.mintStone();

      expect(await stone.balanceOf(treasury.address)).to.be.eq(ethers.utils.parseEther("100250"));
      expect(await minter.epochStartTime()).to.be.eq(epochStartTime);
    })

    it("mintStone for contract", async () => {
      await minter.setTreasury(treasuryContract.address);
      treasuryContract.notifyMint.returns(true);

      epochStartTime = epochStartTime + 3600 * 24 * 90;
      await setNextTimeStamp(epochStartTime);
      await minter.mintStone();

      expect(await stone.balanceOf(treasuryContract.address)).to.be.eq(ethers.utils.parseEther("50000"));
      expect(treasuryContract.notifyMint).to.be.calledWith(ethers.utils.parseEther('50000'));
      expect(await minter.epochStartTime()).to.be.eq(epochStartTime);
    })

    it("revert case : notifyMint returns False ", async () => {
      await minter.setTreasury(treasuryContract.address);
      treasuryContract.notifyMint.returns(false);

      epochStartTime = epochStartTime + 3600 * 24 * 90;
      await setNextTimeStamp(epochStartTime);
      await expect(minter.mintStone()).to.be.reverted;
    })
  })
});
