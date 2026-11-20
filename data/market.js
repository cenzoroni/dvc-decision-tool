/* Market context and cash-rate assumptions.
   Cash rates by date live in rates.js. See each block's own note for provenance.

   Loaded as a classic script before the app, so these top-level consts land
   in the same global lexical scope the application code reads them from.
   Editing a price here is a data change, not a code change. */

const MARKET_META={label:"Resale asking prices",source:"Combined DVC Resale Market and DVC For Less listing boards",captured:"2026-11-19",estimated:false,note:"Deduplicated snapshot of dvcresalemarket.com/listings and dvcforless.com/listings; ask is the weighted-average asking price of non-pending listings across both boards."};
const ROFR_META={label:"ROFR buyback rates",source:"Monthly ROFR reports, 2026 year to date",captured:"2026-09-03",estimated:true,note:"Approximated from published monthly reports; used only to score relative risk."};
const ROOM_TAX_META={label:"Room tax on cash bookings",source:"Florida transient rental tax as applied at Walt Disney World; DVC point stays are exempt",captured:"2026-09-09",estimated:false,note:"12.5% on a cash room booking only. Stays on points \u2014 your own or rented \u2014 are not taxed at the WDW resorts modelled here."};

const MARKET=[
  {ask:118,n:108,live:90},{ask:146,n:73,live:66},{ask:141,n:34,live:26},{ask:131,n:70,live:58},
  {ask:106,n:23,live:20},{ask:148,n:35,live:26},{ask:96,n:119,live:106},{ask:178,n:60,live:54},
  {ask:126,n:69,live:60},{ask:106,n:166,live:148},{ask:174,n:60,live:55},{ask:193,n:1,live:1}
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
