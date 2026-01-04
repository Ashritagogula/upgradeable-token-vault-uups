const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Upgrade V2 to V3", function () {
  let owner, user;
  let token, vaultV1, vaultV2, vaultV3;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy("MockToken", "MTK");
    await token.waitForDeployment();

    const TokenVaultV1 = await ethers.getContractFactory("TokenVaultV1");
    vaultV1 = await upgrades.deployProxy(
      TokenVaultV1,
      [token.target, owner.address, 0],
      { kind: "uups" }
    );
    await vaultV1.waitForDeployment();

    await token.mint(user.address, ethers.parseEther("100"));
    await token.connect(user).approve(vaultV1.target, ethers.parseEther("100"));
    await vaultV1.connect(user).deposit(ethers.parseEther("100"));

    const TokenVaultV2 = await ethers.getContractFactory("TokenVaultV2");
    vaultV2 = await upgrades.upgradeProxy(vaultV1.target, TokenVaultV2);

    const TokenVaultV3 = await ethers.getContractFactory("TokenVaultV3");
    vaultV3 = await upgrades.upgradeProxy(vaultV2.target, TokenVaultV3);
  });

  it("should preserve all V2 state after upgrade", async function () {
    expect(await vaultV3.balanceOf(user.address)).to.equal(
      ethers.parseEther("100")
    );
  });

  it("should allow setting withdrawal delay", async function () {
    await vaultV3.setWithdrawalDelay(60);
    expect(await vaultV3.getWithdrawalDelay()).to.equal(60);
  });

  it("should handle withdrawal requests correctly", async function () {
    await vaultV3.connect(user).requestWithdrawal(ethers.parseEther("50"));
    const request = await vaultV3.getWithdrawalRequest(user.address);
    expect(request.amount).to.equal(ethers.parseEther("50"));
  });

  it("should enforce withdrawal delay", async function () {
    await vaultV3.setWithdrawalDelay(3600);
    await vaultV3.connect(user).requestWithdrawal(ethers.parseEther("50"));

    await expect(
      vaultV3.connect(user).executeWithdrawal()
    ).to.be.reverted;
  });

  it("should allow emergency withdrawals", async function () {
    await vaultV3.connect(user).emergencyWithdraw();

    const remaining = await vaultV3.balanceOf(user.address);
    expect(remaining).to.equal(0);
  });

  it("should prevent premature withdrawal execution", async function () {
    await vaultV3.setWithdrawalDelay(3600);
    await vaultV3.connect(user).requestWithdrawal(ethers.parseEther("50"));

    await expect(
      vaultV3.connect(user).executeWithdrawal()
    ).to.be.reverted;
  });
});
