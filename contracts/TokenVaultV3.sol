// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TokenVaultV2.sol";

contract TokenVaultV3 is TokenVaultV2 {
    struct WithdrawalRequest {
        uint256 amount;
        uint256 requestTime;
    }

    uint256 internal withdrawalDelay;
    mapping(address => WithdrawalRequest) internal withdrawalRequests;

    uint256[40] private __gapV3;

    function initializeV3(uint256 _delaySeconds) external reinitializer(3) {
        withdrawalDelay = _delaySeconds;
    }

    /* -------------------- V3 FUNCTIONS -------------------- */

    function emergencyWithdraw() external returns (uint256) {
        uint256 balance = balances[msg.sender];
        require(balance > 0, "No balance");

        balances[msg.sender] = 0;
        _totalDeposits -= balance;

        delete withdrawalRequests[msg.sender];

        token.transfer(msg.sender, balance);
        return balance;
    }

    function setWithdrawalDelay(uint256 _delaySeconds)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        withdrawalDelay = _delaySeconds;
    }

    function getWithdrawalDelay() external view returns (uint256) {
        return withdrawalDelay;
    }

    function requestWithdrawal(uint256 amount) external {
        require(amount > 0, "Amount zero");
        require(balances[msg.sender] >= amount, "Insufficient balance");

        withdrawalRequests[msg.sender] = WithdrawalRequest({
            amount: amount,
            requestTime: block.timestamp
        });
    }

    function executeWithdrawal() external returns (uint256) {
        WithdrawalRequest memory req = withdrawalRequests[msg.sender];
        require(req.amount > 0, "No request");
        require(
            block.timestamp >= req.requestTime + withdrawalDelay,
            "Withdrawal delay not passed"
        );
        require(balances[msg.sender] >= req.amount, "Insufficient balance");

        balances[msg.sender] -= req.amount;
        _totalDeposits -= req.amount;

        delete withdrawalRequests[msg.sender];

        token.transfer(msg.sender, req.amount);
        return req.amount;
    }

    function getWithdrawalRequest(address user)
        external
        view
        returns (uint256 amount, uint256 requestTime)
    {
        WithdrawalRequest memory req = withdrawalRequests[user];
        return (req.amount, req.requestTime);
    }

    function getImplementationVersion()
        external
        pure
        override
        returns (string memory)
    {
        return "V3";
    }
}
