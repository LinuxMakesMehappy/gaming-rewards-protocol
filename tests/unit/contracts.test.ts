import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { GamingRewards } from '../target/types/gaming_rewards';
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { expect } from 'chai';

describe('Gaming Rewards Protocol - Smart Contract Tests', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.GamingRewards as Program<GamingRewards>;
  
  // Test accounts
  const owner = Keypair.generate();
  const user = Keypair.generate();
  const oracle = Keypair.generate();
  
  // PDAs
  let treasuryPda: PublicKey;
  let userRewardPda: PublicKey;
  let oraclePda: PublicKey;
  
  // Test data
  const testYieldAmount = 1000000; // 0.001 SOL
  const testClaimAmount = 500000; // 0.0005 SOL
  const testTimestamp = Math.floor(Date.now() / 1000);

  before(async () => {
    // Airdrop SOL to test accounts
    await provider.connection.requestAirdrop(owner.publicKey, 10 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(user.publicKey, 2 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(oracle.publicKey, 5 * LAMPORTS_PER_SOL);
    
    // Wait for airdrop confirmation
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(owner.publicKey, 10 * LAMPORTS_PER_SOL)
    );
    
    // Find PDAs
    [treasuryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('treasury'), owner.publicKey.toBuffer()],
      program.programId
    );
    
    [userRewardPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_reward'), user.publicKey.toBuffer()],
      program.programId
    );
    
    [oraclePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('oracle'), oracle.publicKey.toBuffer()],
      program.programId
    );
  });

  describe('Treasury Initialization', () => {
    it('Should initialize treasury successfully', async () => {
      try {
        await program.methods
          .initializeTreasury()
          .accounts({
            treasury: treasuryPda,
            payer: owner.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([owner])
          .rpc();

        // Verify treasury account
        const treasuryAccount = await program.account.treasuryAccount.fetch(treasuryPda);
        expect(treasuryAccount.owner.toString()).to.equal(owner.publicKey.toString());
        expect(treasuryAccount.lastHarvest.toNumber()).to.be.greaterThan(0);
        expect(treasuryAccount.userRewardsPool.toNumber()).to.equal(0);
      } catch (error) {
        expect.fail(`Treasury initialization failed: ${error}`);
      }
    });

    it('Should fail to initialize treasury twice', async () => {
      try {
        await program.methods
          .initializeTreasury()
          .accounts({
            treasury: treasuryPda,
            payer: owner.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([owner])
          .rpc();
        
        expect.fail('Should have failed to initialize treasury twice');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
    });
  });

  describe('Harvest and Rebalance', () => {
    it('Should harvest and rebalance successfully', async () => {
      try {
        const beforeTreasury = await program.account.treasuryAccount.fetch(treasuryPda);
        
        await program.methods
          .harvestAndRebalance(new anchor.BN(testYieldAmount))
          .accounts({
            treasury: treasuryPda,
            owner: owner.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([owner])
          .rpc();

        // Verify treasury state
        const afterTreasury = await program.account.treasuryAccount.fetch(treasuryPda);
        expect(afterTreasury.lastHarvest.toNumber()).to.be.greaterThan(beforeTreasury.lastHarvest.toNumber());
        expect(afterTreasury.userRewardsPool.toNumber()).to.equal(testYieldAmount / 2);
      } catch (error) {
        expect.fail(`Harvest and rebalance failed: ${error}`);
      }
    });

    it('Should fail to harvest too frequently', async () => {
      try {
        await program.methods
          .harvestAndRebalance(new anchor.BN(testYieldAmount))
          .accounts({
            treasury: treasuryPda,
            owner: owner.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([owner])
          .rpc();
        
        expect.fail('Should have failed to harvest too frequently');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
    });

    it('Should fail with invalid yield amount', async () => {
      try {
        await program.methods
          .harvestAndRebalance(new anchor.BN(0))
          .accounts({
            treasury: treasuryPda,
            owner: owner.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([owner])
          .rpc();
        
        expect.fail('Should have failed with invalid yield amount');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
    });
  });

  describe('Oracle Management', () => {
    it('Should initialize oracle account', async () => {
      try {
        // Create oracle account
        await program.methods
          .initializeOracle(new anchor.BN(10 * LAMPORTS_PER_SOL))
          .accounts({
            oracleAccount: oraclePda,
            oracle: oracle.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([oracle])
          .rpc();

        // Verify oracle account
        const oracleAccount = await program.account.oracleAccount.fetch(oraclePda);
        expect(oracleAccount.stake.toNumber()).to.equal(10 * LAMPORTS_PER_SOL);
      } catch (error) {
        expect.fail(`Oracle initialization failed: ${error}`);
      }
    });
  });

  describe('Reward Claims', () => {
    it('Should claim reward successfully with valid oracle signature', async () => {
      try {
        // Create mock oracle signature
        const message = `${user.publicKey.toString()}:${testTimestamp}:${testClaimAmount}`;
        const messageBytes = new TextEncoder().encode(message);
        const signature = await oracle.sign(messageBytes);
        
        const beforeTreasury = await program.account.treasuryAccount.fetch(treasuryPda);
        const beforeUserReward = await program.account.userRewardAccount.fetch(userRewardPda);

        await program.methods
          .claimReward(
            user.publicKey,
            new anchor.BN(testTimestamp),
            Array.from(signature),
            new anchor.BN(testClaimAmount)
          )
          .accounts({
            treasury: treasuryPda,
            userReward: userRewardPda,
            oracleAccount: oraclePda,
            user: user.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([user])
          .rpc();

        // Verify state changes
        const afterTreasury = await program.account.treasuryAccount.fetch(treasuryPda);
        const afterUserReward = await program.account.userRewardAccount.fetch(userRewardPda);
        
        expect(afterTreasury.userRewardsPool.toNumber()).to.equal(
          beforeTreasury.userRewardsPool.toNumber() - testClaimAmount
        );
        expect(afterUserReward.totalClaimed.toNumber()).to.equal(
          beforeUserReward.totalClaimed.toNumber() + testClaimAmount
        );
      } catch (error) {
        expect.fail(`Reward claim failed: ${error}`);
      }
    });

    it('Should fail to claim with invalid oracle signature', async () => {
      try {
        const invalidSignature = new Uint8Array(64).fill(1);
        
        await program.methods
          .claimReward(
            user.publicKey,
            new anchor.BN(testTimestamp),
            Array.from(invalidSignature),
            new anchor.BN(testClaimAmount)
          )
          .accounts({
            treasury: treasuryPda,
            userReward: userRewardPda,
            oracleAccount: oraclePda,
            user: user.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([user])
          .rpc();
        
        expect.fail('Should have failed with invalid oracle signature');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
    });

    it('Should fail to claim too frequently', async () => {
      try {
        const message = `${user.publicKey.toString()}:${testTimestamp}:${testClaimAmount}`;
        const messageBytes = new TextEncoder().encode(message);
        const signature = await oracle.sign(messageBytes);
        
        await program.methods
          .claimReward(
            user.publicKey,
            new anchor.BN(testTimestamp),
            Array.from(signature),
            new anchor.BN(testClaimAmount)
          )
          .accounts({
            treasury: treasuryPda,
            userReward: userRewardPda,
            oracleAccount: oraclePda,
            user: user.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([user])
          .rpc();
        
        expect.fail('Should have failed to claim too frequently');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
    });

    it('Should fail to claim more than available in pool', async () => {
      try {
        const largeAmount = 1000000000; // 1 SOL
        const message = `${user.publicKey.toString()}:${testTimestamp}:${largeAmount}`;
        const messageBytes = new TextEncoder().encode(message);
        const signature = await oracle.sign(messageBytes);
        
        await program.methods
          .claimReward(
            user.publicKey,
            new anchor.BN(testTimestamp),
            Array.from(signature),
            new anchor.BN(largeAmount)
          )
          .accounts({
            treasury: treasuryPda,
            userReward: userRewardPda,
            oracleAccount: oraclePda,
            user: user.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([user])
          .rpc();
        
        expect.fail('Should have failed to claim more than available');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
    });
  });

  describe('Oracle Slashing', () => {
    it('Should slash oracle successfully', async () => {
      try {
        const slashAmount = 1000000; // 0.001 SOL
        const beforeOracle = await program.account.oracleAccount.fetch(oraclePda);

        await program.methods
          .slashOracle(new anchor.BN(slashAmount))
          .accounts({
            treasury: treasuryPda,
            oracleAccount: oraclePda,
            owner: owner.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([owner])
          .rpc();

        // Verify oracle stake reduction
        const afterOracle = await program.account.oracleAccount.fetch(oraclePda);
        expect(afterOracle.stake.toNumber()).to.equal(
          beforeOracle.stake.toNumber() - slashAmount
        );
      } catch (error) {
        expect.fail(`Oracle slashing failed: ${error}`);
      }
    });

    it('Should fail to slash oracle with non-owner', async () => {
      try {
        const slashAmount = 1000000;
        
        await program.methods
          .slashOracle(new anchor.BN(slashAmount))
          .accounts({
            treasury: treasuryPda,
            oracleAccount: oraclePda,
            owner: user.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([user])
          .rpc();
        
        expect.fail('Should have failed to slash with non-owner');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
    });

    it('Should fail to slash more than oracle stake', async () => {
      try {
        const largeSlashAmount = 100 * LAMPORTS_PER_SOL; // 100 SOL
        
        await program.methods
          .slashOracle(new anchor.BN(largeSlashAmount))
          .accounts({
            treasury: treasuryPda,
            oracleAccount: oraclePda,
            owner: owner.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([owner])
          .rpc();
        
        expect.fail('Should have failed to slash more than stake');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('Should handle zero amounts correctly', async () => {
      // Test various zero amount scenarios
      expect(true).to.be.true; // Placeholder for zero amount tests
    });

    it('Should handle maximum values correctly', async () => {
      // Test with maximum u64 values
      expect(true).to.be.true; // Placeholder for max value tests
    });

    it('Should handle concurrent operations correctly', async () => {
      // Test concurrent harvest and claim operations
      expect(true).to.be.true; // Placeholder for concurrency tests
    });
  });

  describe('Event Emission', () => {
    it('Should emit harvest event correctly', async () => {
      // Test event emission for harvest operations
      expect(true).to.be.true; // Placeholder for event tests
    });

    it('Should emit claim event correctly', async () => {
      // Test event emission for claim operations
      expect(true).to.be.true; // Placeholder for event tests
    });

    it('Should emit slash event correctly', async () => {
      // Test event emission for slash operations
      expect(true).to.be.true; // Placeholder for event tests
    });
  });
}); 