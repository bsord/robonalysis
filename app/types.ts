// Shared minimal types used across app components. Keep fields to what's actually accessed.

export type Team = {
  id?: number | string;
  number?: number | string;
  team_name?: string;
  organization?: string;
  robot_name?: string | null;
  grade?: string | null;
  location?: { city?: string; region?: string; country?: string; postcode?: string } | null;
  program?: { id?: number; name?: string } | null;
};

export type EventDivision = { id?: number | string; name?: string };

export type Event = {
  id?: number | string;
  name?: string;
  start?: string;
  end?: string;
  level?: string | null;
  event_type?: string | null;
  ongoing?: boolean | null;
  awards_finalized?: boolean | null;
  location?: { venue?: string | null } | null;
  divisions?: EventDivision[] | null;
  season?: { id?: number | string; code?: string; name?: string } | null;
  // Enriched fields per team
  teamRank?: number | null;
  teamDivision?: string | null;
};

export type MatchTeamRef = {
  team?: { id?: number | string; name?: string; number?: string | number } | null;
  team_id?: number | string; // alternative shapes
  id?: number | string; // alternative shapes
};

export type Alliance = {
  color?: string;
  score?: number | null;
  teams?: MatchTeamRef[] | null;
};

export type Match = {
  id?: string | number;
  name?: string;
  round?: string | number;
  matchnum?: string | number;
  instance?: string | number;
  field?: string | number;
  scheduled?: string;
  started?: string;
  updated_at?: string;
  event?: { id?: number | string; name?: string } | null;
  division?: { id?: number | string; name?: string } | null;
  alliances?: Alliance[] | null;
};

export type SkillRow = {
  type?: string; // 'driver' | 'programming' | others
  event?: { id?: number; name?: string } | null;
  rank?: number | null;
  score?: number | null;
  attempts?: number | null;
};

export type Award = {
  id?: number | string;
  title?: string;
  designation?: string | number | null;
  classification?: string | number | null;
  event?: { id?: number | string; name?: string } | null;
  teamWinners?: Array<{ team?: { name?: string; code?: string } | null; division?: { name?: string } | null }> | null;
  individualWinners?: string[] | null;
};

export type SeasonGroup = { key: string; name: string; code: string; events: Event[] };
