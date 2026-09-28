export type PlayerRole = 'BAT' | 'BOWL' | 'AR' | 'WK';

export type DraftPlayer = {
  id: string;
  name: string;
  shortName: string;
  team: 'IND' | 'AUS';
  role: PlayerRole;
  credits: number;
};

export const MOCK_SQUAD: DraftPlayer[] = [
  // India
  { id: 'ind-1', name: 'Rohit Sharma', shortName: 'R. Sharma', team: 'IND', role: 'BAT', credits: 9.0 },
  { id: 'ind-2', name: 'Shubman Gill', shortName: 'S. Gill', team: 'IND', role: 'BAT', credits: 9.5 },
  { id: 'ind-3', name: 'Virat Kohli', shortName: 'V. Kohli', team: 'IND', role: 'BAT', credits: 10.0 },
  { id: 'ind-4', name: 'Suryakumar Yadav', shortName: 'S. Yadav', team: 'IND', role: 'BAT', credits: 9.5 },
  { id: 'ind-5', name: 'Rishabh Pant', shortName: 'R. Pant', team: 'IND', role: 'WK', credits: 9.0 },
  { id: 'ind-6', name: 'Hardik Pandya', shortName: 'H. Pandya', team: 'IND', role: 'AR', credits: 9.0 },
  { id: 'ind-7', name: 'Ravindra Jadeja', shortName: 'R. Jadeja', team: 'IND', role: 'AR', credits: 9.0 },
  { id: 'ind-8', name: 'Kuldeep Yadav', shortName: 'K. Yadav', team: 'IND', role: 'BOWL', credits: 9.0 },
  { id: 'ind-9', name: 'Jasprit Bumrah', shortName: 'J. Bumrah', team: 'IND', role: 'BOWL', credits: 9.5 },
  { id: 'ind-10', name: 'Mohammed Siraj', shortName: 'M. Siraj', team: 'IND', role: 'BOWL', credits: 8.5 },
  { id: 'ind-11', name: 'Arshdeep Singh', shortName: 'A. Singh', team: 'IND', role: 'BOWL', credits: 8.5 },

  // Australia
  { id: 'aus-1', name: 'David Warner', shortName: 'D. Warner', team: 'AUS', role: 'BAT', credits: 9.0 },
  { id: 'aus-2', name: 'Travis Head', shortName: 'T. Head', team: 'AUS', role: 'BAT', credits: 9.5 },
  { id: 'aus-3', name: 'Steve Smith', shortName: 'S. Smith', team: 'AUS', role: 'BAT', credits: 9.5 },
  { id: 'aus-4', name: 'Marnus Labuschagne', shortName: 'M. Labuschagne', team: 'AUS', role: 'BAT', credits: 8.5 },
  { id: 'aus-5', name: 'Glenn Maxwell', shortName: 'G. Maxwell', team: 'AUS', role: 'AR', credits: 9.5 },
  { id: 'aus-6', name: 'Josh Inglis', shortName: 'J. Inglis', team: 'AUS', role: 'WK', credits: 8.0 },
  { id: 'aus-7', name: 'Marcus Stoinis', shortName: 'M. Stoinis', team: 'AUS', role: 'AR', credits: 8.5 },
  { id: 'aus-8', name: 'Pat Cummins', shortName: 'P. Cummins', team: 'AUS', role: 'BOWL', credits: 9.5 },
  { id: 'aus-9', name: 'Mitchell Starc', shortName: 'M. Starc', team: 'AUS', role: 'BOWL', credits: 9.0 },
  { id: 'aus-10', name: 'Adam Zampa', shortName: 'A. Zampa', team: 'AUS', role: 'BOWL', credits: 8.5 },
  { id: 'aus-11', name: 'Josh Hazlewood', shortName: 'J. Hazlewood', team: 'AUS', role: 'BOWL', credits: 9.0 },
];