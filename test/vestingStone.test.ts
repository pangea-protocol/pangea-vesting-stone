import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import chai, { expect } from "chai";
import { smock } from "@defi-wonderland/smock";
import {Stone, VestingStone} from "../types";
import {BigNumberish} from "ethers";
chai.use(smock.matchers);

describe("Vesting Stone", function () {

  let _snapshotId: string;
  let snapshotId: string;

  let deployer: SignerWithAddress;
  let manager: SignerWithAddress;
  let user0: SignerWithAddress;
  let user1: SignerWithAddress;

  let vestingStone: VestingStone;
  let stone: Stone;

  before(async () => {
    _snapshotId = await ethers.provider.send("evm_snapshot", []);

    // ======== SIGNER ==========
    [deployer, manager, user0, user1] = await ethers.getSigners();

    // ======== CONTRACTS ==========
    const Stone = await ethers.getContractFactory('Stone')
    stone = await Stone.deploy() as Stone;

    const StoneImage = await ethers.getContractFactory("StoneImage");
    const image = await StoneImage.deploy();

    const VestingStone = await ethers.getContractFactory("VestingStone", {libraries:{StoneImage: image.address}});
    vestingStone = await VestingStone.deploy(stone.address) as VestingStone;

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


  describe("# grantOption", async () => {
    it ("revert case) amount is zero", async () => {
      const block = await ethers.provider.getBlock('latest');
      await stone.approve(vestingStone.address, ethers.utils.parseEther('1000'));

      await expect(
          vestingStone.grantOption(user0.address, ethers.utils.parseEther('0'), block.timestamp + 1000)
      ).to.be.reverted;
    })

    it("revert case) expirationTime is less than block.timestamp", async() => {
      const block = await ethers.provider.getBlock('latest');
      await stone.approve(vestingStone.address, ethers.utils.parseEther('1000'));

      await expect(
          vestingStone.grantOption(user0.address, ethers.utils.parseEther('1000'), block.timestamp - 1000)
      ).to.be.reverted;
    })

    it("revert case) not approved", async () => {
      const block = await ethers.provider.getBlock('latest');

      await expect(
          vestingStone.grantOption(user0.address, ethers.utils.parseEther('1000'), block.timestamp + 1000)
      ).to.be.reverted;
    })

    it("revert case) to is zeroAddress", async () => {
      const block = await ethers.provider.getBlock('latest');
      await stone.approve(vestingStone.address, ethers.utils.parseEther('1000'));

      await expect(
          vestingStone.grantOption(ethers.constants.AddressZero, ethers.utils.parseEther('1000'), block.timestamp + 1000)
      ).to.be.reverted;
    })

    it("mint one VestingOption NFT", async () => {
      const givenAmount = ethers.utils.parseEther('1000');
      const block = await ethers.provider.getBlock('latest');
      const givenExpirationTime = block.timestamp + 1000;
      await stone.approve(vestingStone.address, givenAmount);

      await vestingStone.grantOption(user0.address, givenAmount, givenExpirationTime);
      const currBlock = await ethers.provider.getBlock('latest');

      const tokenId = await vestingStone.tokenOfOwnerByIndex(user0.address,0);
      const option = await vestingStone.option(tokenId);

      expect(option.amount).to.be.eq(givenAmount);
      expect(option.creationTime).to.be.eq(currBlock.timestamp);
      expect(option.expirationTime).to.be.eq(givenExpirationTime);
    })
  })

  describe("# exerciseOption", async () => {
    let givenAmount = ethers.utils.parseEther('1000')
    let givenExpirationTime:number;

    beforeEach("grantOption", async () => {
      const block = await ethers.provider.getBlock('latest');
      givenExpirationTime = block.timestamp + 1000;
      await stone.approve(vestingStone.address, givenAmount);

      await vestingStone.grantOption(user0.address, givenAmount, givenExpirationTime);
    })

    it("revert case) not owner call other's vesting Option", async () => {
      const tokenId = await vestingStone.tokenOfOwnerByIndex(user0.address,0);

      await setNextTimeStamp(givenExpirationTime);

      await expect(vestingStone.connect(user1).exerciseOption(user1.address, tokenId))
    })

    it("revert case) not expired", async () => {
      const tokenId = await vestingStone.tokenOfOwnerByIndex(user0.address,0);

      await expect(vestingStone.connect(user0).exerciseOption(user0.address, tokenId))
    })

    it("revert case) to is zeroAddress", async () => {
      const tokenId = await vestingStone.tokenOfOwnerByIndex(user0.address,0);

      await setNextTimeStamp(givenExpirationTime);

      await expect(vestingStone.connect(user0).exerciseOption(ethers.constants.AddressZero, tokenId))
    })

    it("burn VestingOption NFT", async () => {
      const tokenId = await vestingStone.tokenOfOwnerByIndex(user0.address,0);

      await setNextTimeStamp(givenExpirationTime);

      expect(await vestingStone.connect(user0).exerciseOption(user0.address, tokenId))

      expect(await stone.balanceOf(user0.address)).to.be.eq(givenAmount)
      expect(await vestingStone.balanceOf(user0.address)).to.be.eq(0)
    })

    it("burn VestingOption NFT and transfer option amount", async () => {
      const tokenId = await vestingStone.tokenOfOwnerByIndex(user0.address,0);

      await setNextTimeStamp(givenExpirationTime);

      expect(await vestingStone.connect(user0).exerciseOption(user1.address, tokenId))

      expect(await vestingStone.balanceOf(user0.address)).to.be.eq(0)

      expect(await stone.balanceOf(user1.address)).to.be.eq(givenAmount);
    })
  })

  describe("# splitOption", async () => {
    let givenAmount = ethers.utils.parseEther('1000')
    let givenExpirationTime:number;
    let tokenId: BigNumberish;

    beforeEach("grantOption", async () => {
      const block = await ethers.provider.getBlock('latest');
      givenExpirationTime = block.timestamp + 1000;
      await stone.approve(vestingStone.address, givenAmount);

      await vestingStone.grantOption(user0.address, givenAmount, givenExpirationTime);

      tokenId = await vestingStone.tokenOfOwnerByIndex(user0.address, 0);
    })

    it("revert case) not Allowed owner", async () => {
      await expect(vestingStone.connect(user1).splitOption(user0.address,tokenId, givenAmount.sub(1))).to.be.reverted
    })

    it("revert case) to is zeroAddress", async () => {
      await expect(vestingStone.connect(user0).splitOption(ethers.constants.AddressZero, tokenId, givenAmount.sub(1))).to.be.reverted
    })

    it("revert case) amount is zero", async () => {
      await expect(vestingStone.connect(user0).splitOption(user0.address, tokenId, ethers.constants.Zero)).to.be.reverted
    })

    it("revert case) amount is less than option Id's balance", async () => {
      await expect(vestingStone.connect(user0).splitOption(user0.address, tokenId, givenAmount)).to.be.reverted
    })

    it("split VestingOption NFT", async () => {
      const splitAmount = givenAmount.div(3);

      await vestingStone.connect(user0).splitOption(user1.address, tokenId, splitAmount);

      const newTokenId = await vestingStone.tokenOfOwnerByIndex(user1.address, 0);

      const originOption = await vestingStone.option(tokenId);
      const newOption = await vestingStone.option(newTokenId);
      expect(originOption.amount).to.be.eq(givenAmount.sub(splitAmount));
      expect(originOption.expirationTime).to.be.eq(givenExpirationTime);

      expect(newOption.amount).to.be.eq(splitAmount);
      expect(newOption.expirationTime).to.be.eq(givenExpirationTime);
    })
  })

  describe("# mergeOption", async () => {
    let given0Amount = ethers.utils.parseEther('1000')
    let given1Amount = ethers.utils.parseEther('3000')
    let givenExpirationTime0:number;
    let givenExpirationTime1:number;
    let token0Id: BigNumberish;
    let token1Id: BigNumberish;

    beforeEach("grantOption", async () => {
      const block = await ethers.provider.getBlock('latest');
      givenExpirationTime0 = block.timestamp + 1000;
      givenExpirationTime1 = block.timestamp + 5000;
      await stone.approve(vestingStone.address, given0Amount.add(given1Amount));

      await vestingStone.grantOption(user0.address, given0Amount, givenExpirationTime0);
      await vestingStone.grantOption(user1.address, given1Amount, givenExpirationTime1);

      token0Id = await vestingStone.tokenOfOwnerByIndex(user0.address, 0);
      token1Id = await vestingStone.tokenOfOwnerByIndex(user1.address, 0);
    })

    it("revert case) fromOptionId is not allowed", async () => {
      await expect(vestingStone.connect(manager).mergeOption(user1.address, token0Id, token1Id)).to.be.reverted
    })

    it("revert case) toOptionId is not allowed", async () => {
      await vestingStone.connect(user0).approve(manager.address, token0Id);

      await expect(vestingStone.connect(manager).mergeOption(user1.address, token0Id, token1Id)).to.be.reverted
    })

    it("revert case) fromOptionId == toOptionId", async () => {
      await vestingStone.connect(user0).approve(manager.address, token0Id);
      await vestingStone.connect(user1).approve(manager.address, token1Id);

      await expect(vestingStone.connect(manager).mergeOption(user1.address, token0Id, token0Id)).to.be.reverted
    })

    it("revert case) expirationTime of fromOptionId >= expirationTime of toOptionId", async () => {
      await vestingStone.connect(user0).approve(manager.address, token0Id);
      await vestingStone.connect(user1).approve(manager.address, token1Id);

      await expect(vestingStone.connect(manager).mergeOption(user1.address, token1Id, token0Id)).to.be.reverted
    })

    it("revert case) to is zeroAddress", async () => {
      await vestingStone.connect(user0).approve(manager.address, token0Id);
      await vestingStone.connect(user1).approve(manager.address, token1Id);

      await expect(vestingStone.connect(manager).mergeOption(ethers.constants.AddressZero, token0Id, token1Id)).to.be.reverted
    })

    it("merge VestingOption NFT", async () => {
      await vestingStone.connect(user0).approve(manager.address, token0Id);
      await vestingStone.connect(user1).approve(manager.address, token1Id);

      await vestingStone.connect(manager).mergeOption(user1.address, token0Id, token1Id)

      expect(await vestingStone.balanceOf(user1.address)).to.be.eq(1)
      expect(await vestingStone.balanceOf(user0.address)).to.be.eq(0)

      const option = await vestingStone.option(token1Id);
      expect(option.amount).to.be.eq(given1Amount.add(given0Amount))
      expect(option.expirationTime).to.be.eq(givenExpirationTime1)
    })
  })
});
