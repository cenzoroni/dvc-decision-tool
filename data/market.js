/* Market context and cash-rate assumptions.
   MIXED PROVENANCE — RACK and CASH_SEASON are rough estimates, not sourced Disney figures. See each block's own note.

   Loaded as a classic script before the app, so these top-level consts land
   in the same global lexical scope the application code reads them from.
   Editing a price here is a data change, not a code change. */

const MARKET_META={label:"Resale asking prices",source:"Broker listing board snapshot",captured:"2026-09-03",estimated:false,note:"A point-in-time snapshot; 43% of the board was already pending when captured."};
const ROFR_META={label:"ROFR buyback rates",source:"Monthly ROFR reports, 2026 year to date",captured:"2026-09-03",estimated:true,note:"Approximated from published monthly reports; used only to score relative risk."};
const RACK_META={label:"Nightly rack rates",source:"MouseSavers 2026 published Disney resort rate tables, Oct 5-22 band, deluxe studio weeknight, converted from tax-inclusive to pre-tax",captured:"2026-09-09",estimated:false,note:"Standard or resort view where offered. Polynesian is the Preferred view, the only studio listed for cash. Boulder Ridge and Copper Creek publish at the same rate. Secondhand from a rate compiler rather than read off Disney's booking engine, and 2026 figures used against 2027 charts \u2014 override per-scenario in step 1 for your real dates."};
const CASH_SEASON_META={label:"Cash rate seasonality",source:"Author's estimate, since corroborated against published 2026 rate tables",captured:"2026-09-09",estimated:true,note:"Multipliers against a normal fall week. Spot-checked against real 2026 rates at Animal Kingdom Villas, Bay Lake Tower and Beach Club: the modelled holiday multiplier of 1.45 matched an observed 1.45, and the spring and January bands matched within a point or two. Still an estimate \u2014 Disney's cash seasons do not align with the point-chart seasons these multipliers are indexed to."};

const MARKET=[
  {ask:120,n:36,live:22},{ask:150,n:18,live:7},{ask:145,n:22,live:15},{ask:130,n:18,live:6},
  {ask:113,n:4,live:2},{ask:149,n:22,live:15},{ask:99,n:39,live:27},{ask:173,n:19,live:3},
  {ask:122,n:13,live:10},{ask:114,n:52,live:31},{ask:177,n:20,live:11},{ask:null,n:0,live:0}
];

const ROFR=[3,5,3,0,0,0,12,0,3,4,15,0];

const SLUG=["animal-kingdom-lodge","bay-lake-tower","beach-club","boardwalk","wilderness-lodge",
  "copper-creek","old-key-west","polynesian","rivieraresort","saratoga-springs","grand-floridian",""];


/* Deluxe studio, standard/resort view, weeknight, in the Oct 5-22 band — which
   is the season the CASH_SEASON multipliers are normalised against (season 4 =
   1.00). Published figures include 12.5% tax; stored here NET of it, because
   Disney applies its resident and passholder discounts to the pre-tax rate and
   the model discounts this number.

   Two entries are less certain than the rest, flagged in RACK_META:
   Polynesian is the Preferred view (no standard longhouse studio is listed for
   cash), and Boulder Ridge and Copper Creek are published at identical rates. */
const RACK=[580,797,722,724,609,609,534,1004,724,532,853,573];

const CASH_SEASON=[0.97,0.91,1.00,0.93,1.00,1.16,1.45];
