import { useMatchesStore } from '../wallet/matchesStore';
import { useFriendsStore } from '../friends/friendsStore';
import { buildLeaderboard, type LeaderboardEntry } from '../leaderboard/leaderboardStore';

export type PublicUser = LeaderboardEntry & {
  isFriend: boolean;
  isMe: boolean;
  tier: 'Rookie' | 'Contender' | 'Pro' | 'Legend';
};

function tierFor(matches: number, winRate: number): PublicUser['tier'] {
  if (matches >= 40 && winRate >= 65) return 'Legend';
  if (matches >= 25 && winRate >= 55) return 'Pro';
  if (matches >= 10) return 'Contender';
  return 'Rookie';
}

export function resolveUser(id: string): PublicUser | null {
  // 'me' shortcut
  if (id === 'me') {
    const { global } = buildLeaderboard();
    const me = global.find((e) => e.isMe);
    if (!me) return null;
    return {
      ...me,
      isFriend: false,
      isMe: true,
      tier: tierFor(me.matchesPlayed, me.winRate),
    };
  }

  // Check friends
  const { friends, global } = buildLeaderboard();
  const asFriend = friends.find((e) => e.id === id);
  if (asFriend) {
    return {
      ...asFriend,
      isFriend: true,
      isMe: false,
      tier: tierFor(asFriend.matchesPlayed, asFriend.winRate),
    };
  }

  // Check global pool
  const asGlobal = global.find((e) => e.id === id);
  if (asGlobal) {
    return {
      ...asGlobal,
      isFriend: false,
      isMe: false,
      tier: tierFor(asGlobal.matchesPlayed, asGlobal.winRate),
    };
  }

  // Fallback: generate a plausible profile from the id hash
  return generateFallback(id);
}

function generateFallback(id: string): PublicUser {
  const seed = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const played = 5 + (seed % 30);
  const wins = Math.floor(played * (0.35 + (seed % 40) / 100));
  const losses = Math.max(0, played - wins - (seed % 4));
  const ties = Math.max(0, played - wins - losses);
  const avgStake = 200 + (seed % 3) * 100;
  const coinsWon = wins * avgStake * 2;

  const names = [
    'Karan Joshi', 'Meera Nair', 'Raj Patel', 'Tanvi Desai',
    'Aditya Bose', 'Riya Chawla', 'Nikhil Reddy', 'Sara Khan',
  ];
  const name = names[seed % names.length];
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2);
  const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;

  return {
    id,
    name,
    avatarInitials: initials,
    matchesPlayed: played,
    wins,
    losses,
    ties,
    coinsWon,
    netCoins: wins * avgStake - losses * avgStake,
    bestScore: 700 + (seed % 200),
    winRate,
    isFriend: false,
    isMe: false,
    tier: tierFor(played, winRate),
  };
}