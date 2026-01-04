const { ethers, upgrades } = require("hardhat");

async function main() {
  const PROXY_ADDRESS = "PROXY_ADDRESS_HERE"; 
  // replace with deployed TokenVault proxy address

  const TokenVaultV2 = await ethers.getContractFactory("TokenVaultV2");

  console.log("Upgrading TokenVault to V2...");
  const vaultV2 = await upgrades.upgradeProxy(
    PROXY_ADDRESS,
    TokenVaultV2
  );

  await vaultV2.waitForDeployment();
  console.log("TokenVault upgraded to V2 at:", vaultV2.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
