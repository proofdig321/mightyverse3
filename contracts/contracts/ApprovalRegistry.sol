// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title ApprovalRegistry
 * @dev Registry for managing admin approvals and signatures for platform operations
 * Features:
 * - EIP-712 signature verification for secure operations
 * - Multi-signature support for critical operations
 * - Approval tracking and audit trails
 * - Role-based permission management
 */
contract ApprovalRegistry is AccessControl, EIP712 {
    using ECDSA for bytes32;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant APPROVER_ROLE = keccak256("APPROVER_ROLE");

    // EIP-712 type hashes
    bytes32 private constant APPROVAL_TYPEHASH = keccak256(
        "Approval(bytes32 operationHash,address requester,uint256 nonce,uint256 deadline)"
    );

    // State variables
    mapping(bytes32 => ApprovalStatus) private _approvals;
    mapping(address => uint256) private _nonces;
    mapping(bytes32 => address[]) private _approvers;

    // Structs
    struct ApprovalStatus {
        bool isApproved;
        uint256 approvalCount;
        uint256 requiredApprovals;
        uint256 createdAt;
        uint256 expiresAt;
        address requester;
    }

    struct ApprovalRequest {
        bytes32 operationHash;
        address requester;
        uint256 nonce;
        uint256 deadline;
    }

    // Events
    event ApprovalRequested(bytes32 indexed operationHash, address indexed requester, uint256 requiredApprovals);
    event ApprovalGranted(bytes32 indexed operationHash, address indexed approver);
    event ApprovalCompleted(bytes32 indexed operationHash, uint256 totalApprovals);
    event ApprovalRevoked(bytes32 indexed operationHash, address indexed revoker);

    constructor(string memory name, string memory version) EIP712(name, version) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(APPROVER_ROLE, msg.sender);
    }

    /**
     * @dev Request approval for an operation
     * @param operationHash Hash of the operation requiring approval
     * @param requiredApprovals Number of approvals required
     * @param expirationTime When the approval request expires
     */
    function requestApproval(
        bytes32 operationHash,
        uint256 requiredApprovals,
        uint256 expirationTime
    ) external {
        require(requiredApprovals > 0, "ApprovalRegistry: invalid required approvals");
        require(expirationTime > block.timestamp, "ApprovalRegistry: invalid expiration");
        require(_approvals[operationHash].requester == address(0), "ApprovalRegistry: approval already exists");

        _approvals[operationHash] = ApprovalStatus({
            isApproved: false,
            approvalCount: 0,
            requiredApprovals: requiredApprovals,
            createdAt: block.timestamp,
            expiresAt: expirationTime,
            requester: msg.sender
        });

        emit ApprovalRequested(operationHash, msg.sender, requiredApprovals);
    }

    /**
     * @dev Grant approval with signature verification
     * @param request The approval request parameters
     * @param signature Approver signature for the request
     */
    function grantApprovalWithSignature(
        ApprovalRequest calldata request,
        bytes calldata signature
    ) external {
        require(block.timestamp <= request.deadline, "ApprovalRegistry: expired deadline");
        require(request.nonce == _nonces[request.requester], "ApprovalRegistry: invalid nonce");

        // Verify signature
        bytes32 structHash = keccak256(
            abi.encode(
                APPROVAL_TYPEHASH,
                request.operationHash,
                request.requester,
                request.nonce,
                request.deadline
            )
        );
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        require(hasRole(APPROVER_ROLE, signer), "ApprovalRegistry: invalid approver signature");

        _grantApproval(request.operationHash, signer);
        _nonces[request.requester]++;
    }

    /**
     * @dev Grant approval directly (for contract calls)
     */
    function grantApproval(bytes32 operationHash) external onlyRole(APPROVER_ROLE) {
        _grantApproval(operationHash, msg.sender);
    }

    /**
     * @dev Internal function to grant approval
     */
    function _grantApproval(bytes32 operationHash, address approver) internal {
        ApprovalStatus storage approval = _approvals[operationHash];
        require(approval.requester != address(0), "ApprovalRegistry: approval does not exist");
        require(block.timestamp <= approval.expiresAt, "ApprovalRegistry: approval expired");
        require(!approval.isApproved, "ApprovalRegistry: already approved");

        // Check if approver already approved
        address[] storage approvers = _approvers[operationHash];
        for (uint256 i = 0; i < approvers.length; i++) {
            require(approvers[i] != approver, "ApprovalRegistry: already approved by this address");
        }

        // Add approver and increment count
        approvers.push(approver);
        approval.approvalCount++;

        emit ApprovalGranted(operationHash, approver);

        // Check if approval is complete
        if (approval.approvalCount >= approval.requiredApprovals) {
            approval.isApproved = true;
            emit ApprovalCompleted(operationHash, approval.approvalCount);
        }
    }

    /**
     * @dev Revoke approval (admin only)
     */
    function revokeApproval(bytes32 operationHash) external onlyRole(ADMIN_ROLE) {
        ApprovalStatus storage approval = _approvals[operationHash];
        require(approval.requester != address(0), "ApprovalRegistry: approval does not exist");

        approval.isApproved = false;
        approval.approvalCount = 0;
        delete _approvers[operationHash];

        emit ApprovalRevoked(operationHash, msg.sender);
    }

    /**
     * @dev Check if operation is approved
     */
    function isApproved(bytes32 operationHash) external view returns (bool) {
        ApprovalStatus memory approval = _approvals[operationHash];
        return approval.isApproved && block.timestamp <= approval.expiresAt;
    }

    /**
     * @dev Get approval status
     */
    function getApprovalStatus(bytes32 operationHash) external view returns (ApprovalStatus memory) {
        return _approvals[operationHash];
    }

    /**
     * @dev Get approvers for an operation
     */
    function getApprovers(bytes32 operationHash) external view returns (address[] memory) {
        return _approvers[operationHash];
    }

    /**
     * @dev Get nonce for an address
     */
    function getNonce(address account) external view returns (uint256) {
        return _nonces[account];
    }

    /**
     * @dev Generate operation hash for consistent hashing
     */
    function generateOperationHash(
        string calldata operation,
        bytes calldata data,
        uint256 timestamp
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(operation, data, timestamp));
    }
}