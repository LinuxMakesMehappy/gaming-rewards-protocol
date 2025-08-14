import { expect } from 'chai';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { YieldHarvester } from '../../bots/src/services/yield-harvester';
import { GameEventDetector } from '../../bots/src/services/game-event-detector';
import { Logger } from '../../bots/src/utils/logger';
import { SecurityManager } from '../../bots/src/utils/security-manager';

describe('Gaming Rewards Protocol - Bot Unit Tests', () => {
  let connection: Connection;
  let wallet: Keypair;
  let logger: Logger;
  let yieldHarvester: YieldHarvester;
  let gameEventDetector: GameEventDetector;
  let securityManager: SecurityManager;

  before(() => {
    // Setup test environment
    connection = new Connection('http://localhost:8899', 'confirmed');
    wallet = Keypair.generate();
    logger = new Logger();
    securityManager = new SecurityManager(logger);
    yieldHarvester = new YieldHarvester(connection, wallet, logger);
    gameEventDetector = new GameEventDetector(connection, wallet, logger);
  });

  describe('Logger Tests', () => {
    it('Should create logger instance', () => {
      expect(logger).to.be.instanceOf(Logger);
    });

    it('Should log different levels', () => {
      expect(() => {
        logger.info('Test info message');
        logger.warn('Test warning message');
        logger.error('Test error message');
        logger.debug('Test debug message');
      }).to.not.throw();
    });

    it('Should handle error logging', () => {
      const error = new Error('Test error');
      expect(() => {
        logger.error('Error occurred', error);
      }).to.not.throw();
    });
  });

  describe('SecurityManager Tests', () => {
    it('Should create security manager instance', () => {
      expect(securityManager).to.be.instanceOf(SecurityManager);
    });

    it('Should validate environment variables', async () => {
      // Mock environment variables
      process.env.SOLANA_RPC_URL = 'http://localhost:8899';
      process.env.BOT_PRIVATE_KEY = JSON.stringify(Array.from(wallet.secretKey));
      
      expect(() => {
        securityManager.validateEnvironment();
      }).to.not.throw();
    });

    it('Should validate wallet key', () => {
      expect(() => {
        securityManager.validateWalletKey(wallet.secretKey);
      }).to.not.throw();
    });

    it('Should reject invalid wallet key', () => {
      const invalidKey = new Uint8Array(31); // Wrong length
      expect(() => {
        securityManager.validateWalletKey(invalidKey);
      }).to.throw();
    });

    it('Should check rate limits', () => {
      const operation = 'test_operation';
      expect(() => {
        securityManager.checkRateLimit(operation);
      }).to.not.throw();
    });

    it('Should validate amounts', () => {
      expect(() => {
        securityManager.validateAmount(1000);
        securityManager.validateAmount(0);
      }).to.not.throw();
    });

    it('Should reject negative amounts', () => {
      expect(() => {
        securityManager.validateAmount(-1000);
      }).to.throw();
    });

    it('Should sanitize input', () => {
      const input = '<script>alert("xss")</script>';
      const sanitized = securityManager.sanitizeInput(input);
      expect(sanitized).to.not.include('<script>');
    });
  });

  describe('YieldHarvester Tests', () => {
    it('Should create yield harvester instance', () => {
      expect(yieldHarvester).to.be.instanceOf(YieldHarvester);
    });

    it('Should start and stop harvester', async () => {
      expect(() => {
        yieldHarvester.start();
      }).to.not.throw();

      expect(() => {
        yieldHarvester.stop();
      }).to.not.throw();
    });

    it('Should calculate yield amount', async () => {
      const yieldAmount = await yieldHarvester.calculateYieldAmount();
      expect(yieldAmount).to.be.a('number');
      expect(yieldAmount).to.be.greaterThanOrEqual(0);
    });

    it('Should get treasury account', async () => {
      const treasuryAccount = await yieldHarvester.getTreasuryAccount();
      // Should return null or valid account data
      expect(treasuryAccount).to.satisfy((account: any) => {
        return account === null || typeof account === 'object';
      });
    });

    it('Should create harvest instruction', async () => {
      const instruction = await yieldHarvester.createHarvestInstruction(1000000);
      expect(instruction).to.be.an('object');
      expect(instruction.programId).to.be.instanceOf(PublicKey);
    });
  });

  describe('GameEventDetector Tests', () => {
    it('Should create game event detector instance', () => {
      expect(gameEventDetector).to.be.instanceOf(GameEventDetector);
    });

    it('Should start and stop detector', async () => {
      expect(() => {
        gameEventDetector.start();
      }).to.not.throw();

      expect(() => {
        gameEventDetector.stop();
      }).to.not.throw();
    });

    it('Should get verified gamers', async () => {
      const gamers = await gameEventDetector.getVerifiedGamers();
      expect(gamers).to.be.instanceOf(Map);
    });

    it('Should get user achievements', async () => {
      const steamId = '76561198012345678';
      const achievements = await gameEventDetector.getUserAchievements(steamId);
      expect(achievements).to.be.an('array');
    });

    it('Should filter new achievements', async () => {
      const steamId = '76561198012345678';
      const achievements = [
        { id: 'achievement_1', name: 'First Blood', unlocked: true, unlockTime: Date.now() }
      ];
      const newAchievements = await gameEventDetector.filterNewAchievements(steamId, achievements);
      expect(newAchievements).to.be.an('array');
    });

    it('Should calculate reward amount', () => {
      const achievement = { id: 'achievement_1', name: 'First Blood', unlocked: true };
      const rewardAmount = gameEventDetector.calculateRewardAmount(achievement);
      expect(rewardAmount).to.be.a('number');
      expect(rewardAmount).to.be.greaterThan(0);
    });

    it('Should create oracle signature', async () => {
      const walletAddress = wallet.publicKey.toString();
      const rewardAmount = 1000000;
      const signature = await gameEventDetector.createOracleSignature(walletAddress, rewardAmount);
      expect(signature).to.be.a('string');
      expect(signature.length).to.be.greaterThan(0);
    });

    it('Should store oracle signature', async () => {
      const walletAddress = wallet.publicKey.toString();
      const achievement = { id: 'achievement_1', name: 'First Blood' };
      const signature = 'test_signature';
      
      expect(() => {
        gameEventDetector.storeOracleSignature(walletAddress, achievement, signature);
      }).to.not.throw();
    });
  });

  describe('Integration Tests', () => {
    it('Should handle concurrent operations', async () => {
      // Test concurrent start/stop operations
      const promises = [];
      
      for (let i = 0; i < 5; i++) {
        promises.push(yieldHarvester.start());
        promises.push(gameEventDetector.start());
      }
      
      await Promise.all(promises);
      
      // Stop all
      yieldHarvester.stop();
      gameEventDetector.stop();
      
      expect(true).to.be.true; // If we get here, no errors occurred
    });

    it('Should handle error scenarios gracefully', async () => {
      // Test with invalid connection
      const invalidConnection = new Connection('http://invalid-url:8899', 'confirmed');
      const invalidHarvester = new YieldHarvester(invalidConnection, wallet, logger);
      
      expect(() => {
        invalidHarvester.start();
      }).to.not.throw();
      
      invalidHarvester.stop();
    });

    it('Should validate security constraints', () => {
      // Test various security scenarios
      expect(() => {
        securityManager.validateAmount(0);
        securityManager.validateAmount(1000000);
        securityManager.validateAmount(Number.MAX_SAFE_INTEGER);
      }).to.not.throw();
    });
  });

  describe('Performance Tests', () => {
    it('Should handle high-frequency operations', async () => {
      const startTime = Date.now();
      const operations = 100;
      
      for (let i = 0; i < operations; i++) {
        securityManager.checkRateLimit('test_operation');
        securityManager.validateAmount(i);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete 100 operations in reasonable time
      expect(duration).to.be.lessThan(1000); // Less than 1 second
    });

    it('Should handle large data sets', async () => {
      const largeAchievementList = Array.from({ length: 1000 }, (_, i) => ({
        id: `achievement_${i}`,
        name: `Achievement ${i}`,
        unlocked: true,
        unlockTime: Date.now()
      }));
      
      const startTime = Date.now();
      const filtered = await gameEventDetector.filterNewAchievements('test_steam_id', largeAchievementList);
      const endTime = Date.now();
      
      expect(filtered).to.be.an('array');
      expect(endTime - startTime).to.be.lessThan(100); // Less than 100ms
    });
  });

  describe('Error Handling Tests', () => {
    it('Should handle network errors gracefully', async () => {
      const invalidConnection = new Connection('http://invalid-url:8899', 'confirmed');
      const testHarvester = new YieldHarvester(invalidConnection, wallet, logger);
      
      try {
        await testHarvester.getTreasuryAccount();
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
    });

    it('Should handle invalid input gracefully', () => {
      expect(() => {
        securityManager.validateAmount(NaN);
      }).to.throw();
      
      expect(() => {
        securityManager.validateAmount(Infinity);
      }).to.throw();
    });

    it('Should handle missing environment variables', () => {
      const originalEnv = process.env;
      delete process.env.SOLANA_RPC_URL;
      
      expect(() => {
        securityManager.validateEnvironment();
      }).to.throw();
      
      process.env = originalEnv;
    });
  });

  describe('Memory Management Tests', () => {
    it('Should not leak memory during operations', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        securityManager.checkRateLimit(`operation_${i}`);
        securityManager.validateAmount(i);
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).to.be.lessThan(10 * 1024 * 1024);
    });
  });

  describe('Configuration Tests', () => {
    it('Should handle different configuration scenarios', () => {
      // Test with different rate limit configurations
      expect(() => {
        securityManager.checkRateLimit('operation_1');
        securityManager.checkRateLimit('operation_2');
      }).to.not.throw();
    });

    it('Should validate configuration parameters', () => {
      // Test various configuration validations
      expect(() => {
        securityManager.validateAmount(0);
        securityManager.validateAmount(1);
        securityManager.validateAmount(1000000);
      }).to.not.throw();
    });
  });
}); 