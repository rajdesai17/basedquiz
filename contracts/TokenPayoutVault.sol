// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title TokenPayoutVault
/// @notice Holds ERC-20 tokens (e.g., BQ) and allows controlled single/batch payouts.
/// - Owner can set a payout manager, pause the contract, and recover tokens.
/// - Payouts are restricted to owner or the payout manager.
contract TokenPayoutVault is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    /// @notice ERC-20 token used for payouts (e.g., BQ token)
    IERC20 public immutable payoutToken;

    /// @notice Address allowed to execute payouts in addition to the owner
    address public payoutManager;

    event Payout(address indexed to, uint256 amount);
    event PayoutBatch(uint256 count, uint256 totalAmount);
    event PayoutManagerUpdated(address indexed previousManager, address indexed newManager);

    /// @param token Address of the ERC-20 payout token
    /// @param initialManager Optional manager address; set to owner if zero address
    constructor(address token, address initialManager) Ownable(msg.sender) {
        require(token != address(0), "token");
        payoutToken = IERC20(token);
        payoutManager = initialManager == address(0) ? msg.sender : initialManager;
    }

    modifier onlyOwnerOrManager() {
        require(msg.sender == owner() || msg.sender == payoutManager, "auth");
        _;
    }

    /// @notice Update payout manager
    function setPayoutManager(address newManager) external onlyOwner {
        require(newManager != address(0), "manager");
        emit PayoutManagerUpdated(payoutManager, newManager);
        payoutManager = newManager;
    }

    /// @notice Pause payouts
    function pause() external onlyOwner { _pause(); }

    /// @notice Unpause payouts
    function unpause() external onlyOwner { _unpause(); }

    /// @notice Return current vault token balance
    function vaultBalance() external view returns (uint256) {
        return payoutToken.balanceOf(address(this));
    }

    /// @notice Single payout
    function payout(address to, uint256 amount) external nonReentrant whenNotPaused onlyOwnerOrManager {
        require(to != address(0), "to");
        require(amount > 0, "amount");
        payoutToken.safeTransfer(to, amount);
        emit Payout(to, amount);
    }

    /// @notice Batch payout
    function payoutBatch(address[] calldata to, uint256[] calldata amounts)
        external
        nonReentrant
        whenNotPaused
        onlyOwnerOrManager
    {
        require(to.length == amounts.length, "len");
        uint256 total;
        for (uint256 i = 0; i < to.length; i++) {
            address recipient = to[i];
            uint256 amount = amounts[i];
            require(recipient != address(0), "to");
            require(amount > 0, "amount");
            payoutToken.safeTransfer(recipient, amount);
            total += amount;
        }
        emit PayoutBatch(to.length, total);
    }

    /// @notice Owner can recover payout tokens
    function recoverPayoutTokens(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "to");
        payoutToken.safeTransfer(to, amount);
    }

    /// @notice Owner can recover any ERC-20 sent by mistake
    function recoverERC20(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "to");
        require(token != address(payoutToken), "payout");
        IERC20(token).safeTransfer(to, amount);
    }

    /// @notice Allow receiving ETH in case tokens are bridged/swapped here; owner can withdraw ETH
    receive() external payable {}

    function withdrawETH(address payable to, uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "eth");
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "xfer");
    }
}


