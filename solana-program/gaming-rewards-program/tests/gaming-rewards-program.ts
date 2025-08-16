import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { GamingRewardsProgram } from "../target/types/gaming_rewards_program";
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

describe("gaming-rewards-program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.GamingRewardsProgram as Program<GamingRewardsProgram>;

  it("Can initialize protocol", async () => {
    // Generate a new keypair for the protocol state
    const protocolState = Keypair.generate();
    const rewardMint = Keypair.generate();
    const protocolRewardAccount = Keypair.generate();

    try {
      await program.methods
        .initializeProtocol(500, 1000000, 1000000000) // 5% fee, min 1 SOL, max 1000 SOL
        .accounts({
          protocolState: protocolState.publicKey,
          authority: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
          rewardMint: rewardMint.publicKey,
          protocolRewardAccount: protocolRewardAccount.publicKey,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([protocolState, rewardMint, protocolRewardAccount])
        .rpc();

      console.log("Protocol initialized successfully!");
    } catch (error) {
      console.log("Error initializing protocol:", error);
    }
  });
});
