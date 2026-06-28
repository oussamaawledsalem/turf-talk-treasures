export type Team = { name: string; code: string; flag: string };
export type MatchResult = { scoreA: number; scoreB: number } | null;
export type Match = {
  id: string;
  date: string; // ISO
  stage: string;
  venue: string;
  teamA: Team;
  teamB: Team;
  result: MatchResult;
};

// Official 48 teams across 12 groups (A-L) for the FIFA World Cup 2026
const GROUPS: Record<string, Team[]> = {
  A: [
    { name: "Mexico", code: "MEX", flag: "🇲🇽" },
    { name: "South Africa", code: "RSA", flag: "🇿🇦" },
    { name: "South Korea", code: "KOR", flag: "🇰🇷" },
    { name: "Czechia", code: "CZE", flag: "🇨🇿" },
  ],
  B: [
    { name: "Switzerland", code: "SUI", flag: "🇨🇭" },
    { name: "Canada", code: "CAN", flag: "🇨🇦" },
    { name: "Bosnia and Herzegovina", code: "BIH", flag: "🇧🇦" },
    { name: "Qatar", code: "QAT", flag: "🇶🇦" },
  ],
  C: [
    { name: "Brazil", code: "BRA", flag: "🇧🇷" },
    { name: "Morocco", code: "MAR", flag: "🇲🇦" },
    { name: "Scotland", code: "SCO", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
    { name: "Haiti", code: "HAI", flag: "🇭🇹" },
  ],
  D: [
    { name: "United States", code: "USA", flag: "🇺🇸" },
    { name: "Australia", code: "AUS", flag: "🇦🇺" },
    { name: "Paraguay", code: "PAR", flag: "🇵🇾" },
    { name: "Türkiye", code: "TUR", flag: "🇹🇷" },
  ],
  E: [
    { name: "Ecuador", code: "ECU", flag: "🇪🇨" },
    { name: "Germany", code: "GER", flag: "🇩🇪" },
    { name: "Ivory Coast", code: "CIV", flag: "🇨🇮" },
    { name: "Curaçao", code: "CUW", flag: "🇨🇼" },
  ],
  F: [
    { name: "Netherlands", code: "NED", flag: "🇳🇱" },
    { name: "Japan", code: "JPN", flag: "🇯🇵" },
    { name: "Sweden", code: "SWE", flag: "🇸🇪" },
    { name: "Tunisia", code: "TUN", flag: "🇹🇳" },
  ],
  G: [
    { name: "Belgium", code: "BEL", flag: "🇧🇪" },
    { name: "Egypt", code: "EGY", flag: "🇪🇬" },
    { name: "Iran", code: "IRN", flag: "🇮🇷" },
    { name: "New Zealand", code: "NZL", flag: "🇳🇿" },
  ],
  H: [
    { name: "Spain", code: "ESP", flag: "🇪🇸" },
    { name: "Cabo Verde", code: "CPV", flag: "🇨🇻" },
    { name: "Uruguay", code: "URU", flag: "🇺🇾" },
    { name: "Saudi Arabia", code: "KSA", flag: "🇸🇦" },
  ],
  I: [
    { name: "France", code: "FRA", flag: "🇫🇷" },
    { name: "Norway", code: "NOR", flag: "🇳🇴" },
    { name: "Senegal", code: "SEN", flag: "🇸🇳" },
    { name: "Iraq", code: "IRQ", flag: "🇮🇶" },
  ],
  J: [
    { name: "Argentina", code: "ARG", flag: "🇦🇷" },
    { name: "Austria", code: "AUT", flag: "🇦🇹" },
    { name: "Algeria", code: "ALG", flag: "🇩🇿" },
    { name: "Jordan", code: "JOR", flag: "🇯🇴" },
  ],
  K: [
    { name: "Colombia", code: "COL", flag: "🇨🇴" },
    { name: "Portugal", code: "POR", flag: "🇵🇹" },
    { name: "DR Congo", code: "COD", flag: "🇨🇩" },
    { name: "Uzbekistan", code: "UZB", flag: "🇺🇿" },
  ],
  L: [
    { name: "England", code: "ENG", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    { name: "Croatia", code: "CRO", flag: "🇭🇷" },
    { name: "Ghana", code: "GHA", flag: "🇬🇭" },
    { name: "Panama", code: "PAN", flag: "🇵🇦" },
  ],
};

const VENUES = [
  "SoFi Stadium, Los Angeles",
  "MetLife Stadium, New York",
  "AT&T Stadium, Dallas",
  "Mercedes-Benz Stadium, Atlanta",
  "Lincoln Financial Field, Philadelphia",
  "Hard Rock Stadium, Miami",
  "BMO Field, Toronto",
  "BC Place, Vancouver",
  "Estadio Azteca, Mexico City",
  "Estadio Akron, Guadalajara",
  "Estadio BBVA, Monterrey",
  "Levi's Stadium, San Francisco",
  "Lumen Field, Seattle",
  "Arrowhead Stadium, Kansas City",
  "NRG Stadium, Houston",
  "Gillette Stadium, Boston",
];

function generateMatches(): Match[] {
  const matches: Match[] = [];
  const start = new Date("2026-06-11T17:00:00Z").getTime();
  let mIdx = 0;

  // Group stage: 12 groups × 6 matches = 72
  Object.entries(GROUPS).forEach(([groupKey, teams], gi) => {
    const pairings: Array<[number, number]> = [
      [0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2],
    ];
    pairings.forEach((p, pi) => {
      const dayOffset = gi + pi * 3; // spread across early tournament days
      const date = new Date(start + dayOffset * 24 * 3600 * 1000 + (pi % 3) * 3 * 3600 * 1000);
      matches.push({
        id: `g-${groupKey}-${pi}`,
        date: date.toISOString(),
        stage: `Group ${groupKey}`,
        venue: VENUES[(gi * 2 + pi) % VENUES.length],
        teamA: teams[p[0]],
        teamB: teams[p[1]],
        result: null,
      });
      mIdx++;
    });
  });

  // Knockout: Round of 32 (16) → R16 (8) → QF (4) → SF (2) → 3rd (1) → Final (1) = 32
  const allTeams = Object.values(GROUPS).flat();
  const koStages: Array<{ stage: string; count: number }> = [
    { stage: "Round of 32", count: 16 },
    { stage: "Round of 16", count: 8 },
    { stage: "Quarterfinal", count: 4 },
    { stage: "Semifinal", count: 2 },
    { stage: "Third Place", count: 1 },
    { stage: "Final", count: 1 },
  ];
  let koDayOffset = 18;
  let teamPick = 0;
  koStages.forEach((ks, si) => {
    for (let i = 0; i < ks.count; i++) {
      const date = new Date(start + (koDayOffset + Math.floor(i / 2)) * 24 * 3600 * 1000);
      const a = allTeams[teamPick % allTeams.length];
      const b = allTeams[(teamPick + 1) % allTeams.length];
      teamPick += 2;
      matches.push({
        id: `ko-${si}-${i}`,
        date: date.toISOString(),
        stage: ks.stage,
        venue: VENUES[(si + i) % VENUES.length],
        teamA: a,
        teamB: b,
        result: null,
      });
    }
    koDayOffset += Math.max(2, Math.ceil(ks.count / 2));
  });

  // Seed a few past results for demo (matches whose date < now-relative anchor)
  // Mark the first 5 group matches as already played
  for (let i = 0; i < 5; i++) {
    matches[i] = {
      ...matches[i],
      date: new Date(Date.now() - (5 - i) * 24 * 3600 * 1000).toISOString(),
      result: { scoreA: (i + 1) % 4, scoreB: i % 3 },
    };
  }

  return matches.sort((a, b) => a.date.localeCompare(b.date));
}

export const MATCHES: Match[] = generateMatches();

export const STAGE_FILTERS = [
  "All",
  "Group Stage",
  "Round of 32",
  "Round of 16",
  "Quarterfinal",
  "Semifinal",
  "Final",
] as const;
export type StageFilter = (typeof STAGE_FILTERS)[number];

export function matchInFilter(m: Match, f: StageFilter): boolean {
  if (f === "All") return true;
  if (f === "Group Stage") return m.stage.startsWith("Group");
  if (f === "Final") return m.stage === "Final" || m.stage === "Third Place";
  return m.stage === f;
}