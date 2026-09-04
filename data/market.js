/* Market context and cash-rate assumptions.
   MIXED PROVENANCE — RACK and CASH_SEASON are rough estimates, not sourced Disney figures. See each block's own note.

   Loaded as a classic script before the app, so these top-level consts land
   in the same global lexical scope the application code reads them from.
   Editing a price here is a data change, not a code change. */

const MARKET_META={label:"Resale asking prices",source:"Broker listing board snapshot",captured:"2026-09-03",estimated:false,note:"A point-in-time snapshot; 43% of the board was already pending when captured."};
const ROFR_META={label:"ROFR buyback rates",source:"Monthly ROFR reports, 2026 year to date",captured:"2026-09-03",estimated:true,note:"Approximated from published monthly reports; used only to score relative risk."};
const RACK_META={label:"Estimated nightly rack rates",source:"Author's estimate",captured:"2026-09-03",estimated:true,note:"ROUGH ESTIMATES, not sourced Disney prices. Look up real dates and replace. Editable per-scenario in step 1."};
const CASH_SEASON_META={label:"Cash rate seasonality",source:"Author's estimate, shaped by Disney's 2026 season structure",captured:"2026-09-03",estimated:true,note:"ROUGH ESTIMATES. Multipliers against a normal fall week."};

const MARKET=[
  {ask:120,n:36,live:22},{ask:150,n:18,live:7},{ask:145,n:22,live:15},{ask:130,n:18,live:6},
  {ask:113,n:4,live:2},{ask:149,n:22,live:15},{ask:99,n:39,live:27},{ask:173,n:19,live:3},
  {ask:122,n:13,live:10},{ask:114,n:52,live:31},{ask:177,n:20,live:11},{ask:null,n:0,live:0}
];

const ROFR=[3,5,3,0,0,0,12,0,3,4,15,0];

const SLUG=["animal-kingdom-lodge","bay-lake-tower","beach-club","boardwalk","wilderness-lodge",
  "copper-creek","old-key-west","polynesian","rivieraresort","saratoga-springs","grand-floridian",""];


const RACK=[573,780,760,720,650,700,520,850,700,500,900,500];

const CASH_SEASON=[0.97,0.91,1.00,0.93,1.00,1.16,1.45];
