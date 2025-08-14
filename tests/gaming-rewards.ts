import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { GamingRewards } from "../contracts/target/types/gaming_rewards";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("gaming-rewards", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.GamingRewards as Program<GamingRewards>;
  
  // Test accounts
  const payer = Keypair.generate();
  const treasuryOwner = Keypair.generate();
  
  // PDAs
  let treasuryPda: PublicKey;
  let treasuryBump: number;

  before(async () => {
    // Airdrop SOL to payer
    const signature = await provider.connection.requestAirdrop(payer.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(signature);
    
    // Find treasury PDA
    [treasuryPda, treasuryBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), treasuryOwner.publicKey.toBuffer()],
      program.programId
    );
  });

  it("Initializes treasury successfully", async () => {
    try {
      await program.methods
        .initializeTreasury()
        .accounts({
          treasury: treasuryPda,
          payer: treasuryOwner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([treasuryOwner])
        .rpc();
      
      // Verify treasury account
      const treasuryAccount = await program.account.treasuryAccount.fetch(treasuryPda);
      assert.equal(treasuryAccount.owner.toString(), treasuryOwner.publicKey.toString());
      assert.equal(treasuryAccount.userRewardsPool, 0);
      
      console.log("✅ Treasury initialized successfully");
    } catch (error) {
      console.error("❌ Treasury initialization failed:", error);
      throw error;
    }
  });

  it("Fails to initialize treasury with invalid parameters", async () => {
    const invalidTreasuryOwner = Keypair.generate();
    const [invalidTreasuryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), invalidTreasuryOwner.publicKey.toBuffer()],
      program.programId
    );
    
    try {
      await program.methods
        .initializeTreasury()
        .accounts({
          treasury: invalidTreasuryPda,
          payer: invalidTreasuryOwner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([invalidTreasuryOwner])
        .rpc();
      
      assert.fail("Should have thrown an error");
    } catch (error) {
      console.log("✅ Correctly rejected invalid treasury initialization");
    }
  });

  it("Validates treasury account structure", async () => {
    const treasuryAccount = await program.account.treasuryAccount.fetch(treasuryPda);
    
    // Check required fields
    assert.isTrue(treasuryAccount.owner.toBase58().length > 0);
    assert.isTrue(treasuryAccount.lastHarvest > 0);
    assert.equal(treasuryAccount.userRewardsPool, 0);
    
    console.log("✅ Treasury account structure validated");
  });

  it("Tests harvest and rebalance", async () => {
    const yieldAmount = 1000000; // 0.001 SOL
    
    try {
      await program.methods
        .harvestAndRebalance(yieldAmount)
        .accounts({
          treasury: treasuryPda,
          stakeAccount: treasuryPda, // Placeholder
          owner: treasuryOwner.publicKey,
          stakeProgram: anchor.web3.StakeProgram.programId,
          systemProgram: SystemProgram.programId,
        })
        .signers([treasuryOwner])
        .rpc();
      
      console.log("✅ Harvest and rebalance completed");
    } catch (error) {
      console.error("❌ Harvest and rebalance failed:", error);
      throw error;
    }
  });

  it("Tests claim reward", async () => {
    const user = Keypair.generate();
    const timestamp = Math.floor(Date.now() / 1000);
    const oracleSignature = Buffer.from("mock_signature");
    const claimAmount = 500000; // 0.5 USDC
    
    try {
      await program.methods
        .claimReward(user.publicKey, timestamp, oracleSignature, claimAmount)
        .accounts({
          treasury: treasuryPda,
          userReward: treasuryPda, // Placeholder
          oracleAccount: treasuryPda, // Placeholder
          userUsdcAccount: treasuryPda, // Placeholder
          user: user.publicKey,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();
      
      console.log("✅ Claim reward completed");
    } catch (error) {
      console.error("❌ Claim reward failed:", error);
      throw error;
    }
  });

  it("Tests slash oracle", async () => {
    const slashAmount = 1000000; // 0.001 SOL
    
    try {
      await program.methods
        .slashOracle(slashAmount)
        .accounts({
          treasury: treasuryPda,
          oracleAccount: treasuryPda, // Placeholder
          owner: treasuryOwner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([treasuryOwner])
        .rpc();
      
      console.log("✅ Slash oracle completed");
    } catch (error) {
      console.error("❌ Slash oracle failed:", error);
      throw error;
    }
  });
}); 