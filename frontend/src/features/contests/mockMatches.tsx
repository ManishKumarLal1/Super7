export type MockMatch = {
  id: string;
  teamA: string;
  teamB: string;
  teamAShort: string;
  teamBShort: string;
  format: 'T20' | 'ODI' | 'Test';
  venue: string;
  startTime: string; // ISO
  status: 'upcoming' | 'live';
};

export const MOCK_MATCHES: MockMatch[] = [
  {
    id: 'ind-vs-aus-1',
    teamA: 'India',
    teamB: 'Australia',
    teamAShort: 'IND',
    teamBShort: 'AUS',
    format: 'T20',
    venue: 'Wankhede Stadium, Mumbai',
    startTime: new Date(Date.now() + 1000 * 60 * 45).toISOString(),
    status: 'upcoming',
  },
  {
    id: 'eng-vs-pak-1',
    teamA: 'England',
    teamB: 'Pakistan',
    teamAShort: 'ENG',
    teamBShort: 'PAK',
    format: 'ODI',
    venue: 'Lord\'s, London',
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString(),
    status: 'upcoming',
  },
  {
    id: 'sa-vs-nz-1',
    teamA: 'South Africa',
    teamB: 'New Zealand',
    teamAShort: 'SA',
    teamBShort: 'NZ',
    format: 'T20',
    venue: 'Newlands, Cape Town',
    startTime: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    status: 'live',
  },
];