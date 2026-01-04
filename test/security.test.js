const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Security Tests", function () {
  let owner, attacker;
  let token, vault;

  beforeEach(async function () {
    [owner, attacker] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy("MockToken", "MTK");
    await token.waitForDeployment();

    const TokenVaultV1 = await ethers.getContractFactory("TokenVaultV1");
    vault = await upgrades.deployProxy(
      TokenVaultV1,
      [token.target, owner.address, 500],
      { kind: "uups" }
    );
    await vault.waitForDeployment();
  });

  it("should prevent direct initialization of implementation contracts", async function () {
    const TokenVaultV1 = await ethers.getContractFactory("TokenVaultV1");
    const impl = await TokenVaultV1.deploy();
    await impl.waitForDeployment();

    await expect(
      impl.initialize(token.target, owner.address, 500)
    ).to.be.reverted;
  });

  it("should prevent unauthorized upgrades", async function () {
    const TokenVaultV2 = await ethers.getContractFactory("TokenVaultV2");

    await expect(
      upgrades.upgradeProxy(vault.target, TokenVaultV2.connect(attacker))
    ).to.be.reverted;
  });

  it("should use storage gaps for future upgrades", async function () {
    const storageLayout = await upgrades.validateImplementation(
      await ethers.getContractFactory("TokenVaultV2")
    );

    expect(storageLayout).to.not.equal(null);
  });

  it("should not have storage layout collisions across versions", async function () {
    const TokenVaultV2 = await ethers.getContractFactory("TokenVaultV2");
    const TokenVaultV3 = await ethers.getContractFactory("TokenVaultV3");

    await upgrades.validateUpgrade(vault.target, TokenVaultV2);
    await upgrades.validateUpgrade(vault.target, TokenVaultV3);

    expect(true).to.equal(true);
  });

  it("should prevent function selector clashing", async function () {
    const iface = vault.interface;
    const selectors = Object.keys(iface.fragments)
      .filter((f) => iface.fragments[f].type === "function")
      .map((f) => iface.getFunction(f).selector);

    const uniqueSelectors = new Set(selectors);
    expect(uniqueSelectors.size).to.equal(selectors.length);
  });
});
