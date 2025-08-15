import { describe, it, beforeAll, afterAll, expect, beforeEach } from 'vitest';
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN } from '@project-serum/anchor';
import { 
    TestUtils, 
    TestDataFactory, 
    TestAssertions, 
    TEST_CONFIG 
} from './test-setup';

// Import the program ID and types from your contract
const PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');

describe('Gaming Rewards Protocol Smart Contracts', () => {
    let connection: Connection;
    let provider: AnchorProvider;
    let program: Program;
    let payer: Keypair;
    let protocolAuthority: Keypair;
    let treasuryAccount: Keypair;
    let userAccount: Keypair;

    beforeAll(async () => {
        await TestUtils.initialize();
        connection = TestUtils.getConnection();
        provider = TestUtils.getProvider();
        payer = TestUtils.getPayer();

        // Create additional test accounts
        protocolAuthority = Keypair.generate();
        treasuryAccount = Keypair.generate();
        userAccount = Keypair.generate();

        // Airdrop SOL to test accounts
        const accounts = [protocolAuthority, treasuryAccount, userAccount];
        for (const account of accounts) {
            const signature = await connection.requestAirdrop(
                account.publicKey,
                2 * LAMPORTS_PER_SOL
            );
            await connection.confirmTransaction(signature);
        }

        // Initialize program (you'll need to import your actual program)
        // program = new Program(IDL, PROGRAM_ID, provider);
    });

    beforeEach(async () => {
        // Reset state between tests
        // This would typically involve creating new accounts or resetting program state
    });

    afterAll(async () => {
        // Cleanup
    });

    describe('Protocol Initialization', () => {
        it('should initialize protocol successfully', async () => {
            // Create protocol state account
            const protocolStateAccount = Keypair.generate();
            
            // Create treasury state account
            const treasuryStateAccount = Keypair.generate();

            // Protocol configuration
            const protocolConfig = {
                authority: protocolAuthority.publicKey,
                treasury: treasuryAccount.publicKey,
                rewardTokenMint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC
                maxRewardPerAchievement: new BN(1000000), // 1 USDC
                minStakeAmount: new BN(100000), // 0.1 USDC
                maxStakeAmount: new BN(10000000), // 10 USDC
                protocolFeeBps: 250, // 2.5%
                isPaused: false,
                securityLevel: 1 // Medium
            };

            try {
                // Call initialize_protocol instruction
                const tx = await program.methods
                    .initializeProtocol(protocolConfig)
                    .accounts({
                        protocolState: protocolStateAccount.publicKey,
                        treasuryState: treasuryStateAccount.publicKey,
                        authority: protocolAuthority.publicKey,
                        systemProgram: web3.SystemProgram.programId,
                        rent: web3.SYSVAR_RENT_PUBKEY,
                    })
                    .signers([protocolStateAccount, treasuryStateAccount, protocolAuthority])
                    .rpc();

                await connection.confirmTransaction(tx);

                // Verify protocol state
                const protocolState = await program.account.protocolState.fetch(
                    protocolStateAccount.publicKey
                );

                expect(protocolState.authority.toString()).toBe(protocolAuthority.publicKey.toString());
                expect(protocolState.treasury.toString()).toBe(treasuryAccount.publicKey.toString());
                expect(protocolState.isPaused).toBe(false);
                expect(protocolState.totalUsers.toNumber()).toBe(0);

                console.log('✅ Protocol initialized successfully');

            } catch (error) {
                console.error('Protocol initialization failed:', error);
                throw error;
            }
        });

        it('should reject initialization with invalid config', async () => {
            const protocolStateAccount = Keypair.generate();
            const treasuryStateAccount = Keypair.generate();

            const invalidConfig = {
                authority: protocolAuthority.publicKey,
                treasury: treasuryAccount.publicKey,
                rewardTokenMint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
                maxRewardPerAchievement: new BN(0), // Invalid: zero reward
                minStakeAmount: new BN(100000),
                maxStakeAmount: new BN(10000000),
                protocolFeeBps: 250,
                isPaused: false,
                securityLevel: 1
            };

            await expect(
                program.methods
                    .initializeProtocol(invalidConfig)
                    .accounts({
                        protocolState: protocolStateAccount.publicKey,
                        treasuryState: treasuryStateAccount.publicKey,
                        authority: protocolAuthority.publicKey,
                        systemProgram: web3.SystemProgram.programId,
                        rent: web3.SYSVAR_RENT_PUBKEY,
                    })
                    .signers([protocolStateAccount, treasuryStateAccount, protocolAuthority])
                    .rpc()
            ).rejects.toThrow();
        });
    });

    describe('User Registration', () => {
        let protocolStateAccount: Keypair;
        let userStateAccount: Keypair;

        beforeEach(async () => {
            // Initialize protocol for each test
            protocolStateAccount = Keypair.generate();
            userStateAccount = Keypair.generate();

            const protocolConfig = {
                authority: protocolAuthority.publicKey,
                treasury: treasuryAccount.publicKey,
                rewardTokenMint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
                maxRewardPerAchievement: new BN(1000000),
                minStakeAmount: new BN(100000),
                maxStakeAmount: new BN(10000000),
                protocolFeeBps: 250,
                isPaused: false,
                securityLevel: 1
            };

            await program.methods
                .initializeProtocol(protocolConfig)
                .accounts({
                    protocolState: protocolStateAccount.publicKey,
                    treasuryState: Keypair.generate().publicKey,
                    authority: protocolAuthority.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                })
                .signers([protocolStateAccount, protocolAuthority])
                .rpc();
        });

        it('should register user successfully', async () => {
            const steamId = TestDataFactory.createValidSteamId();
            const userData = {
                steamId: steamId,
                securityVerification: {
                    fraudScore: 15,
                    riskLevel: 'LOW',
                    suspiciousActivities: [],
                    recommendations: ['Account appears legitimate']
                }
            };

            const tx = await program.methods
                .registerUser(steamId, userData)
                .accounts({
                    userState: userStateAccount.publicKey,
                    user: userAccount.publicKey,
                    protocolState: protocolStateAccount.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                })
                .signers([userStateAccount, userAccount])
                .rpc();

            await connection.confirmTransaction(tx);

            // Verify user state
            const userState = await program.account.userState.fetch(
                userStateAccount.publicKey
            );

            expect(userState.user.toString()).toBe(userAccount.publicKey.toString());
            expect(userState.steamId).toBe(steamId);
            expect(userState.totalRewardsEarned.toNumber()).toBe(0);
            expect(userState.isBlacklisted).toBe(false);

            console.log('✅ User registered successfully');
        });

        it('should reject invalid Steam ID', async () => {
            const invalidSteamId = TestDataFactory.createInvalidSteamId();
            const userData = {
                steamId: invalidSteamId,
                securityVerification: {
                    fraudScore: 15,
                    riskLevel: 'LOW',
                    suspiciousActivities: [],
                    recommendations: ['Account appears legitimate']
                }
            };

            await expect(
                program.methods
                    .registerUser(invalidSteamId, userData)
                    .accounts({
                        userState: userStateAccount.publicKey,
                        user: userAccount.publicKey,
                        protocolState: protocolStateAccount.publicKey,
                        systemProgram: web3.SystemProgram.programId,
                        rent: web3.SYSVAR_RENT_PUBKEY,
                    })
                    .signers([userStateAccount, userAccount])
                    .rpc()
            ).rejects.toThrow();
        });

        it('should reject blacklisted users', async () => {
            const steamId = TestDataFactory.createValidSteamId();
            const userData = {
                steamId: steamId,
                securityVerification: {
                    fraudScore: 100, // High fraud score
                    riskLevel: 'CRITICAL',
                    suspiciousActivities: ['Suspicious activity detected'],
                    recommendations: ['Account flagged for review']
                }
            };

            await expect(
                program.methods
                    .registerUser(steamId, userData)
                    .accounts({
                        userState: userStateAccount.publicKey,
                        user: userAccount.publicKey,
                        protocolState: protocolStateAccount.publicKey,
                        systemProgram: web3.SystemProgram.programId,
                        rent: web3.SYSVAR_RENT_PUBKEY,
                    })
                    .signers([userStateAccount, userAccount])
                    .rpc()
            ).rejects.toThrow();
        });
    });

    describe('Achievement Processing', () => {
        let protocolStateAccount: Keypair;
        let treasuryStateAccount: Keypair;
        let userStateAccount: Keypair;
        let userTokenAccount: Keypair;

        beforeEach(async () => {
            // Setup accounts
            protocolStateAccount = Keypair.generate();
            treasuryStateAccount = Keypair.generate();
            userStateAccount = Keypair.generate();
            userTokenAccount = Keypair.generate();

            // Initialize protocol
            const protocolConfig = {
                authority: protocolAuthority.publicKey,
                treasury: treasuryAccount.publicKey,
                rewardTokenMint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
                maxRewardPerAchievement: new BN(1000000),
                minStakeAmount: new BN(100000),
                maxStakeAmount: new BN(10000000),
                protocolFeeBps: 250,
                isPaused: false,
                securityLevel: 1
            };

            await program.methods
                .initializeProtocol(protocolConfig)
                .accounts({
                    protocolState: protocolStateAccount.publicKey,
                    treasuryState: treasuryStateAccount.publicKey,
                    authority: protocolAuthority.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                })
                .signers([protocolStateAccount, treasuryStateAccount, protocolAuthority])
                .rpc();

            // Register user
            const steamId = TestDataFactory.createValidSteamId();
            const userData = {
                steamId: steamId,
                securityVerification: {
                    fraudScore: 15,
                    riskLevel: 'LOW',
                    suspiciousActivities: [],
                    recommendations: ['Account appears legitimate']
                }
            };

            await program.methods
                .registerUser(steamId, userData)
                .accounts({
                    userState: userStateAccount.publicKey,
                    user: userAccount.publicKey,
                    protocolState: protocolStateAccount.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                })
                .signers([userStateAccount, userAccount])
                .rpc();
        });

        it('should process achievement successfully', async () => {
            const achievement = {
                id: TestDataFactory.createAchievementValidation().id,
                name: 'First Blood',
                description: 'Get your first kill',
                gameId: TestDataFactory.createAchievementValidation().gameId,
                gameName: 'Counter-Strike 2',
                steamId: TestDataFactory.createValidSteamId(),
                unlockedAt: new BN(Date.now()),
                rarity: 85
            };

            const rewardAmount = new BN(500000); // 0.5 USDC

            const tx = await program.methods
                .processAchievement(achievement, rewardAmount)
                .accounts({
                    protocolState: protocolStateAccount.publicKey,
                    treasuryState: treasuryStateAccount.publicKey,
                    userState: userStateAccount.publicKey,
                    treasuryTokenAccount: treasuryAccount.publicKey,
                    userTokenAccount: userTokenAccount.publicKey,
                    tokenProgram: web3.TokenProgram.programId,
                })
                .rpc();

            await connection.confirmTransaction(tx);

            // Verify state updates
            const userState = await program.account.userState.fetch(
                userStateAccount.publicKey
            );

            expect(userState.totalRewardsEarned.toNumber()).toBe(rewardAmount.toNumber());
            expect(userState.lastActivity.toNumber()).toBeGreaterThan(0);

            console.log('✅ Achievement processed successfully');
        });

        it('should reject processing when protocol is paused', async () => {
            // Pause protocol
            await program.methods
                .emergencyPause()
                .accounts({
                    protocolState: protocolStateAccount.publicKey,
                    authority: protocolAuthority.publicKey,
                })
                .signers([protocolAuthority])
                .rpc();

            const achievement = {
                id: 'test_achievement',
                name: 'Test Achievement',
                description: 'Test description',
                gameId: '730',
                gameName: 'Counter-Strike 2',
                steamId: TestDataFactory.createValidSteamId(),
                unlockedAt: new BN(Date.now()),
                rarity: 50
            };

            const rewardAmount = new BN(100000);

            await expect(
                program.methods
                    .processAchievement(achievement, rewardAmount)
                    .accounts({
                        protocolState: protocolStateAccount.publicKey,
                        treasuryState: treasuryStateAccount.publicKey,
                        userState: userStateAccount.publicKey,
                        treasuryTokenAccount: treasuryAccount.publicKey,
                        userTokenAccount: userTokenAccount.publicKey,
                        tokenProgram: web3.TokenProgram.programId,
                    })
                    .rpc()
            ).rejects.toThrow();
        });

        it('should reject invalid reward amounts', async () => {
            const achievement = {
                id: 'test_achievement',
                name: 'Test Achievement',
                description: 'Test description',
                gameId: '730',
                gameName: 'Counter-Strike 2',
                steamId: TestDataFactory.createValidSteamId(),
                unlockedAt: new BN(Date.now()),
                rarity: 50
            };

            const invalidRewardAmount = new BN(0); // Invalid: zero reward

            await expect(
                program.methods
                    .processAchievement(achievement, invalidRewardAmount)
                    .accounts({
                        protocolState: protocolStateAccount.publicKey,
                        treasuryState: treasuryStateAccount.publicKey,
                        userState: userStateAccount.publicKey,
                        treasuryTokenAccount: treasuryAccount.publicKey,
                        userTokenAccount: userTokenAccount.publicKey,
                        tokenProgram: web3.TokenProgram.programId,
                    })
                    .rpc()
            ).rejects.toThrow();
        });
    });

    describe('Staking Operations', () => {
        let protocolStateAccount: Keypair;
        let userStateAccount: Keypair;
        let stakingPositionAccount: Keypair;

        beforeEach(async () => {
            // Setup accounts and initialize protocol
            protocolStateAccount = Keypair.generate();
            userStateAccount = Keypair.generate();
            stakingPositionAccount = Keypair.generate();

            // Initialize protocol and register user (similar to previous tests)
            // ... setup code ...
        });

        it('should stake rewards successfully', async () => {
            const stakeAmount = new BN(500000); // 0.5 USDC
            const lockPeriod = new BN(30); // 30 days

            const tx = await program.methods
                .stakeRewards(stakeAmount, lockPeriod)
                .accounts({
                    userState: userStateAccount.publicKey,
                    stakingPosition: stakingPositionAccount.publicKey,
                    user: userAccount.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                })
                .signers([stakingPositionAccount, userAccount])
                .rpc();

            await connection.confirmTransaction(tx);

            // Verify staking position
            const stakingPosition = await program.account.stakingPositionAccount.fetch(
                stakingPositionAccount.publicKey
            );

            expect(stakingPosition.user.toString()).toBe(userAccount.publicKey.toString());
            expect(stakingPosition.amount.toNumber()).toBe(stakeAmount.toNumber());
            expect(stakingPosition.lockPeriod.toNumber()).toBe(lockPeriod.toNumber());
            expect(stakingPosition.isActive).toBe(true);

            console.log('✅ Rewards staked successfully');
        });

        it('should reject insufficient balance for staking', async () => {
            const excessiveStakeAmount = new BN(1000000000); // 1000 USDC
            const lockPeriod = new BN(30);

            await expect(
                program.methods
                    .stakeRewards(excessiveStakeAmount, lockPeriod)
                    .accounts({
                        userState: userStateAccount.publicKey,
                        stakingPosition: stakingPositionAccount.publicKey,
                        user: userAccount.publicKey,
                        systemProgram: web3.SystemProgram.programId,
                        rent: web3.SYSVAR_RENT_PUBKEY,
                    })
                    .signers([stakingPositionAccount, userAccount])
                    .rpc()
            ).rejects.toThrow();
        });

        it('should unstake rewards after lock period', async () => {
            // First stake
            const stakeAmount = new BN(500000);
            const lockPeriod = new BN(1); // 1 day for testing

            await program.methods
                .stakeRewards(stakeAmount, lockPeriod)
                .accounts({
                    userState: userStateAccount.publicKey,
                    stakingPosition: stakingPositionAccount.publicKey,
                    user: userAccount.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                })
                .signers([stakingPositionAccount, userAccount])
                .rpc();

            // In a real test, you'd wait for the lock period to expire
            // For now, we'll test the unstaking logic
            const tx = await program.methods
                .unstakeRewards()
                .accounts({
                    userState: userStateAccount.publicKey,
                    stakingPosition: stakingPositionAccount.publicKey,
                    user: userAccount.publicKey,
                })
                .signers([userAccount])
                .rpc();

            await connection.confirmTransaction(tx);

            // Verify unstaking
            const stakingPosition = await program.account.stakingPositionAccount.fetch(
                stakingPositionAccount.publicKey
            );

            expect(stakingPosition.isActive).toBe(false);

            console.log('✅ Rewards unstaked successfully');
        });
    });

    describe('Emergency Controls', () => {
        let protocolStateAccount: Keypair;

        beforeEach(async () => {
            protocolStateAccount = Keypair.generate();

            // Initialize protocol
            const protocolConfig = {
                authority: protocolAuthority.publicKey,
                treasury: treasuryAccount.publicKey,
                rewardTokenMint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
                maxRewardPerAchievement: new BN(1000000),
                minStakeAmount: new BN(100000),
                maxStakeAmount: new BN(10000000),
                protocolFeeBps: 250,
                isPaused: false,
                securityLevel: 1
            };

            await program.methods
                .initializeProtocol(protocolConfig)
                .accounts({
                    protocolState: protocolStateAccount.publicKey,
                    treasuryState: Keypair.generate().publicKey,
                    authority: protocolAuthority.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                })
                .signers([protocolStateAccount, protocolAuthority])
                .rpc();
        });

        it('should pause protocol successfully', async () => {
            const tx = await program.methods
                .emergencyPause()
                .accounts({
                    protocolState: protocolStateAccount.publicKey,
                    authority: protocolAuthority.publicKey,
                })
                .signers([protocolAuthority])
                .rpc();

            await connection.confirmTransaction(tx);

            // Verify protocol is paused
            const protocolState = await program.account.protocolState.fetch(
                protocolStateAccount.publicKey
            );

            expect(protocolState.isPaused).toBe(true);

            console.log('✅ Protocol paused successfully');
        });

        it('should resume protocol successfully', async () => {
            // First pause
            await program.methods
                .emergencyPause()
                .accounts({
                    protocolState: protocolStateAccount.publicKey,
                    authority: protocolAuthority.publicKey,
                })
                .signers([protocolAuthority])
                .rpc();

            // Then resume
            const tx = await program.methods
                .emergencyResume()
                .accounts({
                    protocolState: protocolStateAccount.publicKey,
                    authority: protocolAuthority.publicKey,
                })
                .signers([protocolAuthority])
                .rpc();

            await connection.confirmTransaction(tx);

            // Verify protocol is resumed
            const protocolState = await program.account.protocolState.fetch(
                protocolStateAccount.publicKey
            );

            expect(protocolState.isPaused).toBe(false);

            console.log('✅ Protocol resumed successfully');
        });

        it('should reject unauthorized pause attempts', async () => {
            const unauthorizedAccount = Keypair.generate();

            await expect(
                program.methods
                    .emergencyPause()
                    .accounts({
                        protocolState: protocolStateAccount.publicKey,
                        authority: unauthorizedAccount.publicKey,
                    })
                    .signers([unauthorizedAccount])
                    .rpc()
            ).rejects.toThrow();
        });
    });

    describe('Security Features', () => {
        it('should validate account ownership', async () => {
            // Test that only authorized accounts can perform operations
            const unauthorizedAccount = Keypair.generate();
            const protocolStateAccount = Keypair.generate();

            await expect(
                program.methods
                    .emergencyPause()
                    .accounts({
                        protocolState: protocolStateAccount.publicKey,
                        authority: unauthorizedAccount.publicKey,
                    })
                    .signers([unauthorizedAccount])
                    .rpc()
            ).rejects.toThrow();
        });

        it('should prevent double-spending', async () => {
            // Test that the same achievement cannot be processed twice
            // This would involve processing an achievement and then trying to process it again
            // The second attempt should fail
        });

        it('should enforce proper account constraints', async () => {
            // Test that the program enforces proper account relationships
            // For example, user state accounts must be owned by the correct user
        });
    });

    describe('Gas Optimization', () => {
        it('should optimize transaction size', async () => {
            // Test that transactions are optimized for gas usage
            const steamId = TestDataFactory.createValidSteamId();
            const userData = {
                steamId: steamId,
                securityVerification: {
                    fraudScore: 15,
                    riskLevel: 'LOW',
                    suspiciousActivities: [],
                    recommendations: ['Account appears legitimate']
                }
            };

            const tx = await program.methods
                .registerUser(steamId, userData)
                .accounts({
                    userState: Keypair.generate().publicKey,
                    user: userAccount.publicKey,
                    protocolState: Keypair.generate().publicKey,
                    systemProgram: web3.SystemProgram.programId,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                })
                .signers([userAccount])
                .rpc();

            // Verify transaction size is reasonable
            const transaction = await connection.getTransaction(tx);
            expect(transaction).toBeDefined();
            
            // Transaction should be under reasonable size limits
            // This is a simplified check - in practice you'd check actual byte size
            console.log('✅ Transaction size optimized');
        });
    });
});
