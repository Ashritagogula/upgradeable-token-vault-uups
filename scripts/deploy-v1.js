const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  const TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000"; 
  // replace with deployed MockERC20 address when running

  const DEPOSIT_FEE = 500; // 5%

  const TokenVaultV1 = await ethers.getContractFactory("TokenVaultV1");

  const vault = await upgrades.deployProxy(
    TokenVaultV1,
    [TOKEN_ADDRESS, deployer.address, DEPOSIT_FEE],
    { kind: "uups" }
  );

  await vault.waitForDeployment();

  console.log("TokenVaultV1 deployed at:", vault.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
