// The 27 EU member states. `c` is the Eurostat geo code, `g` the [column,row] slot on the tile map.
export const COUNTRIES = [
  { c: 'AT', n: 'Austria', euro: 1999, cur: 'EUR', g: [1, 4] },
  { c: 'BE', n: 'Belgium', euro: 1999, cur: 'EUR', g: [0, 3] },
  { c: 'BG', n: 'Bulgaria', euro: 2026, cur: 'EUR', g: [5, 5] },
  { c: 'HR', n: 'Croatia', euro: 2023, cur: 'EUR', g: [4, 5] },
  { c: 'CY', n: 'Cyprus', euro: 2008, cur: 'EUR', g: [5, 6] },
  { c: 'CZ', n: 'Czechia', euro: 0, cur: 'CZK', regime: 'Managed float, inflation targeting', g: [2, 3] },
  { c: 'DK', n: 'Denmark', euro: 0, cur: 'DKK', regime: 'ERM II peg to the euro', peg: 7.46038, band: 2.25, g: [2, 1] },
  { c: 'EE', n: 'Estonia', euro: 2011, cur: 'EUR', g: [4, 1] },
  { c: 'FI', n: 'Finland', euro: 1999, cur: 'EUR', g: [4, 0] },
  { c: 'FR', n: 'France', euro: 1999, cur: 'EUR', g: [0, 4] },
  { c: 'DE', n: 'Germany', euro: 1999, cur: 'EUR', g: [2, 2] },
  { c: 'EL', n: 'Greece', euro: 2001, cur: 'EUR', g: [4, 6] },
  { c: 'HU', n: 'Hungary', euro: 0, cur: 'HUF', regime: 'Free float, inflation targeting', g: [2, 4] },
  { c: 'IE', n: 'Ireland', euro: 1999, cur: 'EUR', g: [0, 1] },
  { c: 'IT', n: 'Italy', euro: 1999, cur: 'EUR', g: [2, 5] },
  { c: 'LV', n: 'Latvia', euro: 2014, cur: 'EUR', g: [4, 2] },
  { c: 'LT', n: 'Lithuania', euro: 2015, cur: 'EUR', g: [4, 3] },
  { c: 'LU', n: 'Luxembourg', euro: 1999, cur: 'EUR', g: [1, 3] },
  { c: 'MT', n: 'Malta', euro: 2008, cur: 'EUR', g: [2, 6] },
  { c: 'NL', n: 'Netherlands', euro: 1999, cur: 'EUR', g: [1, 2] },
  { c: 'PL', n: 'Poland', euro: 0, cur: 'PLN', regime: 'Free float, inflation targeting', g: [3, 2] },
  { c: 'PT', n: 'Portugal', euro: 1999, cur: 'EUR', g: [0, 5] },
  { c: 'RO', n: 'Romania', euro: 0, cur: 'RON', regime: 'Managed float, inflation targeting', g: [3, 4] },
  { c: 'SK', n: 'Slovakia', euro: 2009, cur: 'EUR', g: [3, 3] },
  { c: 'SI', n: 'Slovenia', euro: 2007, cur: 'EUR', g: [3, 5] },
  { c: 'ES', n: 'Spain', euro: 1999, cur: 'EUR', g: [1, 5] },
  { c: 'SE', n: 'Sweden', euro: 0, cur: 'SEK', regime: 'Free float, inflation targeting', g: [3, 0] }
];

export const BY_CODE = {};
COUNTRIES.forEach(function (x) { BY_CODE[x.c] = x; });
BY_CODE.EU = { c: 'EU', n: 'European Union', cur: 'EUR', agg: true };
BY_CODE.EA = { c: 'EA', n: 'Euro area', cur: 'EUR', agg: true };

export const CODES = COUNTRIES.map(function (x) { return x.c; });
export const NON_EURO = COUNTRIES.filter(function (x) { return !x.euro; });
export const FX_CODES = ['CZK', 'DKK', 'HUF', 'PLN', 'RON', 'SEK', 'USD', 'GBP', 'CHF'];
export function nameOf(code) { return BY_CODE[code] ? BY_CODE[code].n : code; }
