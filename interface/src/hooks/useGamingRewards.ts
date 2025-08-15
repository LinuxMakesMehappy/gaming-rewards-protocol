import { useState, useCallback } from 'react';

interface Reward {
    id: string;
    amount: number;
    currency: string;
    status: 'pending' | 'claimed' | 'staked';
    timestamp: number;
    achievementId?: string;
}

export const useGamingRewards = () => {
    const [userRewards, setUserRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(false);

    const claimRewards = useCallback(async (rewardId: string) => {
        setLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setUserRewards(prev => prev.map(reward => 
                reward.id === rewardId 
                    ? { ...reward, status: 'claimed' as const }
                    : reward
            ));
            
            return { success: true };
        } catch (error) {
            console.error('Failed to claim reward:', error);
            return { success: false, error };
        } finally {
            setLoading(false);
        }
    }, []);

    const stakeRewards = useCallback(async (amount: number, lockPeriod: number) => {
        setLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const newReward: Reward = {
                id: `stake_${Date.now()}`,
                amount,
                currency: 'SOL',
                status: 'staked',
                timestamp: Date.now()
            };
            
            setUserRewards(prev => [...prev, newReward]);
            
            return { success: true };
        } catch (error) {
            console.error('Failed to stake rewards:', error);
            return { success: false, error };
        } finally {
            setLoading(false);
        }
    }, []);

    const unstakeRewards = useCallback(async (stakeId: string) => {
        setLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setUserRewards(prev => prev.map(reward => 
                reward.id === stakeId 
                    ? { ...reward, status: 'claimed' as const }
                    : reward
            ));
            
            return { success: true };
        } catch (error) {
            console.error('Failed to unstake rewards:', error);
            return { success: false, error };
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        userRewards,
        claimRewards,
        stakeRewards,
        unstakeRewards,
        loading
    };
};
