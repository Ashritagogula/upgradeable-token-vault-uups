const { ethers, upgrades } = require("hardhat");

async function main() {
  const PROXY_ADDRESS = "PROXY_ADDRESS_HERE"; 
  // replace with deployed TokenVault proxy address

  const TokenVaultV3 = await ethers.getContractFactory("TokenVaultV3");

  console.log("Upgrading TokenVault to V3...");
  const vaultV3 = await upgrades.upgradeProxy(
    PROXY_ADDRESS,
    TokenVaultV3
  );

  await vaultV3.waitForDeployment();
  console.log("TokenVault upgraded to V3 at:", vaultV3.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
