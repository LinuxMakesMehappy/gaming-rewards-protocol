export type GamingRewardsProtocol = {
  "version": "0.1.0",
  "name": "gaming_rewards_protocol",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "protocolState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "registerUser",
      "accounts": [
        {
          "name": "userProfile",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "protocolState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "steamId",
          "type": "string"
        },
        {
          "name": "username",
          "type": "string"
        }
      ]
    },
    {
      "name": "claimAchievement",
      "accounts": [
        {
          "name": "achievement",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userProfile",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "protocolState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "protocolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "achievementId",
          "type": "string"
        },
        {
          "name": "achievementName",
          "type": "string"
        },
        {
          "name": "gameName",
          "type": "string"
        },
        {
          "name": "rarity",
          "type": {
            "defined": "AchievementRarity"
          }
        }
      ]
    },
    {
      "name": "stakeRewards",
      "accounts": [
        {
          "name": "stakingAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userProfile",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakingTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "unstakeRewards",
      "accounts": [
        {
          "name": "stakingAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userProfile",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakingTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateProfile",
      "accounts": [
        {
          "name": "userProfile",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "newUsername",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "ProtocolState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "rewardMint",
            "type": "publicKey"
          },
          {
            "name": "totalUsers",
            "type": "u64"
          },
          {
            "name": "totalAchievementsClaimed",
            "type": "u64"
          },
          {
            "name": "totalRewardsDistributed",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "UserProfile",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "publicKey"
          },
          {
            "name": "steamId",
            "type": "string"
          },
          {
            "name": "username",
            "type": "string"
          },
          {
            "name": "totalAchievements",
            "type": "u64"
          },
          {
            "name": "totalRewards",
            "type": "u64"
          },
          {
            "name": "stakedAmount",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "updatedAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "Achievement",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "achievementId",
            "type": "string"
          },
          {
            "name": "achievementName",
            "type": "string"
          },
          {
            "name": "gameName",
            "type": "string"
          },
          {
            "name": "rarity",
            "type": {
              "defined": "AchievementRarity"
            }
          },
          {
            "name": "rewardAmount",
            "type": "u64"
          },
          {
            "name": "isClaimed",
            "type": "bool"
          },
          {
            "name": "claimedAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "StakingAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "publicKey"
          },
          {
            "name": "stakedAmount",
            "type": "u64"
          },
          {
            "name": "stakedAt",
            "type": "i64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "AchievementRarity",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Common"
          },
          {
            "name": "Rare"
          },
          {
            "name": "Epic"
          },
          {
            "name": "Legendary"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidSteamId",
      "msg": "Invalid Steam ID - must be 17 digits"
    },
    {
      "code": 6001,
      "name": "InvalidUsername",
      "msg": "Invalid username - must be 3-32 characters"
    },
    {
      "code": 6002,
      "name": "AchievementAlreadyClaimed",
      "msg": "Achievement already claimed"
    },
    {
      "code": 6003,
      "name": "InvalidStakeAmount",
      "msg": "Invalid stake amount"
    },
    {
      "code": 6004,
      "name": "InsufficientRewards",
      "msg": "Insufficient rewards"
    },
    {
      "code": 6005,
      "name": "InsufficientStakedAmount",
      "msg": "Insufficient staked amount"
    }
  ]
};

export const IDL: GamingRewardsProtocol = {
  "version": "0.1.0",
  "name": "gaming_rewards_protocol",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "protocolState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "registerUser",
      "accounts": [
        {
          "name": "userProfile",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "protocolState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "steamId",
          "type": "string"
        },
        {
          "name": "username",
          "type": "string"
        }
      ]
    },
    {
      "name": "claimAchievement",
      "accounts": [
        {
          "name": "achievement",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userProfile",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "protocolState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "protocolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "achievementId",
          "type": "string"
        },
        {
          "name": "achievementName",
          "type": "string"
        },
        {
          "name": "gameName",
          "type": "string"
        },
        {
          "name": "rarity",
          "type": {
            "defined": "AchievementRarity"
          }
        }
      ]
    },
    {
      "name": "stakeRewards",
      "accounts": [
        {
          "name": "stakingAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userProfile",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakingTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "unstakeRewards",
      "accounts": [
        {
          "name": "stakingAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userProfile",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakingTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateProfile",
      "accounts": [
        {
          "name": "userProfile",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "newUsername",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "ProtocolState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "rewardMint",
            "type": "publicKey"
          },
          {
            "name": "totalUsers",
            "type": "u64"
          },
          {
            "name": "totalAchievementsClaimed",
            "type": "u64"
          },
          {
            "name": "totalRewardsDistributed",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "UserProfile",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "publicKey"
          },
          {
            "name": "steamId",
            "type": "string"
          },
          {
            "name": "username",
            "type": "string"
          },
          {
            "name": "totalAchievements",
            "type": "u64"
          },
          {
            "name": "totalRewards",
            "type": "u64"
          },
          {
            "name": "stakedAmount",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "updatedAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "Achievement",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "achievementId",
            "type": "string"
          },
          {
            "name": "achievementName",
            "type": "string"
          },
          {
            "name": "gameName",
            "type": "string"
          },
          {
            "name": "rarity",
            "type": {
              "defined": "AchievementRarity"
            }
          },
          {
            "name": "rewardAmount",
            "type": "u64"
          },
          {
            "name": "isClaimed",
            "type": "bool"
          },
          {
            "name": "claimedAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "StakingAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "publicKey"
          },
          {
            "name": "stakedAmount",
            "type": "u64"
          },
          {
            "name": "stakedAt",
            "type": "i64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "AchievementRarity",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Common"
          },
          {
            "name": "Rare"
          },
          {
            "name": "Epic"
          },
          {
            "name": "Legendary"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidSteamId",
      "msg": "Invalid Steam ID - must be 17 digits"
    },
    {
      "code": 6001,
      "name": "InvalidUsername",
      "msg": "Invalid username - must be 3-32 characters"
    },
    {
      "code": 6002,
      "name": "AchievementAlreadyClaimed",
      "msg": "Achievement already claimed"
    },
    {
      "code": 6003,
      "name": "InvalidStakeAmount",
      "msg": "Invalid stake amount"
    },
    {
      "code": 6004,
      "name": "InsufficientRewards",
      "msg": "Insufficient rewards"
    },
    {
      "code": 6005,
      "name": "InsufficientStakedAmount",
      "msg": "Insufficient staked amount"
    }
  ]
};
