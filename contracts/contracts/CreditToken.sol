// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title CreditToken
 * @dev Platform credit system for The Mighty Verse
 * Features:
 * - ERC20 token for platform transactions
 * - Signature-based minting and burning
 * - Role-based access control
 * - Pausable for emergency situations
 * - Credit deduction tracking for operations
 */
contract CreditToken is ERC20, AccessControl, Pausable, EIP712 {
    using ECDSA for bytes32;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // EIP-712 type hashes
    bytes32 private constant MINT_TYPEHASH = keccak256(
        "MintRequest(address to,uint256 amount,uint256 nonce,uint256 deadline)"
    );
    bytes32 private constant BURN_TYPEHASH = keccak256(
        "BurnRequest(address from,uint256 amount,uint256 nonce,uint256 deadline)"
    );
    bytes32 private constant DEDUCT_TYPEHASH = keccak256(
        "DeductRequest(address from,uint256 amount,string operation,uint256 nonce,uint256 deadline)"
    );

    // State variables
    mapping(address => uint256) private _nonces;
    mapping(string => uint256) private _operationCosts;
    mapping(address => mapping(string => uint256)) private _userOperationCounts;

    // Structs
    struct MintRequest {
        address to;
        uint256 amount;
        uint256 nonce;
        uint256 deadline;
    }

    struct BurnRequest {
        address from;
        uint256 amount;
        uint256 nonce;
        uint256 deadline;
    }

    struct DeductRequest {
        address from;
        uint256 amount;
        string operation;
        uint256 nonce;
        uint256 deadline;
    }

    // Events
    event CreditsMinted(address indexed to, uint256 amount, address indexed minter);
    event CreditsBurned(address indexed from, uint256 amount, address indexed burner);
    event CreditsDeducted(address indexed from, uint256 amount, string operation);
    event OperationCostSet(string operation, uint256 cost);

    constructor(
        string memory name,
        string memory symbol,
        string memory version
    ) ERC20(name, symbol) EIP712(name, version) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);

        // Set default operation costs
        _operationCosts["mint_asset"] = 100 * 10**decimals(); // 100 credits
        _operationCosts["upload_asset"] = 50 * 10**decimals(); // 50 credits
        _operationCosts["create_campaign"] = 200 * 10**decimals(); // 200 credits
        _operationCosts["place_ad"] = 25 * 10**decimals(); // 25 credits
    }

    /**
     * @dev Mint credits with signature verification
     */
    function mintWithSignature(
        MintRequest calldata request,
        bytes calldata signature
    ) external whenNotPaused {
        require(block.timestamp <= request.deadline, "CreditToken: expired deadline");
        require(request.nonce == _nonces[request.to], "CreditToken: invalid nonce");
        require(request.amount > 0, "CreditToken: invalid amount");

        // Verify signature
        bytes32 structHash = keccak256(
            abi.encode(
                MINT_TYPEHASH,
                request.to,
                request.amount,
                request.nonce,
                request.deadline
            )
        );
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        require(hasRole(MINTER_ROLE, signer), "CreditToken: invalid minter signature");

        _nonces[request.to]++;
        _mint(request.to, request.amount);

        emit CreditsMinted(request.to, request.amount, signer);
    }

    /**
     * @dev Burn credits with signature verification
     */
    function burnWithSignature(
        BurnRequest calldata request,
        bytes calldata signature
    ) external whenNotPaused {
        require(block.timestamp <= request.deadline, "CreditToken: expired deadline");
        require(request.nonce == _nonces[request.from], "CreditToken: invalid nonce");
        require(request.amount > 0, "CreditToken: invalid amount");

        // Verify signature
        bytes32 structHash = keccak256(
            abi.encode(
                BURN_TYPEHASH,
                request.from,
                request.amount,
                request.nonce,
                request.deadline
            )
        );
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        require(hasRole(BURNER_ROLE, signer), "CreditToken: invalid burner signature");

        _nonces[request.from]++;
        _burn(request.from, request.amount);

        emit CreditsBurned(request.from, request.amount, signer);
    }

    /**
     * @dev Deduct credits for platform operations
     */
    function deductCreditsWithSignature(
        DeductRequest calldata request,
        bytes calldata signature
    ) external whenNotPaused {
        require(block.timestamp <= request.deadline, "CreditToken: expired deadline");
        require(request.nonce == _nonces[request.from], "CreditToken: invalid nonce");
        require(request.amount > 0, "CreditToken: invalid amount");

        // Verify signature
        bytes32 structHash = keccak256(
            abi.encode(
                DEDUCT_TYPEHASH,
                request.from,
                request.amount,
                keccak256(bytes(request.operation)),
                request.nonce,
                request.deadline
            )
        );
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        require(hasRole(OPERATOR_ROLE, signer), "CreditToken: invalid operator signature");

        _nonces[request.from]++;
        _burn(request.from, request.amount);
        _userOperationCounts[request.from][request.operation]++;

        emit CreditsDeducted(request.from, request.amount, request.operation);
    }

    /**
     * @dev Deduct credits for operation (direct call)
     */
    function deductCreditsForOperation(
        address from,
        string calldata operation
    ) external onlyRole(OPERATOR_ROLE) whenNotPaused {
        uint256 cost = _operationCosts[operation];
        require(cost > 0, "CreditToken: operation not configured");
        require(balanceOf(from) >= cost, "CreditToken: insufficient credits");

        _burn(from, cost);
        _userOperationCounts[from][operation]++;

        emit CreditsDeducted(from, cost, operation);
    }

    /**
     * @dev Mint credits directly (admin only)
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) whenNotPaused {
        _mint(to, amount);
        emit CreditsMinted(to, amount, msg.sender);
    }

    /**
     * @dev Burn credits directly (admin only)
     */
    function burn(address from, uint256 amount) external onlyRole(BURNER_ROLE) whenNotPaused {
        _burn(from, amount);
        emit CreditsBurned(from, amount, msg.sender);
    }

    /**
     * @dev Set operation cost (admin only)
     */
    function setOperationCost(
        string calldata operation,
        uint256 cost
    ) external onlyRole(ADMIN_ROLE) {
        _operationCosts[operation] = cost;
        emit OperationCostSet(operation, cost);
    }

    /**
     * @dev Pause contract (admin only)
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract (admin only)
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // View functions
    function getNonce(address account) external view returns (uint256) {
        return _nonces[account];
    }

    function getOperationCost(string calldata operation) external view returns (uint256) {
        return _operationCosts[operation];
    }

    function getUserOperationCount(
        address user,
        string calldata operation
    ) external view returns (uint256) {
        return _userOperationCounts[user][operation];
    }

    function canAffordOperation(
        address user,
        string calldata operation
    ) external view returns (bool) {
        uint256 cost = _operationCosts[operation];
        return cost > 0 && balanceOf(user) >= cost;
    }

    // Override transfer functions to respect pause
    function transfer(address to, uint256 amount) public override whenNotPaused returns (bool) {
        return super.transfer(to, amount);
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public override whenNotPaused returns (bool) {
        return super.transferFrom(from, to, amount);
    }
}