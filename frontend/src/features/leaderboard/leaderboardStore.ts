import { create } from 'zustand';
import { useMatchesStore } from '../wallet/matchesStore';
import { useFriendsStore } from '../friends/friendsStore';

export type LeaderboardEntry = {
  id: string;
  name: string;
  avatarInitials: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  coinsWon: number;    // net positive from won matches only
  netCoins: number;    // wins - losses
  bestScore: number;
  winRate: number;     // 0-100
  isMe?: boolean;
  isFriend?: boolean;
};

// Mock pool — in production this comes from your backend
const MOCK_POOL: Omit<LeaderboardEntry, 'winRate' | 'isMe' | 'isFriend'>[] = [
  {
    id: 'mock-1',
    name: 'Arjun Mehta',
    avatarInitials: 'AM',
    matchesPlayed: 47,
    wins: 31,
    losses: 12,
    ties: 4,
    coinsWon: 14200,
    netCoins: 8600,
    bestScore: 892.5,
  },
  {
    id: 'mock-2',
    name: 'Neha Kapoor',
    avatarInitials: 'NK',
    matchesPlayed: 38,
    wins: 24,
    losses: 11,
    ties: 3,
    coinsWon: 10800,
    netCoins: 6200,
    bestScore: 856.0,
  },
  {
    id: 'mock-3',
    name: 'Vikram Shah',
    avatarInitials: 'VS',
    matchesPlayed: 62,
    wins: 33,
    losses: 24,
    ties: 5,
    coinsWon: 9600,
    netCoins: 3200,
    bestScore: 921.5,
  },
  {
    id: 'mock-4',
    name: 'Ananya Rao',
    avatarInitials: 'AR',
    matchesPlayed: 29,
    wins: 19,
    losses: 8,
    ties: 2,
    coinsWon: 8400,
    netCoins: 5200,
    bestScore: 812.0,
  },
  {
    id: 'mock-5',
    name: 'Rohan Iyer',
    avatarInitials: 'RI',
    matchesPlayed: 55,
    wins: 27,
    losses: 24,
    ties: 4,
    coinsWon: 7200,
    netCoins: 1400,
    bestScore: 875.0,
  },
  {
    id: 'mock-6',
    name: 'Sanya Malhotra',
    avatarInitials: 'SM',
    matchesPlayed: 22,
    wins: 14,
    losses: 7,
    ties: 1,
    coinsWon: 6400,
    netCoins: 3800,
    bestScore: 788.5,
  },
  {
    id: 'mock-7',
    name: 'Kabir Singh',
    avatarInitials: 'KS',
    matchesPlayed: 34,
    wins: 16,
    losses: 15,
    ties: 3,
    coinsWon: 4800,
    netCoins: 600,
    bestScore: 795.0,
  },
  {
    id: 'mock-8',
    name: 'Diya Patel',
    avatarInitials: 'DP',
    matchesPlayed: 18,
    wins: 11,
    losses: 6,
    ties: 1,
    coinsWon: 4200,
    netCoins: 2600,
    bestScore: 745.0,
  },
  {
    id: 'mock-9',
    name: 'Aryan Kumar',
    avatarInitials: 'AK',
    matchesPlayed: 41,
    wins: 18,
    losses: 20,
    ties: 3,
    coinsWon: 3600,
    netCoins: -1200,
    bestScore: 802.5,
  },
  {
    id: 'mock-10',
    name: 'Ishita Verma',
    avatarInitials: 'IV',
    matchesPlayed: 26,
    wins: 12,
    losses: 12,
    ties: 2,
    coinsWon: 2800,
    netCoins: -200,
    bestScore: 768.0,
  },
];

function withDerivedFields(
  e: Omit<LeaderboardEntry, 'winRate' | 'isMe' | 'isFriend'>,
  flags: { isMe?: boolean; isFriend?: boolean } = {}
): LeaderboardEntry {
  const winRate =
    e.matchesPlayed > 0 ? Math.round((e.wins / e.matchesPlayed) * 100) : 0;
  return { ...e, winRate, ...flags };
}

export function buildLeaderboard(): {
  global: LeaderboardEntry[];
  friends: LeaderboardEntry[];
  myRank: number;
} {
  const history = useMatchesStore.getState().history;
  const friends = useFriendsStore.getState().friends;

  const wins = history.filter((h) => h.result === 'won').length;
  const losses = history.filter((h) => h.result === 'lost').length;
  const ties = history.filter((h) => h.result === 'tied').length;

  const coinsWon = history
    .filter((h) => h.result === 'won')
    .reduce((s, h) => s + h.payout, 0);

  const netCoins = history.reduce((sum, h) => {
    if (h.result === 'won') return sum + h.stake;
    if (h.result === 'lost') return sum - h.stake;
    return sum;
  }, 0);

  const bestScore = history.reduce((max, h) => Math.max(max, h.myPoints), 0);

  const me: LeaderboardEntry = withDerivedFields(
    {
      id: 'me',
      name: 'You',
      avatarInitials: 'ME',
      matchesPlayed: history.length,
      wins,
      losses,
      ties,
      coinsWon,
      netCoins,
      bestScore,
    },
    { isMe: true }
  );

  const friendsPool: LeaderboardEntry[] = friends.map((f, idx) => {
    // Give each friend some plausible stats seeded by their code
    const seed = f.friendCode.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const played = 8 + (seed % 25);
    const friendWins = Math.floor(played * (0.4 + ((seed % 40) / 100)));
    const friendLosses = played - friendWins - (seed % 3);
    const friendTies = Math.max(0, played - friendWins - friendLosses);
    const avgStake = 200 + (seed % 3) * 100;
    const friendCoinsWon = friendWins * avgStake * 2;
    const friendNet = friendWins * avgStake - friendLosses * avgStake;

    return withDerivedFields(
      {
        id: f.id,
        name: f.name,
        avatarInitials: f.avatarInitials,
        matchesPlayed: played,
        wins: friendWins,
        losses: friendLosses,
        ties: friendTies,
        coinsWon: friendCoinsWon,
        netCoins: friendNet,
        bestScore: 700 + (seed % 200),
      },
      { isFriend: true }
    );
  });

  const globalPool = [...MOCK_POOL.map((e) => withDerivedFields(e)), me]
    .sort((a, b) => b.coinsWon - a.coinsWon)
    .map((e, i) => ({ ...e, rank: i + 1 } as LeaderboardEntry & { rank: number }));

  const myEntry = globalPool.find((e) => e.isMe);
  const myRank = myEntry ? (myEntry as any).rank : 0;

  const friendsPoolFull = [...friendsPool, me]
    .sort((a, b) => b.coinsWon - a.coinsWon)
    .map((e, i) => ({ ...e, rank: i + 1 } as LeaderboardEntry & { rank: number }));

  return {
    global: globalPool,
    friends: friendsPoolFull,
    myRank,
  };
}