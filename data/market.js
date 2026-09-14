/* Market context and cash-rate assumptions.
   Cash rates by date live in rates.js. See each block's own note for provenance.

   Loaded as a classic script before the app, so these top-level consts land
   in the same global lexical scope the application code reads them from.
   Editing a price here is a data change, not a code change. */

const MARKET_META={label:"Resale asking prices",source:"Broker listing board snapshot",captured:"2026-09-03",estimated:false,note:"A point-in-time snapshot; 43% of the board was already pending when captured."};
const ROFR_META={label:"ROFR buyback rates",source:"Monthly ROFR reports, 2026 year to date",captured:"2026-09-03",estimated:true,note:"Approximated from published monthly reports; used only to score relative risk."};
const ROOM_TAX_META={label:"Room tax on cash bookings",source:"Florida transient rental tax as applied at Walt Disney World; DVC point stays are exempt",captured:"2026-09-09",estimated:false,note:"12.5% on a cash room booking only. Stays on points \u2014 your own or rented \u2014 are not taxed at the WDW resorts modelled here."};

const MARKET=[
  {ask:120,n:36,live:22},{ask:150,n:18,live:7},{ask:145,n:22,live:15},{ask:130,n:18,live:6},
  {ask:113,n:4,live:2},{ask:149,n:22,live:15},{ask:99,n:39,live:27},{ask:173,n:19,live:3},
  {ask:122,n:13,live:10},{ask:114,n:52,live:31},{ask:177,n:20,live:11},{ask:null,n:0,live:0}
];

const ROFR=[3,5,3,0,0,0,12,0,3,4,15,0];

const SLUG=["animal-kingdom-lodge","bay-lake-tower","beach-club","boardwalk","wilderness-lodge",
  "copper-creek","old-key-west","polynesian","rivieraresort","saratoga-springs","grand-floridian",""];


/* Florida transient rental tax at the Walt Disney World resorts. A cash booking
   pays it; a DVC stay on points does not, whether the points are the guest's own
   or rented from an owner. That asymmetry is worth real money over a deed's life
   and the model omitted it entirely until September 2026.

   Applies to the WDW resorts this tool covers. Aulani, the Villas at Disneyland
   Hotel and Grand Californian DO tax point stays, but none of them are modelled
   here. */
const ROOM_TAX=0.125;
