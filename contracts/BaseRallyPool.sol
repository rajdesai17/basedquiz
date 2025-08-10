// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract BaseRallyPool is Ownable, ReentrancyGuard, Pausable {
    using MessageHashUtils for bytes32;

    address public payoutSigner;
    uint256 public entryFee;

    mapping(uint256 => mapping(address => bool)) public entered; // roundId -> wallet -> entered
    mapping(bytes32 => bool) public nonceUsed;

    event Enter(address indexed wallet, uint256 indexed roundId, uint256 fee);
    event Claim(address indexed wallet, uint256 indexed roundId, uint256 amount, bytes32 nonce);

    constructor(uint256 _entryFee, address _signer) Ownable(msg.sender) {
        require(_signer != address(0), "signer");
        entryFee = _entryFee;
        payoutSigner = _signer;
    }

    function setEntryFee(uint256 _fee) external onlyOwner {
        entryFee = _fee;
    }

    function setSigner(address _signer) external onlyOwner {
        require(_signer != address(0), "signer");
        payoutSigner = _signer;
    }

    function withdraw(address payable to, uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "insufficient");
        to.transfer(amount);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function enter(uint256 roundId) external payable nonReentrant whenNotPaused {
        require(msg.value == entryFee, "fee");
        require(!entered[roundId][msg.sender], "already");
        entered[roundId][msg.sender] = true;
        emit Enter(msg.sender, roundId, msg.value);
    }

    function claim(uint256 roundId, uint256 amount, bytes32 nonce, bytes calldata signature)
        external
        nonReentrant
        whenNotPaused
    {
        require(!nonceUsed[nonce], "nonce");
        // domain-separate to avoid cross-chain/contract replay
        bytes32 digest = keccak256(abi.encodePacked(block.chainid, address(this), roundId, msg.sender, amount, nonce));
        bytes32 ethSigned = digest.toEthSignedMessageHash();
        address signer = ECDSA.recover(ethSigned, signature);
        require(signer == payoutSigner, "signer");
        nonceUsed[nonce] = true;
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "transfer");
        emit Claim(msg.sender, roundId, amount, nonce);
    }

    receive() external payable {}
}


