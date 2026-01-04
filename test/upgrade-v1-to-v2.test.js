const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Upgrade V1 to V2", function () {
  let owner, user, attacker;
  let token, vaultV1, vaultV2;

  beforeEach(async function () {
    [owner, user, attacker] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy("MockToken", "MTK");
    await token.waitForDeployment();

    await token.mint(user.address, ethers.parseEther("1000"));

    const TokenVaultV1 = await ethers.getContractFactory("TokenVaultV1");
    vaultV1 = await upgrades.deployProxy(
      TokenVaultV1,
      [token.target, owner.address, 500],
      { kind: "uups" }
    );
    await vaultV1.waitForDeployment();

    await token.connect(user).approve(vaultV1.target, ethers.parseEther("200"));
    await vaultV1.connect(user).deposit(ethers.parseEther("200"));

    const TokenVaultV2 = await ethers.getContractFactory("TokenVaultV2");
    vaultV2 = await upgrades.upgradeProxy(vaultV1.target, TokenVaultV2);
  });

  it("should preserve user balances after upgrade", async function () {
    const balance = await vaultV2.balanceOf(user.address);
    expect(balance).to.equal(ethers.parseEther("190"));
  });

  it("should preserve total deposits after upgrade", async function () {
    const total = await vaultV2.totalDeposits();
    expect(total).to.equal(ethers.parseEther("190"));
  });

  it("should maintain admin access control after upgrade", async function () {
    expect(
      await vaultV2.hasRole(
        await vaultV2.DEFAULT_ADMIN_ROLE(),
        owner.address
      )
    ).to.equal(true);
  });

  it("should allow setting yield rate in V2", async function () {
    await vaultV2.connect(owner).setYieldRate(500);
    expect(await vaultV2.getYieldRate()).to.equal(500);
  });

  it("should calculate yield correctly", async function () {
    await vaultV2.connect(owner).setYieldRate(1000); // 10%

    await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");

    const yieldAmount = await vaultV2.getUserYield(user.address);
    expect(yieldAmount).to.be.gt(0);
  });

  it("should prevent non-admin from setting yield rate", async function () {
    await expect(
      vaultV2.connect(attacker).setYieldRate(500)
    ).to.be.reverted;
  });

  it("should allow pausing deposits in V2", async function () {
    await vaultV2.connect(owner).pauseDeposits();
    expect(await vaultV2.isDepositsPaused()).to.equal(true);
  });
});
