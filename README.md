# Build Production-Grade Upgradeable Smart Contract System with UUPS Proxy Pattern

## Overview
This project implements a **production-grade upgradeable smart contract system** using the **UUPS (Universal Upgradeable Proxy Standard)** pattern.  
The system demonstrates a complete upgrade lifecycle from **V1 → V2 → V3**, preserving all on-chain state while introducing new features securely.

The implementation follows real-world DeFi protocol standards and mirrors upgrade practices used by protocols such as Aave and Uniswap.

---

## Architecture
The system consists of a **TokenVault** protocol deployed behind a **UUPS proxy**, allowing safe upgrades without data loss.

### Versions
- **TokenVaultV1**
  - Basic deposit and withdrawal
  - Deposit fee logic
  - Role-based access control
- **TokenVaultV2**
  - Yield generation (time-based, non-compounding)
  - Deposit pause/unpause functionality
- **TokenVaultV3**
  - Withdrawal delay mechanism
  - Emergency withdrawal support

---

## Key Features
- UUPS Upgradeable Proxy Pattern
- Secure initializers and reinitializers
- Storage layout management with gaps
- Role-based access control (Admin, Upgrader, Pauser)
- State preservation across upgrades
- Comprehensive upgrade and security testing

---

## Tech Stack
- **Solidity** `^0.8.20`
- **Hardhat**
- **Ethers.js**
- **Chai**
- **OpenZeppelin Contracts Upgradeable**

---

## Project Structure
```text
contracts/
  ├── TokenVaultV1.sol
  ├── TokenVaultV2.sol
  ├── TokenVaultV3.sol
  └── mocks/MockERC20.sol

test/
  ├── TokenVaultV1.test.js
  ├── upgrade-v1-to-v2.test.js
  ├── upgrade-v2-to-v3.test.js
  └── security.test.js

scripts/
  ├── deploy-v1.js
  ├── upgrade-to-v2.js
  └── upgrade-to-v3.js
├── hardhat.config.js
├── package.json
├── submission.yml
└── README.md
```


---

## Security Design
- Initializers protected using OpenZeppelin `initializer` and `reinitializer`
- Direct initialization of implementation contracts disabled
- Upgrade authorization restricted via `UPGRADER_ROLE`
- Storage layout integrity validated across versions
- Function selector collision prevention tested

---

## Testing
The project includes:
- Functional tests for V1
- Upgrade tests (V1 → V2, V2 → V3)
- Security tests covering initialization, upgrades, and storage safety

Run tests using:
```bash
npx hardhat test
```
# Deployment & Upgrades
```text 

Scripts are provided to:

Deploy V1 as a UUPS proxy

Upgrade to V2

Upgrade to V3

These scripts use OpenZeppelin’s Hardhat Upgrades plugin and reflect real-world deployment workflows.
```

## Installation & Setup
```bash
npm install
```
# Compile Contracts
```bash
npx hardhat compile
```

# Run Tests
```bash
npx hardhat test
```
# Deploy & Upgrade Workflow
## Deploy V1
```bash
npx hardhat run scripts/deploy-v1.js
```
## Upgrade to V2
```bash
npx hardhat run scripts/upgrade-to-v2.js
```
## Upgrade to V3
```bash
npx hardhat run scripts/upgrade-to-v3.js
```
# Storage Layout Strategy
- Storage variables are never reordered or removed

- New variables are only appended

- Storage gaps are reduced in each upgrade

- OpenZeppelin upgrade validation ensures safety

- This prevents storage collisions and ensures safe upgrades.

# Access Control Design
- DEFAULT_ADMIN_ROLE → configuration & role management

- UPGRADER_ROLE → contract upgrades

- PAUSER_ROLE → pause/unpause deposits (V2+)

- Separation of roles minimizes blast radius in case of key compromise.

# Known Limitations & Design Decisions
- Yield does not auto-compound (explicit claim required)

- Emergency withdrawal bypasses delay by design

- Timelock/multisig not included (out of scope for task)

- Gas optimization balanced with security and clarity