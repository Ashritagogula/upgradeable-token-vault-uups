// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TokenVaultV1.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

contract TokenVaultV2 is TokenVaultV1, PausableUpgradeable {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 internal yieldRate; // basis points (e.g. 500 = 5%)
    mapping(address => uint256) internal lastYieldClaim;
    mapping(address => uint256) internal pendingYield;

    uint256[42] private __gapV2;

    function initializeV2(uint256 _yieldRate) external reinitializer(2) {
        __Pausable_init();
        yieldRate = _yieldRate;

        _grantRole(PAUSER_ROLE, msg.sender);
    }

    /* -------------------- V2 FUNCTIONS -------------------- */

    function setYieldRate(uint256 _yieldRate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        yieldRate = _yieldRate;
    }

    function getYieldRate() external view returns (uint256) {
        return yieldRate;
    }

    function claimYield() external returns (uint256) {
        uint256 yieldAmount = _calculateYield(msg.sender);
        require(yieldAmount > 0, "No yield");

        lastYieldClaim[msg.sender] = block.timestamp;
        pendingYield[msg.sender] = 0;

        balances[msg.sender] += yieldAmount;
        _totalDeposits += yieldAmount;

        return yieldAmount;
    }

    function getUserYield(address user) external view returns (uint256) {
        return _calculateYield(user);
    }

    function pauseDeposits() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpauseDeposits() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function isDepositsPaused() external view returns (bool) {
        return paused();
    }

    /* -------------------- OVERRIDES -------------------- */

    function deposit(uint256 amount) external override whenNotPaused {
        super.deposit(amount);
    }

    function getImplementationVersion() external pure override returns (string memory) {
        return "V2";
    }

    /* -------------------- INTERNAL -------------------- */

    function _calculateYield(address user) internal view returns (uint256) {
        uint256 lastClaim = lastYieldClaim[user];
        if (lastClaim == 0) return 0;

        uint256 timeElapsed = block.timestamp - lastClaim;
        return (balances[user] * yieldRate * timeElapsed) / (365 days * 10000);
    }
}
