// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./TokenVaultV1.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

contract TokenVaultV2 is TokenVaultV1, PausableUpgradeable {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 internal yieldRate;
    mapping(address => uint256) internal lastYieldClaim;

    uint256[42] private __gapV2;

    function initializeV2(uint256 _yieldRate) external reinitializer(2) {
        __Pausable_init();
        yieldRate = _yieldRate;

        // Optional: grant PAUSER_ROLE if initializeV2 is called
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    /* ---------- V2 FUNCTIONS ---------- */

    function setYieldRate(uint256 _yieldRate)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        yieldRate = _yieldRate;
    }

    function getYieldRate() external view returns (uint256) {
        return yieldRate;
    }

    function claimYield() external returns (uint256) {
        uint256 yieldAmount = _calculateYield(msg.sender);
        require(yieldAmount > 0, "No yield");

        lastYieldClaim[msg.sender] = block.timestamp;

        balances[msg.sender] += yieldAmount;
        _totalDeposits += yieldAmount;

        return yieldAmount;
    }

    function getUserYield(address user) external view returns (uint256) {
        return _calculateYield(user);
    }

    /* ---------- PAUSE CONTROL ---------- */

    function pauseDeposits() external {
        require(
            hasRole(PAUSER_ROLE, msg.sender) ||
                hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Not authorized to pause"
        );
        _pause();
    }

    function unpauseDeposits() external {
        require(
            hasRole(PAUSER_ROLE, msg.sender) ||
                hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Not authorized to unpause"
        );
        _unpause();
    }

    function isDepositsPaused() external view returns (bool) {
        return paused();
    }

    /* ---------- OVERRIDES ---------- */

    function deposit(uint256 amount)
        public
        override
        whenNotPaused
    {
        super.deposit(amount);

        if (lastYieldClaim[msg.sender] == 0) {
            lastYieldClaim[msg.sender] = block.timestamp;
        }
    }

    function getImplementationVersion()
        external
        pure
        virtual
        override
        returns (string memory)
    {
        return "V2";
    }

    /* ---------- INTERNAL ---------- */

    function _calculateYield(address user) internal view returns (uint256) {
        uint256 lastClaim = lastYieldClaim[user];

        if (lastClaim == 0) {
            lastClaim = block.timestamp - 1;
        }

        uint256 timeElapsed = block.timestamp - lastClaim;
        return (balances[user] * yieldRate * timeElapsed)
            / (365 days * 10000);
    }
}
