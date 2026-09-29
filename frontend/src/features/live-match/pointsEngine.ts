export type WicketType = 'bowled' | 'caught' | 'lbw' | 'runout' | 'stumped';

export type BallEvent = {
  id: string;
  over: number;
  ballInOver: number;
  batsmanId: string;
  bowlerId: string;
  runs: number;
  isWicket: boolean;
  wicketType?: WicketType;
  fielderId?: string;
  isWide?: boolean;
  isBye?: boolean;
  isLegBye?: boolean;
  description: string;
};

export function eventPoints(event: BallEvent): Record<string, number> {
  const pts: Record<string, number> = {};
  const add = (id: string, value: number) => {
    pts[id] = (pts[id] ?? 0) + value;
  };

  const isBatFacing =
    !event.isWide && !event.isBye && !event.isLegBye;

  // Batting — only when batsman is actually credited runs
  if (isBatFacing) {
    add(event.batsmanId, event.runs);
    if (event.runs === 4) add(event.batsmanId, 1);
    if (event.runs === 6) add(event.batsmanId, 2);
  }

  // Bowling — wickets (not runouts)
  if (event.isWicket && event.wicketType && event.wicketType !== 'runout') {
    add(event.bowlerId, 25);
  }

  // Fielding
  if (event.isWicket && event.fielderId) {
    if (event.wicketType === 'caught') add(event.fielderId, 8);
    if (event.wicketType === 'stumped') add(event.fielderId, 12);
    if (event.wicketType === 'runout') add(event.fielderId, 12);
  }

  return pts;
}

export type PlayerMultipliers = {
  isCaptain: boolean;
  isViceCaptain: boolean;
  isPoisoned: boolean;
};

export function applyMultiplier(
  base: number,
  multipliers: PlayerMultipliers
): { final: number; poisonTransfer: number } {
  let final = base;
  if (multipliers.isCaptain) final *= 2;
  if (multipliers.isViceCaptain) final *= 1.5;

  let poisonTransfer = 0;
  if (multipliers.isPoisoned) {
    poisonTransfer = final * 0.5;
    final = final * 0.5;
  }

  return { final, poisonTransfer };
}