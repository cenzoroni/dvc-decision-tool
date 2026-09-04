/* Point charts and season bands.
   Transcribed from Disney's published DVC point charts. Sourced, not estimated.

   Loaded as a classic script before the app, so these top-level consts land
   in the same global lexical scope the application code reads them from.
   Editing a price here is a data change, not a code change. */

const CHARTS_META={label:"Point charts and seasons",source:"Disney published 2026 and 2027 DVC point charts",captured:"2026-09-03",estimated:false,note:"Charts end 31 Dec 2027. 2028 charts publish around Dec 2026."};

const SEASONS = {
  2026:[
    {n:"Sep 1 &ndash; 30", r:[[901,930]]},
    {n:"Jan 1 &ndash; 31 &middot; May 1 &ndash; 14", r:[[101,131],[501,514]]},
    {n:"May 15 &ndash; Jun 10 &middot; Dec 1 &ndash; 23", r:[[515,610],[1201,1223]]},
    {n:"Feb 1 &ndash; 15 &middot; Jun 11 &ndash; Aug 31", r:[[201,215],[611,831]]},
    {n:"Oct 1 &ndash; Nov 24 &middot; Nov 28 &ndash; 30", r:[[1001,1124],[1128,1130]]},
    {n:"Feb 16 &ndash; Mar 28 &middot; Apr 6 &ndash; 30 &middot; Nov 25 &ndash; 27", r:[[216,328],[406,430],[1125,1127]]},
    {n:"Mar 29 &ndash; Apr 5 &middot; Dec 24 &ndash; 31", r:[[329,405],[1224,1231]]}
  ],
  2027:[
    {n:"Sep 1 &ndash; 30", r:[[901,930]]},
    {n:"Jan 1 &ndash; 31 &middot; May 1 &ndash; 14", r:[[101,131],[501,514]]},
    {n:"May 15 &ndash; Jun 10 &middot; Dec 1 &ndash; 23", r:[[515,610],[1201,1223]]},
    {n:"Feb 1 &ndash; 15 &middot; Jun 11 &ndash; Aug 31", r:[[201,215],[611,831]]},
    {n:"Oct 1 &ndash; Nov 23 &middot; Nov 27 &ndash; 30", r:[[1001,1123],[1127,1130]]},
    {n:"Feb 16 &ndash; Mar 20 &middot; Mar 29 &ndash; Apr 30 &middot; Nov 24 &ndash; 26", r:[[216,320],[329,430],[1124,1126]]},
    {n:"Mar 21 &ndash; 28 &middot; Dec 24 &ndash; 31", r:[[321,328],[1224,1231]]}
  ]
};

const SEASON_SHORT=["Sep 1&ndash;30","Jan &middot; May 1&ndash;14","May 15&ndash;Jun 10 &middot; Dec 1&ndash;23","Feb 1&ndash;15 &middot; Jun 11&ndash;Aug 31","Oct&ndash;Nov","Mar &middot; Apr &middot; Thanksgiving","Easter week &middot; Dec 24&ndash;31"];

