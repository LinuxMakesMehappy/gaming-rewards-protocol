import { expect } from 'chai';
import { GamingRewardsBot } from '../bots/src/index';

describe('Gaming Rewards Bot - Simple Test', () => {
  let bot: GamingRewardsBot;

  beforeEach(() => {
    bot = new GamingRewardsBot();
  });

  afterEach(async () => {
    if (bot && bot.isBotRunning()) {
      await bot.stop();
    }
    // Add a small delay to ensure cleanup is complete
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  it('Should create bot instance', () => {
    expect(bot).to.be.instanceOf(GamingRewardsBot);
  });

  it('Should start and stop bot', async () => {
    // Start the bot
    await bot.start();
    expect(bot.isBotRunning()).to.be.true;
    
    // Stop the bot
    await bot.stop();
    expect(bot.isBotRunning()).to.be.false;
  });

  it('Should handle multiple start/stop cycles', async () => {
    // First cycle
    await bot.start();
    expect(bot.isBotRunning()).to.be.true;
    await bot.stop();
    expect(bot.isBotRunning()).to.be.false;
    
    // Second cycle
    await bot.start();
    expect(bot.isBotRunning()).to.be.true;
    await bot.stop();
    expect(bot.isBotRunning()).to.be.false;
  });
});
