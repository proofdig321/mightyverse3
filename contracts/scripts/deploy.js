const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying The Mighty Verse contracts...");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    // Deploy CreditToken
    console.log("\n📄 Deploying CreditToken...");
    const CreditToken = await ethers.getContractFactory("CreditToken");
    const creditToken = await CreditToken.deploy(
        "Mighty Verse Credits",
        "MVC",
        "1"
    );
    await creditToken.deployed();
    console.log("✅ CreditToken deployed to:", creditToken.address);

    // Deploy ApprovalRegistry
    console.log("\n📄 Deploying ApprovalRegistry...");
    const ApprovalRegistry = await ethers.getContractFactory("ApprovalRegistry");
    const approvalRegistry = await ApprovalRegistry.deploy(
        "MightyVerseApprovals",
        "1"
    );
    await approvalRegistry.deployed();
    console.log("✅ ApprovalRegistry deployed to:", approvalRegistry.address);

    // Deploy MightyVerseAssets
    console.log("\n📄 Deploying MightyVerseAssets...");
    const MightyVerseAssets = await ethers.getContractFactory("MightyVerseAssets");
    const assets = await MightyVerseAssets.deploy(
        "MightyVerseAssets",
        "1",
        "https://api.mightyverse.io/metadata/"
    );
    await assets.deployed();
    console.log("✅ MightyVerseAssets deployed to:", assets.address);

    // Setup roles and permissions
    console.log("\n🔐 Setting up roles and permissions...");
    
    // Grant roles on CreditToken
    const MINTER_ROLE = await creditToken.MINTER_ROLE();
    const OPERATOR_ROLE = await creditToken.OPERATOR_ROLE();
    
    await creditToken.grantRole(MINTER_ROLE, assets.address);
    console.log("✅ Granted MINTER_ROLE to MightyVerseAssets");
    
    await creditToken.grantRole(OPERATOR_ROLE, assets.address);
    console.log("✅ Granted OPERATOR_ROLE to MightyVerseAssets");

    // Grant roles on ApprovalRegistry
    const APPROVER_ROLE = await approvalRegistry.APPROVER_ROLE();
    await approvalRegistry.grantRole(APPROVER_ROLE, deployer.address);
    console.log("✅ Granted APPROVER_ROLE to deployer");

    // Grant roles on MightyVerseAssets
    const ADMIN_ROLE = await assets.ADMIN_ROLE();
    const CURATOR_ROLE = await assets.CURATOR_ROLE();
    
    await assets.grantRole(ADMIN_ROLE, deployer.address);
    console.log("✅ Granted ADMIN_ROLE to deployer");
    
    await assets.grantRole(CURATOR_ROLE, deployer.address);
    console.log("✅ Granted CURATOR_ROLE to deployer");

    // Mint initial credits for testing
    console.log("\n💰 Minting initial credits for testing...");
    const initialCredits = ethers.utils.parseEther("10000"); // 10,000 credits
    await creditToken.mint(deployer.address, initialCredits);
    console.log("✅ Minted 10,000 credits to deployer");

    // Display deployment summary
    console.log("\n📋 DEPLOYMENT SUMMARY");
    console.log("====================");
    console.log("Network:", (await ethers.provider.getNetwork()).name);
    console.log("Deployer:", deployer.address);
    console.log("CreditToken:", creditToken.address);
    console.log("ApprovalRegistry:", approvalRegistry.address);
    console.log("MightyVerseAssets:", assets.address);

    // Save deployment addresses
    const deploymentInfo = {
        network: (await ethers.provider.getNetwork()).name,
        chainId: (await ethers.provider.getNetwork()).chainId,
        deployer: deployer.address,
        contracts: {
            CreditToken: creditToken.address,
            ApprovalRegistry: approvalRegistry.address,
            MightyVerseAssets: assets.address
        },
        deployedAt: new Date().toISOString(),
        blockNumber: await ethers.provider.getBlockNumber()
    };

    console.log("\n💾 Deployment info saved to deployments.json");
    const fs = require("fs");
    fs.writeFileSync("deployments.json", JSON.stringify(deploymentInfo, null, 2));

    // Test basic functionality
    console.log("\n🧪 Running basic functionality tests...");
    
    // Test credit balance
    const balance = await creditToken.balanceOf(deployer.address);
    console.log("✅ Credit balance:", ethers.utils.formatEther(balance));
    
    // Test operation cost
    const mintCost = await creditToken.getOperationCost("mint_asset");
    console.log("✅ Mint asset cost:", ethers.utils.formatEther(mintCost));
    
    // Test nonce
    const nonce = await assets.getNonce(deployer.address);
    console.log("✅ Current nonce:", nonce.toString());

    console.log("\n🎉 Deployment completed successfully!");
    console.log("📖 Next steps:");
    console.log("   1. Update frontend contract addresses");
    console.log("   2. Configure IPFS metadata base URI");
    console.log("   3. Set up admin signatures for minting");
    console.log("   4. Test end-to-end minting workflow");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });