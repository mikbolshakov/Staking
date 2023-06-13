import { ethers } from "hardhat";
import { impersonateAccount } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { StakingContract } from "../typechain-types";
import { Contract } from "ethers";
import usdcAbi from "../scripts/ABI/USDCcontractAbi.json";

const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

describe("StakingContract Test", () => {
  let USDC: Contract;
  let signers: SignerWithAddress[];
  let admin: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let user4: SignerWithAddress;
  let user5: SignerWithAddress;
  let StakingContract: StakingContract;

  before(async () => {
    const mintAmount = ethers.utils.parseUnits("1000000", 6);
    signers = await ethers.getSigners();
    admin = signers[0];
    user1 = signers[1];
    user2 = signers[2];
    user3 = signers[3];
    user4 = signers[6];
    user5 = signers[5];
    USDC = await ethers.getContractAt(usdcAbi, USDC_ADDRESS);
    const usdcOwner = await USDC.owner();

    await impersonateAccount(usdcOwner);
    const usdcOwnerAsSigner = await ethers.getSigner(usdcOwner);
    let tx = {
      to: usdcOwnerAsSigner.address,
      value: ethers.utils.parseEther("1000"),
    };
    const recieptTx = await admin.sendTransaction(tx);
    await recieptTx.wait();

    await USDC.connect(usdcOwnerAsSigner).updateMasterMinter(
      usdcOwnerAsSigner.address
    );
    await USDC.connect(usdcOwnerAsSigner).configureMinter(
      usdcOwnerAsSigner.address,
      ethers.constants.MaxUint256
    );
    await USDC.connect(usdcOwnerAsSigner).mint(admin.address, mintAmount);

    // console.log("Admin balance is %s USDC", await USDC.balanceOf(admin.address));
    expect(await USDC.balanceOf(admin.address)).to.eq(mintAmount);
  });

  it("Deploys, grant role and transfer tokens to a contract", async () => {
    const usdcOnContract = ethers.utils.parseUnits("10000", 6);
    const Factory = await ethers.getContractFactory("StakingContract");
    const stakingContract = await Factory.deploy(USDC_ADDRESS, admin.address);
    expect(stakingContract.address).to.not.eq(ethers.constants.AddressZero);
    StakingContract = stakingContract as StakingContract;

    await stakingContract.grantRole(
      await stakingContract.ADMIN_ROLE(),
      admin.address
    );
    await USDC.transfer(stakingContract.address, usdcOnContract);

    // console.log("USDC balance on contract is %s USDC", await USDC.balanceOf(stakingContract.address));
    expect(await USDC.balanceOf(stakingContract.address)).to.eq(usdcOnContract);
  });

  it("Check Stake reverts and tests setToken function", async () => {
    const stakeAmount = ethers.utils.parseUnits("100", 6);

    await expect(
      StakingContract.connect(user1).stake(user1.address, stakeAmount, 180)
    ).to.be.revertedWith(
      "AccessControl: account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 is missing role 0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775"
    );
    await expect(
      StakingContract.stake(user1.address, 0, 180)
    ).to.be.revertedWith("The amount must be greater than 0");
    await expect(
      StakingContract.stake(
        user1.address,
        ethers.utils.parseUnits("10001", 6),
        720
      )
    ).to.be.revertedWith("Not enough tokens on contract");
    await expect(
      StakingContract.stake(user1.address, stakeAmount, 60)
    ).to.be.revertedWith("Choose correct plan: 90/180/360/720 days");
    await expect(
      StakingContract.stake(user1.address, stakeAmount, 120)
    ).to.be.revertedWith("Choose correct plan: 90/180/360/720 days");

    await expect(
      StakingContract.connect(user2).setTokenAddress(USDC_ADDRESS)
    ).to.be.revertedWith(
      "AccessControl: account 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc is missing role 0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775"
    );
    await StakingContract.setTokenAddress(USDC_ADDRESS);
  });

  it("Approves from Admin and Stakes for all users", async () => {
    const stakeAmount = ethers.utils.parseUnits("100", 6);
    await USDC.approve(StakingContract.address, ethers.constants.MaxUint256);

    let tx = await StakingContract.stake(user1.address, stakeAmount, 180);
    await tx.wait();
    tx = await StakingContract.stake(user5.address, stakeAmount, 90);
    await tx.wait();
    tx = await StakingContract.stake(user4.address, stakeAmount, 90);
    await tx.wait();
    tx = await StakingContract.stake(user5.address, stakeAmount, 90);
    await tx.wait();
    tx = await StakingContract.stake(user4.address, stakeAmount, 90);
    await tx.wait();

    tx = await StakingContract.stake(user2.address, stakeAmount, 360);
    await tx.wait();
    tx = await StakingContract.stake(user5.address, stakeAmount, 90);
    await tx.wait();
    tx = await StakingContract.stake(user4.address, stakeAmount, 90);
    await tx.wait();

    tx = await StakingContract.stake(user3.address, stakeAmount, 720);
    await tx.wait();
    tx = await StakingContract.stake(user4.address, stakeAmount, 90);
    await tx.wait();
    tx = await StakingContract.stake(user4.address, stakeAmount, 90);
    await tx.wait();
    tx = await StakingContract.stake(user5.address, stakeAmount, 90);
    await tx.wait();

    expect(await StakingContract.getReceiversLength()).to.equal(5);
    expect(await StakingContract.getMyLastStakedId(user5.address)).to.equal(4);
    // console.log("User1 %s", await USDC.balanceOf(user1.address))
    expect(await USDC.balanceOf(user1.address)).to.equal(0);
    expect(await USDC.balanceOf(user2.address)).to.equal(0);
    expect(await USDC.balanceOf(user3.address)).to.equal(0);
    expect(await USDC.balanceOf(user4.address)).to.equal(0);
    expect(await USDC.balanceOf(user5.address)).to.equal(0);

    expect(await StakingContract.userTokenBalance(user1.address)).to.equal(
      ethers.utils.parseUnits("115", 6)
    );
    expect(await StakingContract.userTokenBalance(user2.address)).to.equal(
      ethers.utils.parseUnits("138", 6)
    );
    expect(await StakingContract.userTokenBalance(user3.address)).to.equal(
      ethers.utils.parseUnits("200", 6)
    );
    expect(await StakingContract.userTokenBalance(user4.address)).to.equal(
      ethers.utils.parseUnits("530", 6)
    );
    expect(await StakingContract.userTokenBalance(user5.address)).to.equal(
      ethers.utils.parseUnits("424", 6)
    );
  });

  it("Check Claim reverts and Claim all users", async () => {
    await expect(StakingContract.claim(0, user3.address)).to.be.revertedWith(
      "Token lock time has not yet expired"
    );

    await ethers.provider.send("evm_increaseTime", [3600 * 24 * 367]);

    let tx = await StakingContract.claim(0, user1.address);
    await tx.wait();
    tx = await StakingContract.claim(0, user5.address);
    await tx.wait();
    tx = await StakingContract.claim(0, user4.address);
    await tx.wait();
    tx = await StakingContract.claim(1, user5.address);
    await tx.wait();
    tx = await StakingContract.claim(1, user4.address);
    await tx.wait();

    tx = await StakingContract.claim(0, user2.address);
    await tx.wait();
    tx = await StakingContract.claim(2, user5.address);
    await tx.wait();
    tx = await StakingContract.claim(2, user4.address);
    await tx.wait();

    tx = await StakingContract.claim(0, user3.address);
    await tx.wait();
    tx = await StakingContract.claim(3, user4.address);
    await tx.wait();
    tx = await StakingContract.claim(4, user4.address);
    await tx.wait();
    tx = await StakingContract.claim(3, user5.address);
    await tx.wait();

    await expect(StakingContract.claim(0, user3.address)).to.be.revertedWith(
      "Reward already claimed!"
    );

    // console.log("User1 %s", await USDC.balanceOf(user1.address))
    expect(await USDC.balanceOf(user1.address)).to.equal(
      ethers.utils.parseUnits("115", 6)
    );
    expect(await USDC.balanceOf(user2.address)).to.equal(
      ethers.utils.parseUnits("138", 6)
    );
    expect(await USDC.balanceOf(user3.address)).to.equal(
      ethers.utils.parseUnits("200", 6)
    );
    expect(await USDC.balanceOf(user4.address)).to.equal(
      ethers.utils.parseUnits("530", 6)
    );
    expect(await USDC.balanceOf(user5.address)).to.equal(
      ethers.utils.parseUnits("424", 6)
    );

    expect(await StakingContract.userTokenBalance(user1.address)).to.equal(0);
    expect(await StakingContract.userTokenBalance(user2.address)).to.equal(0);
    expect(await StakingContract.userTokenBalance(user3.address)).to.equal(0);
    expect(await StakingContract.userTokenBalance(user4.address)).to.equal(0);
    expect(await StakingContract.userTokenBalance(user5.address)).to.equal(0);
  });
});
