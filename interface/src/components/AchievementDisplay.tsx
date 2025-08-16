import React, { useState, useEffect } from 'react';

interface Achievement {
    id: string;
    name: string;
    description: string;
    gameName: string;
    unlockedAt: number;
    rarity: number;
    claimed?: boolean;
}

interface AchievementDisplayProps {
    steamId: string;
    onClaim: (achievementId: string) => Promise<void>;
    loading?: boolean;
}

export const AchievementDisplay: React.FC<AchievementDisplayProps> = ({ 
    steamId, 
    onClaim, 
    loading = false 
}) => {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [filter, setFilter] = useState<'all' | 'unclaimed' | 'claimed'>('all');
    const [sortBy, setSortBy] = useState<'date' | 'rarity' | 'name'>('date');

    useEffect(() => {
        // Mock achievements - in production, this would fetch from API
        const mockAchievements: Achievement[] = [
            {
                id: 'first_blood',
                name: 'First Blood',
                description: 'Get your first kill in a match',
                gameName: 'Counter-Strike 2',
                unlockedAt: Date.now() - 86400000, // 1 day ago
                rarity: 85,
                claimed: false
            },
            {
                id: 'veteran',
                name: 'Veteran',
                description: 'Play 100 matches',
                gameName: 'Counter-Strike 2',
                unlockedAt: Date.now() - 172800000, // 2 days ago
                rarity: 60,
                claimed: true
            },
            {
                id: 'sharpshooter',
                name: 'Sharpshooter',
                description: 'Get 50 headshots',
                gameName: 'Counter-Strike 2',
                unlockedAt: Date.now() - 259200000, // 3 days ago
                rarity: 75,
                claimed: false
            }
        ];

        setAchievements(mockAchievements);
    }, [steamId]);

    const handleClaim = async (achievementId: string) => {
        try {
            await onClaim(achievementId);
            
            // Update local state
            setAchievements(prev => prev.map(achievement => 
                achievement.id === achievementId 
                    ? { ...achievement, claimed: true }
                    : achievement
            ));
        } catch (error) {
            console.error('Failed to claim achievement:', error);
        }
    };

    const filteredAchievements = achievements.filter(achievement => {
        if (filter === 'unclaimed') return !achievement.claimed;
        if (filter === 'claimed') return achievement.claimed;
        return true;
    });

    const sortedAchievements = [...filteredAchievements].sort((a, b) => {
        switch (sortBy) {
            case 'date':
                return b.unlockedAt - a.unlockedAt;
            case 'rarity':
                return b.rarity - a.rarity;
            case 'name':
                return a.name.localeCompare(b.name);
            default:
                return 0;
        }
    });

    const getRarityColor = (rarity: number) => {
        if (rarity >= 90) return 'text-purple-400';
        if (rarity >= 75) return 'text-blue-400';
        if (rarity >= 50) return 'text-green-400';
        return 'text-gray-400';
    };

    const getRarityLabel = (rarity: number) => {
        if (rarity >= 90) return 'Legendary';
        if (rarity >= 75) return 'Rare';
        if (rarity >= 50) return 'Uncommon';
        return 'Common';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-300">Loading achievements...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters and Sorting */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            filter === 'all' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                    >
                        All ({achievements.length})
                    </button>
                    <button
                        onClick={() => setFilter('unclaimed')}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            filter === 'unclaimed' 
                                ? 'bg-green-600 text-white' 
                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                    >
                        Unclaimed ({achievements.filter(a => !a.claimed).length})
                    </button>
                    <button
                        onClick={() => setFilter('claimed')}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            filter === 'claimed' 
                                ? 'bg-purple-600 text-white' 
                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                    >
                        Claimed ({achievements.filter(a => a.claimed).length})
                    </button>
                </div>

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="date">Sort by Date</option>
                    <option value="rarity">Sort by Rarity</option>
                    <option value="name">Sort by Name</option>
                </select>
            </div>

            {/* Achievements Grid */}
            {sortedAchievements.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-gray-400 text-lg">No achievements found</div>
                    <div className="text-gray-500 text-sm mt-2">
                        {filter === 'unclaimed' 
                            ? 'All achievements have been claimed!' 
                            : 'Start playing to earn achievements'
                        }
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedAchievements.map((achievement, index) => (
                        <div
                            key={achievement.id}
                            className={`bg-white/5 backdrop-blur-sm rounded-xl p-4 border transition-all duration-200 hover:scale-105 ${
                                achievement.claimed 
                                    ? 'border-green-500/30 bg-green-500/5' 
                                    : 'border-white/20 hover:border-blue-500/50'
                            }`}
                        >
                            <div>
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <h4 className="text-white font-semibold text-sm mb-1">
                                        {achievement.name}
                                    </h4>
                                    <p className="text-gray-400 text-xs mb-2">
                                        {achievement.description}
                                    </p>
                                    <div className="text-gray-500 text-xs">
                                        {achievement.gameName}
                                    </div>
                                </div>
                                
                                {achievement.claimed && (
                                    <div className="ml-2">
                                        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <span className={`text-xs font-medium ${getRarityColor(achievement.rarity)}`}>
                                        {getRarityLabel(achievement.rarity)}
                                    </span>
                                    <span className="text-gray-500 text-xs">
                                        {achievement.rarity}%
                                    </span>
                                </div>

                                <div className="text-gray-500 text-xs">
                                    {new Date(achievement.unlockedAt).toLocaleDateString()}
                                </div>
                            </div>

                            {!achievement.claimed && (
                                <button
                                    onClick={() => handleClaim(achievement.id)}
                                    className="w-full mt-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium py-2 px-4 rounded-lg transition-all duration-200"
                                >
                                    Claim Reward
                                </button>
                            )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
