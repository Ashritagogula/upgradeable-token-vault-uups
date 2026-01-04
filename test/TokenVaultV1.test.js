const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("TokenVaultV1", function () {
  let owner, user;
  let token, vault;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy("MockToken", "MTK");
    await token.waitForDeployment();

    await token.mint(user.address, ethers.parseEther("1000"));

    const TokenVaultV1 = await ethers.getContractFactory("TokenVaultV1");
    vault = await upgrades.deployProxy(
      TokenVaultV1,
      [token.target, owner.address, 500],
      { kind: "uups" }
    );
    await vault.waitForDeployment();
  });

  it("should initialize with correct parameters", async function () {
    expect(await vault.getDepositFee()).to.equal(500);
    expect(await vault.totalDeposits()).to.equal(0);
  });

  it("should allow deposits and update balances", async function () {
    await token.connect(user).approve(vault.target, ethers.parseEther("100"));
    await vault.connect(user).deposit(ethers.parseEther("100"));

    const balance = await vault.balanceOf(user.address);
    expect(balance).to.be.gt(0);
  });

  it("should deduct deposit fee correctly", async function () {
    await token.connect(user).approve(vault.target, ethers.parseEther("100"));
    await vault.connect(user).deposit(ethers.parseEther("100"));

    const credited = await vault.balanceOf(user.address);
    expect(credited).to.equal(ethers.parseEther("95"));
  });

  it("should allow withdrawals and update balances", async function () {
    await token.connect(user).approve(vault.target, ethers.parseEther("100"));
    await vault.connect(user).deposit(ethers.parseEther("100"));

    await vault.connect(user).withdraw(ethers.parseEther("50"));

    const balance = await vault.balanceOf(user.address);
    expect(balance).to.equal(ethers.parseEther("45"));
  });

  it("should prevent withdrawal of more than balance", async function () {
    await expect(
      vault.connect(user).withdraw(ethers.parseEther("10"))
    ).to.be.reverted;
  });

  it("should prevent reinitialization", async function () {
    await expect(
      vault.initialize(token.target, owner.address, 300)
    ).to.be.reverted;
  });
});
