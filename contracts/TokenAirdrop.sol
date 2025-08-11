// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title TokenAirdrop
/// @notice Users claim ERC-20 tokens using an off-chain signature. Claimer pays the gas.
/// Digest: keccak256(chainId, address(this), roundId, wallet, amount, nonce) and then eth-signed.
contract TokenAirdrop is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    using MessageHashUtils for bytes32;

    IERC20 public immutable token;
    address public payoutSigner;
    mapping(bytes32 => bool) public nonceUsed;

    event Claimed(address indexed wallet, uint256 indexed roundId, uint256 amount, bytes32 nonce);
    event SignerUpdated(address indexed signer);

    constructor(address tokenAddress, address signer) Ownable(msg.sender) {
        require(tokenAddress != address(0), "token");
        require(signer != address(0), "signer");
        token = IERC20(tokenAddress);
        payoutSigner = signer;
    }

    function setSigner(address signer) external onlyOwner {
        require(signer != address(0), "signer");
        payoutSigner = signer;
        emit SignerUpdated(signer);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function recoverTokens(address to, uint256 amount) external onlyOwner {
        token.safeTransfer(to, amount);
    }

    /// @notice Claim signed allocation of tokens. Claimer pays gas.
    function claim(uint256 roundId, uint256 amount, bytes32 nonce, bytes calldata signature)
        external
        nonReentrant
        whenNotPaused
    {
        require(!nonceUsed[nonce], "nonce");
        bytes32 digest = keccak256(abi.encodePacked(block.chainid, address(this), roundId, msg.sender, amount, nonce));
        bytes32 ethSigned = digest.toEthSignedMessageHash();
        address recovered = ECDSA.recover(ethSigned, signature);
        require(recovered == payoutSigner, "signer");
        nonceUsed[nonce] = true;
        token.safeTransfer(msg.sender, amount);
        emit Claimed(msg.sender, roundId, amount, nonce);
    }
}


