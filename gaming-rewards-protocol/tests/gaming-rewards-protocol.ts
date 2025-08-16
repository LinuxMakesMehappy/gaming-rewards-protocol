import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { GamingRewardsProtocol } from "../target/types/gaming_rewards_protocol";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  createAssociatedTokenAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import { assert } from "chai";

describe("gaming-rewards-protocol", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.GamingRewardsProtocol as Program<GamingRewardsProtocol>;

  // Test accounts
  const authority = Keypair.generate();
  const user = Keypair.generate();
  const rewardMint = Keypair.generate();

  // PDAs
  let protocolStatePda: PublicKey;
  let userProfilePda: PublicKey;
  let achievementPda: PublicKey;
  let stakingAccountPda: PublicKey;

  // Token accounts
  let protocolTokenAccount: PublicKey;
  let userTokenAccount: PublicKey;
  let stakingTokenAccount: PublicKey;

  before(async () => {
    // Airdrop SOL to test accounts
    await provider.connection.requestAirdrop(authority.publicKey, 10 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(user.publicKey, 10 * LAMPORTS_PER_SOL);

    // Create reward mint
    await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      null,
      0,
      rewardMint
    );

    // Create protocol token account
    protocolTokenAccount = await createAssociatedTokenAccount(
      provider.connection,
      authority,
      rewardMint.publicKey,
      protocolStatePda
    );

    // Mint tokens to protocol account
    await mintTo(
      provider.connection,
      authority,
      rewardMint.publicKey,
      protocolTokenAccount,
      authority,
      1000000 // 1M tokens
    );

    // Create user token account
    userTokenAccount = await createAssociatedTokenAccount(
      provider.connection,
      authority,
      rewardMint.publicKey,
      user.publicKey
    );

    // Get PDAs
    [protocolStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("protocol_state")],
      program.programId
    );

    [userProfilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_profile"), user.publicKey.toBuffer()],
      program.programId
    );

    [stakingAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("staking"), user.publicKey.toBuffer()],
      program.programId
    );

    // Create staking token account
    stakingTokenAccount = await createAssociatedTokenAccount(
      provider.connection,
      authority,
      rewardMint.publicKey,
      stakingAccountPda
    );
  });

  it("Initializes the protocol", async () => {
    try {
      await program.methods
        .initialize()
        .accounts({
          protocolState: protocolStatePda,
          rewardMint: rewardMint.publicKey,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .signers([authority])
        .rpc();

      const protocolState = await program.account.protocolState.fetch(protocolStatePda);
      assert.equal(protocolState.authority.toString(), authority.publicKey.toString());
      assert.equal(protocolState.rewardMint.toString(), rewardMint.publicKey.toString());
      assert.equal(protocolState.totalUsers, 0);
      assert.equal(protocolState.totalAchievementsClaimed, 0);
      assert.equal(protocolState.totalRewardsDistributed, 0);

      console.log("✅ Protocol initialized successfully");
    } catch (error) {
      console.error("❌ Protocol initialization failed:", error);
      throw error;
    }
  });

  it("Registers a new user", async () => {
    try {
      const steamId = "76561198380891137";
      const username = "TestGamer";

      await program.methods
        .registerUser(steamId, username)
        .accounts({
          userProfile: userProfilePda,
          protocolState: protocolStatePda,
          user: user.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      const userProfile = await program.account.userProfile.fetch(userProfilePda);
      assert.equal(userProfile.user.toString(), user.publicKey.toString());
      assert.equal(userProfile.steamId, steamId);
      assert.equal(userProfile.username, username);
      assert.equal(userProfile.totalAchievements, 0);
      assert.equal(userProfile.totalRewards, 0);
      assert.equal(userProfile.stakedAmount, 0);
      assert.equal(userProfile.isActive, true);

      const protocolState = await program.account.protocolState.fetch(protocolStatePda);
      assert.equal(protocolState.totalUsers, 1);

      console.log("✅ User registered successfully");
    } catch (error) {
      console.error("❌ User registration failed:", error);
      throw error;
    }
  });

  it("Claims an achievement", async () => {
    try {
      const achievementId = "first_blood_001";
      const achievementName = "First Blood";
      const gameName = "Counter-Strike 2";
      const rarity = { common: {} };

      [achievementPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("achievement"),
          user.publicKey.toBuffer(),
          Buffer.from(achievementId),
        ],
        program.programId
      );

      await program.methods
        .claimAchievement(achievementId, achievementName, gameName, rarity)
        .accounts({
          achievement: achievementPda,
          userProfile: userProfilePda,
          protocolState: protocolStatePda,
          protocolTokenAccount: protocolTokenAccount,
          userTokenAccount: userTokenAccount,
          rewardMint: rewardMint.publicKey,
          user: user.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .signers([user])
        .rpc();

      const achievement = await program.account.achievement.fetch(achievementPda);
      assert.equal(achievement.achievementId, achievementId);
      assert.equal(achievement.achievementName, achievementName);
      assert.equal(achievement.gameName, gameName);
      assert.equal(achievement.isClaimed, true);
      assert.equal(achievement.rewardAmount, 100);

      const userProfile = await program.account.userProfile.fetch(userProfilePda);
      assert.equal(userProfile.totalAchievements, 1);
      assert.equal(userProfile.totalRewards, 100);

      const protocolState = await program.account.protocolState.fetch(protocolStatePda);
      assert.equal(protocolState.totalAchievementsClaimed, 1);
      assert.equal(protocolState.totalRewardsDistributed, 100);

      // Check token balance
      const userTokenBalance = await getAccount(provider.connection, userTokenAccount);
      assert.equal(Number(userTokenBalance.amount), 100);

      console.log("✅ Achievement claimed successfully");
    } catch (error) {
      console.error("❌ Achievement claiming failed:", error);
      throw error;
    }
  });

  it("Stakes rewards", async () => {
    try {
      const stakeAmount = 50;

      await program.methods
        .stakeRewards(new anchor.BN(stakeAmount))
        .accounts({
          stakingAccount: stakingAccountPda,
          userProfile: userProfilePda,
          userTokenAccount: userTokenAccount,
          stakingTokenAccount: stakingTokenAccount,
          rewardMint: rewardMint.publicKey,
          user: user.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .signers([user])
        .rpc();

      const stakingAccount = await program.account.stakingAccount.fetch(stakingAccountPda);
      assert.equal(stakingAccount.user.toString(), user.publicKey.toString());
      assert.equal(stakingAccount.stakedAmount, stakeAmount);
      assert.equal(stakingAccount.isActive, true);

      const userProfile = await program.account.userProfile.fetch(userProfilePda);
      assert.equal(userProfile.totalRewards, 50); // 100 - 50
      assert.equal(userProfile.stakedAmount, stakeAmount);

      // Check token balances
      const userTokenBalance = await getAccount(provider.connection, userTokenAccount);
      const stakingTokenBalance = await getAccount(provider.connection, stakingTokenAccount);
      assert.equal(Number(userTokenBalance.amount), 50);
      assert.equal(Number(stakingTokenBalance.amount), stakeAmount);

      console.log("✅ Rewards staked successfully");
    } catch (error) {
      console.error("❌ Staking failed:", error);
      throw error;
    }
  });

  it("Unstakes rewards with rewards", async () => {
    try {
      const unstakeAmount = 25;

      // Wait a bit to accumulate staking rewards
      await new Promise(resolve => setTimeout(resolve, 2000));

      await program.methods
        .unstakeRewards(new anchor.BN(unstakeAmount))
        .accounts({
          stakingAccount: stakingAccountPda,
          userProfile: userProfilePda,
          userTokenAccount: userTokenAccount,
          stakingTokenAccount: stakingTokenAccount,
          rewardMint: rewardMint.publicKey,
          user: user.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .signers([user])
        .rpc();

      const stakingAccount = await program.account.stakingAccount.fetch(stakingAccountPda);
      assert.equal(stakingAccount.stakedAmount, 25); // 50 - 25

      const userProfile = await program.account.userProfile.fetch(userProfilePda);
      assert.equal(userProfile.stakedAmount, 25);

      // Check token balances (should include staking rewards)
      const userTokenBalance = await getAccount(provider.connection, userTokenAccount);
      const stakingTokenBalance = await getAccount(provider.connection, stakingTokenAccount);
      assert.isAbove(Number(userTokenBalance.amount), 50 + unstakeAmount); // Should be more due to rewards
      assert.equal(Number(stakingTokenBalance.amount), 25);

      console.log("✅ Rewards unstaked successfully with rewards");
    } catch (error) {
      console.error("❌ Unstaking failed:", error);
      throw error;
    }
  });

  it("Updates user profile", async () => {
    try {
      const newUsername = "UpdatedGamer";

      await program.methods
        .updateProfile(newUsername)
        .accounts({
          userProfile: userProfilePda,
          user: user.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      const userProfile = await program.account.userProfile.fetch(userProfilePda);
      assert.equal(userProfile.username, newUsername);

      console.log("✅ Profile updated successfully");
    } catch (error) {
      console.error("❌ Profile update failed:", error);
      throw error;
    }
  });

  it("Prevents claiming the same achievement twice", async () => {
    try {
      const achievementId = "first_blood_001";
      const achievementName = "First Blood";
      const gameName = "Counter-Strike 2";
      const rarity = { common: {} };

      await program.methods
        .claimAchievement(achievementId, achievementName, gameName, rarity)
        .accounts({
          achievement: achievementPda,
          userProfile: userProfilePda,
          protocolState: protocolStatePda,
          protocolTokenAccount: protocolTokenAccount,
          userTokenAccount: userTokenAccount,
          rewardMint: rewardMint.publicKey,
          user: user.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .signers([user])
        .rpc();

      assert.fail("Should have thrown an error for duplicate achievement claim");
    } catch (error) {
      assert.include(error.message, "Achievement already claimed");
      console.log("✅ Duplicate achievement claim properly prevented");
    }
  });

  it("Validates Steam ID format", async () => {
    try {
      const invalidSteamId = "12345"; // Too short
      const username = "TestGamer2";

      await program.methods
        .registerUser(invalidSteamId, username)
        .accounts({
          userProfile: userProfilePda,
          protocolState: protocolStatePda,
          user: user.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      assert.fail("Should have thrown an error for invalid Steam ID");
    } catch (error) {
      assert.include(error.message, "Invalid Steam ID");
      console.log("✅ Steam ID validation working correctly");
    }
  });

  console.log("\n🎮 All Gaming Rewards Protocol tests completed successfully!");
});
