// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title MightyVerseAssets
 * @dev ERC1155 multi-token contract for The Mighty Verse platform
 * Features:
 * - EIP-712 signature-based minting with admin approval
 * - ERC-2981 royalty standard with configurable splits
 * - Role-based access control for platform operations
 * - Batch minting optimization for gas efficiency
 * - Comprehensive metadata and provenance tracking
 */
contract MightyVerseAssets is ERC1155, AccessControl, IERC2981, EIP712, ReentrancyGuard {
    using ECDSA for bytes32;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant CURATOR_ROLE = keccak256("CURATOR_ROLE");

    // EIP-712 type hashes
    bytes32 private constant MINT_TYPEHASH = keccak256(
        "MintRequest(address to,uint256 tokenId,uint256 amount,string metadataURI,uint256 nonce,uint256 deadline)"
    );

    // State variables
    uint256 private _currentTokenId;
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => RoyaltyInfo) private _tokenRoyalties;
    mapping(address => uint256) private _nonces;
    mapping(uint256 => AssetMetadata) private _assetMetadata;

    // Structs
    struct RoyaltyInfo {
        address recipient;
        uint96 royaltyFraction; // Basis points (10000 = 100%)
    }

    struct AssetMetadata {
        string contentCID;
        string metadataCID;
        address creator;
        uint256 createdAt;
        bool isActive;
    }

    struct MintRequest {
        address to;
        uint256 tokenId;
        uint256 amount;
        string metadataURI;
        uint256 nonce;
        uint256 deadline;
    }

    // Events
    event AssetMinted(uint256 indexed tokenId, address indexed to, uint256 amount, string metadataURI);
    event RoyaltySet(uint256 indexed tokenId, address recipient, uint96 royaltyFraction);
    event MetadataUpdated(uint256 indexed tokenId, string newURI);

    constructor(
        string memory name,
        string memory version,
        string memory baseURI
    ) ERC1155(baseURI) EIP712(name, version) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _currentTokenId = 1;
    }

    /**
     * @dev Mint tokens with admin signature verification
     * @param request The mint request parameters
     * @param signature Admin signature for the mint request
     */
    function mintWithSignature(
        MintRequest calldata request,
        bytes calldata signature
    ) external nonReentrant {
        require(block.timestamp <= request.deadline, "MightyVerse: expired deadline");
        require(request.nonce == _nonces[request.to], "MightyVerse: invalid nonce");
        require(request.amount > 0, "MightyVerse: invalid amount");

        // Verify signature
        bytes32 structHash = keccak256(
            abi.encode(
                MINT_TYPEHASH,
                request.to,
                request.tokenId,
                request.amount,
                keccak256(bytes(request.metadataURI)),
                request.nonce,
                request.deadline
            )
        );
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        require(hasRole(ADMIN_ROLE, signer), "MightyVerse: invalid signature");

        // Update nonce
        _nonces[request.to]++;

        // Mint token
        uint256 tokenId = request.tokenId == 0 ? _currentTokenId++ : request.tokenId;
        _mint(request.to, tokenId, request.amount, "");

        // Set metadata
        _tokenURIs[tokenId] = request.metadataURI;
        _assetMetadata[tokenId] = AssetMetadata({
            contentCID: "", // To be set separately
            metadataCID: request.metadataURI,
            creator: request.to,
            createdAt: block.timestamp,
            isActive: true
        });

        emit AssetMinted(tokenId, request.to, request.amount, request.metadataURI);
    }

    /**
     * @dev Batch mint multiple tokens (admin only)
     */
    function batchMint(
        address[] calldata recipients,
        uint256[] calldata amounts,
        string[] calldata metadataURIs
    ) external onlyRole(MINTER_ROLE) {
        require(
            recipients.length == amounts.length && amounts.length == metadataURIs.length,
            "MightyVerse: arrays length mismatch"
        );

        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 tokenId = _currentTokenId++;
            _mint(recipients[i], tokenId, amounts[i], "");
            _tokenURIs[tokenId] = metadataURIs[i];
            
            _assetMetadata[tokenId] = AssetMetadata({
                contentCID: "",
                metadataCID: metadataURIs[i],
                creator: recipients[i],
                createdAt: block.timestamp,
                isActive: true
            });

            emit AssetMinted(tokenId, recipients[i], amounts[i], metadataURIs[i]);
        }
    }

    /**
     * @dev Set royalty information for a token
     */
    function setTokenRoyalty(
        uint256 tokenId,
        address recipient,
        uint96 royaltyFraction
    ) external onlyRole(ADMIN_ROLE) {
        require(royaltyFraction <= 1000, "MightyVerse: royalty too high"); // Max 10%
        _tokenRoyalties[tokenId] = RoyaltyInfo(recipient, royaltyFraction);
        emit RoyaltySet(tokenId, recipient, royaltyFraction);
    }

    /**
     * @dev Update metadata URI for a token
     */
    function setTokenURI(
        uint256 tokenId,
        string calldata newURI
    ) external onlyRole(CURATOR_ROLE) {
        require(exists(tokenId), "MightyVerse: token does not exist");
        _tokenURIs[tokenId] = newURI;
        _assetMetadata[tokenId].metadataCID = newURI;
        emit MetadataUpdated(tokenId, newURI);
    }

    /**
     * @dev Set content CID for asset metadata
     */
    function setContentCID(
        uint256 tokenId,
        string calldata contentCID
    ) external onlyRole(CURATOR_ROLE) {
        require(exists(tokenId), "MightyVerse: token does not exist");
        _assetMetadata[tokenId].contentCID = contentCID;
    }

    // View functions
    function uri(uint256 tokenId) public view override returns (string memory) {
        return _tokenURIs[tokenId];
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return bytes(_tokenURIs[tokenId]).length > 0;
    }

    function getNonce(address account) external view returns (uint256) {
        return _nonces[account];
    }

    function getAssetMetadata(uint256 tokenId) external view returns (AssetMetadata memory) {
        return _assetMetadata[tokenId];
    }

    function totalSupply() external view returns (uint256) {
        return _currentTokenId - 1;
    }

    // ERC2981 implementation
    function royaltyInfo(
        uint256 tokenId,
        uint256 salePrice
    ) external view override returns (address, uint256) {
        RoyaltyInfo memory royalty = _tokenRoyalties[tokenId];
        uint256 royaltyAmount = (salePrice * royalty.royaltyFraction) / 10000;
        return (royalty.recipient, royaltyAmount);
    }

    // Interface support
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC1155, AccessControl, IERC165) returns (bool) {
        return
            interfaceId == type(IERC2981).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
