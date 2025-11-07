const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MightyVerseAssets", function () {
    let assets, creditToken, approvalRegistry;
    let owner, admin, curator, minter, user1, user2;
    let ADMIN_ROLE, MINTER_ROLE, CURATOR_ROLE;

    beforeEach(async function () {
        [owner, admin, curator, minter, user1, user2] = await ethers.getSigners();

        // Deploy CreditToken
        const CreditToken = await ethers.getContractFactory("CreditToken");
        creditToken = await CreditToken.deploy("Test Credits", "TC", "1");
        await creditToken.deployed();

        // Deploy ApprovalRegistry
        const ApprovalRegistry = await ethers.getContractFactory("ApprovalRegistry");
        approvalRegistry = await ApprovalRegistry.deploy("TestApprovals", "1");
        await approvalRegistry.deployed();

        // Deploy MightyVerseAssets
        const MightyVerseAssets = await ethers.getContractFactory("MightyVerseAssets");
        assets = await MightyVerseAssets.deploy(
            "TestAssets",
            "1",
            "https://test.api/metadata/"
        );
        await assets.deployed();

        // Get role constants
        ADMIN_ROLE = await assets.ADMIN_ROLE();
        MINTER_ROLE = await assets.MINTER_ROLE();
        CURATOR_ROLE = await assets.CURATOR_ROLE();

        // Setup roles
        await assets.grantRole(ADMIN_ROLE, admin.address);
        await assets.grantRole(MINTER_ROLE, minter.address);
        await assets.grantRole(CURATOR_ROLE, curator.address);
    });

    describe("Deployment", function () {
        it("Should set the correct initial state", async function () {
            expect(await assets.totalSupply()).to.equal(0);
            expect(await assets.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
            expect(await assets.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
        });

        it("Should support required interfaces", async function () {
            // ERC1155
            expect(await assets.supportsInterface("0xd9b67a26")).to.be.true;
            // ERC2981 (royalties)
            expect(await assets.supportsInterface("0x2a55205a")).to.be.true;
            // AccessControl
            expect(await assets.supportsInterface("0x7965db0b")).to.be.true;
        });
    });

    describe("Signature-based Minting", function () {
        it("Should mint with valid admin signature", async function () {
            const tokenId = 1;
            const amount = 100;
            const metadataURI = "ipfs://test-metadata";
            const nonce = await assets.getNonce(user1.address);
            const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour

            // Create mint request
            const mintRequest = {
                to: user1.address,
                tokenId: tokenId,
                amount: amount,
                metadataURI: metadataURI,
                nonce: nonce,
                deadline: deadline
            };

            // Sign the request
            const domain = {
                name: "TestAssets",
                version: "1",
                chainId: (await ethers.provider.getNetwork()).chainId,
                verifyingContract: assets.address
            };

            const types = {
                MintRequest: [
                    { name: "to", type: "address" },
                    { name: "tokenId", type: "uint256" },
                    { name: "amount", type: "uint256" },
                    { name: "metadataURI", type: "string" },
                    { name: "nonce", type: "uint256" },
                    { name: "deadline", type: "uint256" }
                ]
            };

            const signature = await admin._signTypedData(domain, types, mintRequest);

            // Mint with signature
            await expect(assets.connect(user1).mintWithSignature(mintRequest, signature))
                .to.emit(assets, "AssetMinted")
                .withArgs(tokenId, user1.address, amount, metadataURI);

            // Verify minting
            expect(await assets.balanceOf(user1.address, tokenId)).to.equal(amount);
            expect(await assets.uri(tokenId)).to.equal(metadataURI);
            expect(await assets.totalSupply()).to.equal(1);
        });

        it("Should reject expired signature", async function () {
            const mintRequest = {
                to: user1.address,
                tokenId: 1,
                amount: 100,
                metadataURI: "ipfs://test",
                nonce: await assets.getNonce(user1.address),
                deadline: Math.floor(Date.now() / 1000) - 3600 // Expired
            };

            const domain = {
                name: "TestAssets",
                version: "1",
                chainId: (await ethers.provider.getNetwork()).chainId,
                verifyingContract: assets.address
            };

            const types = {
                MintRequest: [
                    { name: "to", type: "address" },
                    { name: "tokenId", type: "uint256" },
                    { name: "amount", type: "uint256" },
                    { name: "metadataURI", type: "string" },
                    { name: "nonce", type: "uint256" },
                    { name: "deadline", type: "uint256" }
                ]
            };

            const signature = await admin._signTypedData(domain, types, mintRequest);

            await expect(
                assets.connect(user1).mintWithSignature(mintRequest, signature)
            ).to.be.revertedWith("MightyVerse: expired deadline");
        });
    });

    describe("Batch Minting", function () {
        it("Should batch mint multiple tokens", async function () {
            const recipients = [user1.address, user2.address];
            const amounts = [100, 200];
            const metadataURIs = ["ipfs://metadata1", "ipfs://metadata2"];

            await expect(
                assets.connect(minter).batchMint(recipients, amounts, metadataURIs)
            ).to.emit(assets, "AssetMinted");

            expect(await assets.balanceOf(user1.address, 1)).to.equal(100);
            expect(await assets.balanceOf(user2.address, 2)).to.equal(200);
            expect(await assets.totalSupply()).to.equal(2);
        });
    });

    describe("Royalties", function () {
        it("Should set and get royalty information", async function () {
            // First mint a token
            await assets.connect(minter).batchMint(
                [user1.address],
                [100],
                ["ipfs://test"]
            );

            const tokenId = 1;
            const recipient = user2.address;
            const royaltyFraction = 500; // 5%

            await assets.connect(admin).setTokenRoyalty(tokenId, recipient, royaltyFraction);

            const salePrice = ethers.utils.parseEther("1");
            const [royaltyRecipient, royaltyAmount] = await assets.royaltyInfo(tokenId, salePrice);

            expect(royaltyRecipient).to.equal(recipient);
            expect(royaltyAmount).to.equal(salePrice.mul(royaltyFraction).div(10000));
        });
    });
});