const CHARTS = [
  { // 0 Animal Kingdom Villas
    cols:["Deluxe Studio|Value","Deluxe Studio|Resort","Deluxe Studio|Savanna","Deluxe Studio|Club Level",
          "One-Bedroom|Value","One-Bedroom|Resort","One-Bedroom|Savanna","One-Bedroom|Club Level",
          "Two-Bedroom|Value","Two-Bedroom|Resort","Two-Bedroom|Savanna","Two-Bedroom|Club Level",
          "Three-Bedroom Grand Villa|Resort","Three-Bedroom Grand Villa|Savanna"],
    y26:[
      [[7,10,13,18,17,20,27,38,22,28,35,51,68,73],[10,13,16,22,20,25,31,43,28,34,43,58,78,85]],
      [[8,12,15,20,19,24,31,41,25,31,39,55,73,79],[11,14,17,23,21,28,34,46,31,37,48,63,82,89]],
      [[8,13,16,21,20,26,33,43,27,32,42,58,78,86],[12,15,18,24,22,29,35,49,32,39,50,66,88,96]],
      [[9,14,17,22,21,27,34,44,29,35,43,60,81,89],[12,15,20,24,24,30,36,50,34,40,52,66,91,100]],
      [[10,15,19,23,23,29,35,46,30,36,47,61,88,96],[13,16,20,25,26,32,39,53,35,44,57,71,100,110]],
      [[12,16,19,23,24,32,38,49,31,40,52,66,97,107],[14,18,22,26,27,35,41,56,36,48,61,77,111,121]],
      [[16,21,27,33,31,38,47,65,43,55,70,88,117,127],[17,23,29,36,35,45,52,73,48,60,76,98,135,144]]
    ],
    y27:[
      [[8,10,12,20,19,20,26,41,25,28,35,55,68,73],[11,13,15,24,23,25,30,46,32,34,43,62,78,85]],
      [[9,12,14,23,21,24,30,43,28,31,39,59,73,79],[12,14,16,26,23,28,33,48,34,37,47,68,82,89]],
      [[9,13,15,23,23,26,32,45,31,32,42,63,78,86],[13,15,17,26,24,29,35,51,35,39,50,70,88,96]],
      [[10,14,15,25,23,27,33,47,32,35,43,65,81,89],[13,15,18,27,25,30,35,51,36,40,50,72,91,100]],
      [[11,15,17,26,25,29,34,50,35,36,47,68,88,96],[14,16,19,29,27,32,39,57,40,44,57,79,100,110]],
      [[13,16,17,27,26,32,37,54,37,40,52,74,97,107],[16,18,21,31,29,35,41,61,43,48,61,87,111,121]],
      [[17,21,26,37,34,38,45,67,51,55,70,99,117,127],[19,23,29,40,39,45,51,74,56,60,76,109,135,144]]
    ]
  },
  { // 1 Bay Lake Tower
    cols:["Deluxe Studio|Resort","Deluxe Studio|Preferred","Deluxe Studio|Theme Park",
          "One-Bedroom|Resort","One-Bedroom|Preferred","One-Bedroom|Theme Park",
          "Two-Bedroom|Resort","Two-Bedroom|Preferred","Two-Bedroom|Theme Park",
          "Three-Bedroom Grand Villa|Preferred","Three-Bedroom Grand Villa|Theme Park"],
    y26:[
      [[13,16,18,24,29,35,35,38,48,82,101],[16,19,23,32,36,44,42,47,59,98,120]],
      [[15,18,20,28,33,39,40,43,54,88,106],[17,19,23,35,38,46,45,50,61,104,125]],
      [[16,19,21,30,35,41,42,46,57,96,115],[18,20,25,38,41,50,48,54,66,112,135]],
      [[17,19,23,31,36,45,43,47,58,100,120],[19,21,26,39,44,53,49,58,67,115,141]],
      [[18,20,24,33,38,47,45,50,60,108,131],[21,23,27,41,47,56,53,61,72,126,153]],
      [[19,21,26,36,42,49,50,54,65,120,143],[22,24,29,44,48,59,57,62,76,140,168]],
      [[26,28,34,48,53,64,66,72,88,146,176],[29,32,38,56,62,75,77,84,98,171,207]]
    ]
  },
  { // 2 Beach Club Villas
    cols:["Deluxe Studio|","One-Bedroom|","Two-Bedroom|"],
    y26:[
      [[14,26,36],[15,31,43]],
      [[15,29,38],[16,33,44]],
      [[16,31,41],[17,36,46]],
      [[16,35,44],[18,38,47]],
      [[17,36,46],[21,39,52]],
      [[18,37,48],[22,42,55]],
      [[27,51,68],[28,56,71]]
    ]
  },
  { // 3 BoardWalk Villas
    cols:["Deluxe Studio|Resort","Deluxe Studio|BoardWalk or Preferred",
          "One-Bedroom|Resort","One-Bedroom|BoardWalk or Preferred",
          "Two-Bedroom|Resort","Two-Bedroom|BoardWalk or Preferred",
          "Three-Bedroom Grand Villa|BoardWalk or Preferred"],
    y26:[
      [[10,14,19,26,29,35,76],[13,16,27,29,35,40,88]],
      [[10,15,23,29,32,39,81],[14,16,28,34,38,45,91]],
      [[11,16,24,32,31,41,88],[15,17,30,37,41,47,97]],
      [[11,16,25,35,33,43,91],[16,18,31,39,44,47,102]],
      [[14,18,28,35,39,45,101],[16,20,33,41,45,51,114]],
      [[15,19,31,39,43,51,110],[19,22,36,43,49,55,124]],
      [[22,28,42,50,60,68,133],[24,29,48,56,67,77,145]]
    ]
  },
  { // 4 Boulder Ridge Villas
    cols:["Deluxe Studio|","One-Bedroom|","Two-Bedroom|"],
    y26:[
      [[13,27,36],[16,31,41]],
      [[15,30,38],[16,34,44]],
      [[16,32,41],[17,36,47]],
      [[16,34,44],[18,39,48]],
      [[17,35,46],[20,40,51]],
      [[19,37,49],[21,42,54]],
      [[26,47,64],[28,55,72]]
    ]
  },
  { // 5 Copper Creek Villas & Cabins
    cols:["Deluxe Studio|","One-Bedroom|","Two-Bedroom|","Three-Bedroom Grand Villa|","Cascade Cabin (Two-Bedroom)|"],
    y26:[
      [[13,25,35,91,84],[15,30,40,107,100]],
      [[15,30,38,101,94],[16,34,44,116,109]],
      [[16,33,41,108,101],[17,36,47,124,117]],
      [[17,34,43,113,107],[18,38,49,130,121]],
      [[17,35,45,120,113],[19,42,52,137,131]],
      [[18,37,50,128,124],[21,43,56,147,143]],
      [[25,48,64,176,171],[28,54,72,206,196]]
    ]
  },
  { // 6 Old Key West
    cols:["Deluxe Studio|","One-Bedroom|","Two-Bedroom|","Three-Bedroom Grand Villa|"],
    y26:[
      [[9,20,27,46],[13,25,35,56]],
      [[10,23,31,50],[14,26,35,59]],
      [[10,25,34,53],[15,28,38,64]],
      [[11,26,36,56],[16,30,41,69]],
      [[13,28,39,59],[17,34,44,71]],
      [[15,31,42,66],[19,36,49,79]],
      [[22,40,57,82],[26,50,65,106]]
    ]
  },
  { // 7 Polynesian Villas & Bungalows
    cols:["Longhouse Deluxe Studio|Resort","Longhouse Deluxe Studio|Preferred",
          "Bungalow|Preferred",
          "Island Tower Duo Studio|Resort","Island Tower Duo Studio|Preferred","Island Tower Duo Studio|Premium",
          "Island Tower Deluxe Studio|Resort","Island Tower Deluxe Studio|Preferred","Island Tower Deluxe Studio|Theme Park",
          "Island Tower One-Bedroom|Resort","Island Tower One-Bedroom|Preferred","Island Tower One-Bedroom|Theme Park",
          "Island Tower Two-Bedroom|Resort","Island Tower Two-Bedroom|Preferred","Island Tower Two-Bedroom|Theme Park",
          "Island Tower Two-Bedroom Penthouse|Preferred","Island Tower Two-Bedroom Penthouse|Theme Park"],
    y26:[
      [[14,19,112,12,16,19,14,19,24,28,38,42,44,54,68,86,108],[17,24,132,14,19,23,17,24,29,34,46,51,53,65,79,104,128]],
      [[17,22,120,14,18,21,17,22,26,34,42,47,48,60,71,95,117],[20,24,138,16,20,24,20,24,30,40,48,54,56,68,84,112,135]],
      [[19,22,128,16,19,22,19,22,27,38,47,53,54,62,76,102,122],[22,26,147,18,21,26,22,26,32,44,52,61,62,73,90,119,144]],
      [[20,24,136,17,20,24,20,24,29,40,48,54,56,68,82,108,128],[23,27,157,19,22,27,23,27,33,46,54,63,65,79,96,122,152]],
      [[22,25,150,18,21,26,22,25,31,44,53,58,62,73,90,115,140],[25,30,172,20,24,29,25,30,36,50,60,67,70,84,101,132,162]],
      [[25,28,162,20,23,28,25,28,34,48,54,65,68,79,96,126,153],[28,32,185,23,26,32,28,32,39,56,64,75,79,90,110,144,179]],
      [[34,41,199,27,32,39,34,41,48,68,78,89,92,109,128,178,197],[36,43,226,30,36,43,36,43,53,78,86,98,105,125,149,198,226]]
    ],
    y27:[
      [[15,20,114,13,17,20,15,20,25,30,39,44,46,56,70,88,110],[18,24,134,15,20,24,18,24,30,36,47,53,55,67,81,105,129]],
      [[17,22,122,14,18,21,17,22,26,34,42,47,49,61,72,96,118],[20,24,140,16,20,24,20,24,30,40,48,54,57,69,85,113,136]],
      [[19,22,128,16,19,22,19,22,27,38,47,53,54,62,76,102,122],[22,26,147,18,21,26,22,26,32,44,52,61,62,73,90,119,144]],
      [[20,24,136,17,20,24,20,24,29,40,48,54,56,68,82,108,128],[23,27,157,19,22,27,23,27,33,46,54,63,65,79,96,122,152]],
      [[22,25,150,18,21,26,22,25,31,44,53,58,62,73,90,115,140],[25,30,172,20,24,29,25,30,36,50,60,67,70,84,101,132,162]],
      [[25,28,162,20,23,28,25,28,34,48,54,65,68,79,96,126,153],[28,32,185,23,26,32,28,32,39,56,64,75,79,90,110,144,179]],
      [[34,41,199,27,32,39,34,41,48,68,78,89,92,109,128,178,197],[36,43,226,30,36,43,36,43,53,78,86,98,105,125,149,198,226]]
    ]
  },
  { // 8 Riviera Resort
    cols:["Tower Studio|","Deluxe Studio|Resort","Deluxe Studio|Preferred",
          "One-Bedroom|Resort","One-Bedroom|Preferred",
          "Two-Bedroom|Resort","Two-Bedroom|Preferred","Three-Bedroom Grand Villa|Preferred"],
    y26:[
      [[10,14,17,29,36,38,47,103],[13,17,22,34,46,47,58,120]],
      [[12,16,19,34,41,44,52,108],[14,18,24,39,50,49,61,127]],
      [[13,17,20,35,44,47,55,116],[15,19,26,42,54,53,67,135]],
      [[14,17,21,36,48,50,59,120],[17,20,26,48,58,59,70,141]],
      [[16,19,24,39,49,52,65,129],[18,22,28,50,59,63,74,154]],
      [[17,21,27,43,53,56,71,140],[20,25,30,53,63,65,79,166]],
      [[24,29,35,58,68,77,88,172],[27,32,40,68,81,90,103,204]]
    ]
  },
  { // 9 Saratoga Springs Resort & Spa
    cols:["Deluxe Studio|Standard","Deluxe Studio|Preferred",
          "One-Bedroom|Standard","One-Bedroom|Preferred",
          "Two-Bedroom|Standard","Two-Bedroom|Preferred",
          "Three-Bedroom Grand Villa|Standard","Three-Bedroom Grand Villa|Preferred",
          "Three-Bedroom Treehouse Villa|"],
    y26:[
      [[9,11,21,24,27,35,63,74,38],[14,16,27,30,34,39,72,84,43]],
      [[12,13,24,28,32,38,68,76,41],[15,17,29,34,36,42,78,89,45]],
      [[13,15,26,30,35,39,74,82,43],[15,18,31,35,39,45,83,94,48]],
      [[14,15,28,32,36,41,77,87,44],[16,19,33,37,39,50,86,98,51]],
      [[14,16,30,34,37,46,86,98,47],[17,19,34,39,45,54,97,112,52]],
      [[15,17,32,38,41,49,93,108,51],[18,21,36,42,47,59,107,125,58]],
      [[21,23,43,49,56,67,113,131,66],[25,28,47,53,63,75,127,139,76]]
    ]
  },
  { // 10 Villas at Grand Floridian
    cols:["Resort Studio|Resort","Resort Studio|Preferred","Resort Studio|Theme Park",
          "Deluxe Studio|Resort","Deluxe Studio|Preferred",
          "One-Bedroom|Resort","One-Bedroom|Preferred",
          "Two-Bedroom|Resort","Two-Bedroom|Preferred","Three-Bedroom Grand Villa|Preferred"],
    y26:[
      [[16,19,24,16,19,31,39,44,54,111],[20,24,27,20,24,41,48,55,65,131]],
      [[17,21,25,17,21,36,43,49,59,118],[20,24,29,20,24,44,51,58,68,138]],
      [[18,21,26,18,21,38,46,53,62,126],[21,26,31,21,26,46,55,61,74,148]],
      [[18,22,28,18,22,41,49,56,66,131],[21,27,32,21,27,48,57,65,78,155]],
      [[22,26,32,22,26,43,53,61,73,143],[24,29,36,24,29,51,61,69,82,169]],
      [[24,27,34,24,27,46,55,65,75,161],[26,32,41,26,32,55,66,75,88,187]],
      [[32,38,47,32,38,64,76,87,103,197],[37,44,54,37,44,75,89,103,122,227]]
    ]
  },
  { // 11 The Cabins at Fort Wilderness
    cols:["Cabin|"],
    y26:[ [[15],[18]],[[16],[19]],[[18],[21]],[[20],[24]],[[22],[25]],[[24],[28]],[[32],[36]] ]
  }
];
