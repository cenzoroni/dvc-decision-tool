/* Nightly cash rates by date band, one table per resort, index-aligned with
   RESORTS. Transcribed from MouseSavers' 2026 Walt Disney World rate tables,
   which reproduce Disney's published rack rates.

   Each band is [startMMDD, endMMDD, prices] with prices exactly as printed,
   TAX-INCLUSIVE at 12.5%. The model divides by (1+ROOM_TAX) on the way in,
   because Disney's resident and passholder discounts come off the pre-tax
   rate and the tax is re-applied after. Storing the printed figure means a
   re-transcription can be checked against the page digit for digit.

   Price arrays follow MouseSavers' convention:
     [p]        one rate for every night
     [p1,p2]    Sunday–Thursday, then Friday–Saturday
     [p1,p2,p3] Sunday–Wednesday, Thursday, then Friday–Saturday

   Room chosen per resort: the cheapest deluxe studio that is neither a Value
   studio nor Club Level — resort or standard view — or the cabin at Fort
   Wilderness. Other rooms are not tabulated; the per-trip override exists for
   them. The 2026 tables begin 20 January (1–19 January is priced on 2025
   tables), so a January trip before the 20th uses the 20 January band.

   These are 2026 dates applied to 2027 point-chart bands by day of year.
   Disney's cash calendar shifts a few days from year to year; that is the
   residual estimate in this dataset. */

const CASH_RATES_META={label:"Nightly cash rates by date",
  source:"MouseSavers 2026 Walt Disney World resort rate tables, one page per resort; deluxe studio (resort or standard view) or cabin, every date band",
  captured:"2026-09-13",estimated:false,
  note:"Tax-inclusive as printed; the model nets out 12.5%. Animal Kingdom uses Kidani Village, the cheaper of the two resort-view studios. Boulder Ridge and Copper Creek publish identical studio rates. Polynesian is the longhouse resort-view deluxe studio. 2026 dates stand in for 2027 by day of year, and 1–19 January uses the 20 January band. Rooms other than the studio are not tabulated — enter your own rate on the trip."};

// The 27-band calendar every villa resort shares in 2026.
const STD_BANDS=[[120,204],[205,212],[213,221],[222,305],[306,328],[329,409],[410,418],[419,423],[424,521],[522,524],[525,702],[703,704],[705,813],[814,827],[828,830],[831,910],[911,1001],[1002,1004],[1005,1022],[1023,1028],[1029,1031],[1101,1124],[1125,1128],[1129,1203],[1204,1210],[1211,1223],[1224,1231]];
const std=prices=>STD_BANDS.map((b,i)=>[b[0],b[1],prices[i]]);

const CASH_RATES=[
  // 0 Animal Kingdom Villas — Kidani Village, Deluxe Studio, Resort View
  std([[576,578,623],[614,632,702],[683,693,752],[614,632,702],[683,693,752],[729],[614,632,702],[683,693,752],[595,611,664],[696],[572,587],[606],[550,558],[506,561],[584],[506,561],[660,666,667],[773],[584,605,672],[659,735],[757],[584,605,672],[713],[647,667],[722,793],[883],[910]]),
  // 1 Bay Lake Tower — Deluxe Studio, Resort View
  std([[839,819,866],[910,912,1042],[1053,1054,1192],[910,912,1042],[1053,1054,1192],[1130],[910,912,1042],[1053,1054,1192],[878,876,951],[950],[800,809],[842],[744,746],[704,749],[870],[704,749],[883,892,1004],[1082],[899,896,1024],[910,944],[1079],[899,896,1024],[1034],[937,935],[1064,1198],[1197],[1244]]),
  // 2 Beach Club Villas — Deluxe Studio, Resort View
  std([[730,727,760],[818,838,880],[863,886,963],[818,838,880],[863,886,963],[925],[818,838,880],[863,886,963],[783,789,801],[840],[767,773],[807],[691,702],[638,683],[739],[638,683],[789,806,829],[966],[795,830,925],[896,911],[937],[795,830,925],[960],[862,865],[915,1002],[1086],[1145]]),
  // 3 BoardWalk Villas — Deluxe Studio, Resort View
  std([[775,766,788],[811,820,863],[918,938,1001],[811,820,863],[918,938,1001],[968],[811,820,863],[918,938,1001],[770,776,799],[848],[748,750],[778],[688,691],[673,705],[758],[673,705],[804,820,848],[992],[803,825,885],[891,919],[928],[803,825,885],[968],[830,847],[935,1009],[1118],[1167]]),
  // 4 Boulder Ridge Villas — Deluxe Studio, Resort View
  std([[642,628,682],[698,702,778],[771,785,868],[698,702,778],[771,785,868],[856],[698,702,778],[771,785,868],[662,665,713],[745],[649,650],[676],[594,594],[561,619],[664],[561,619],[638,659,702],[809],[685,701,748],[747,812],[818],[685,701,748],[832],[739,749],[847,927],[980],[1036]]),
  // 5 Copper Creek Villas & Cabins — Deluxe Studio, Resort View (published identical to Boulder Ridge)
  std([[642,628,682],[698,702,778],[771,785,868],[698,702,778],[771,785,868],[856],[698,702,778],[771,785,868],[662,665,713],[745],[649,650],[676],[594,594],[561,619],[664],[561,619],[638,659,702],[809],[685,701,748],[747,812],[818],[685,701,748],[832],[739,749],[847,927],[980],[1036]]),
  // 6 Old Key West — Deluxe Studio
  std([[560,546,579],[578,675],[666,745],[578,675],[666,745],[748],[578,675],[666,745],[565,647],[646],[560,568],[605],[557,570],[490,529],[579],[490,529],[596,602,627],[696],[601,598,685],[623,675],[688],[601,598,685],[692],[611,610],[700,760],[801],[835]]),
  // 7 Polynesian Villas & Bungalows — Longhouse Deluxe Studio, Resort View
  std([[862,853,890],[884,918,1069],[1002,1008,1047],[884,918,1069],[1002,1008,1047],[1062],[884,918,1069],[1002,1008,1047],[903,928,994],[1043],[849],[879],[804],[756,806],[861],[756,806],[884,912,972],[1109],[920,939,994],[1038,1100],[1120],[920,939,994],[1099],[1001,1017],[1066,1172],[1281],[1351]]),
  // 8 Riviera Resort — Deluxe Studio, Resort View
  std([[872,849,886],[926,1020],[1073,1161],[926,1020],[1073,1161],[1148],[926,1020],[1073,1161],[829,926],[982],[845,835],[875],[820,801],[728,735],[868],[728,735],[796,804,920],[1027],[814,810,954],[840,940],[965],[814,810,954],[1006],[902,897],[1035,1094],[1195],[1262]]),
  // 9 Saratoga Springs — Deluxe Studio
  std([[561,547,580],[569,665],[659,734],[569,665],[659,734],[737],[569,665],[659,734],[557,639],[638],[551,556],[596],[550,562],[485,524],[575],[485,524],[585,591,621],[693],[598,596,686],[627,682],[698],[598,596,686],[699],[606,602],[677,742],[795],[830]]),
  // 10 Villas at Grand Floridian — Resort Studio, Resort View
  std([[955,950,1002],[950,963,1028],[1038,1068,1161],[950,963,1028],[1038,1068,1161],[1200],[950,963,1028],[1038,1068,1161],[951,963,1001],[1052],[924,926],[962],[872,876],[834,894],[990],[834,894],[909,945,1014],[1098],[989,1024,1131],[1046,1110],[1159],[989,1024,1131],[1170],[1015,1036],[1087,1200],[1344],[1385]]),
  // 11 The Cabins at Fort Wilderness — 1 Bedroom Cabin, on its own calendar
  [[120,204,[555,614]],[205,205,[739,738]],[206,208,[766]],[209,212,[739,738]],[213,215,[766]],[216,219,[739,738]],[220,305,[627,673]],[306,328,[739,738]],[329,411,[749]],[412,415,[739,738]],[416,521,[602,646]],[522,524,[702]],[525,702,[606,638]],[703,704,[668]],[705,808,[564,595]],[809,827,[516,570]],[828,830,[584]],[831,1001,[600,649]],[1002,1004,[754]],[1005,1027,[645,723]],[1028,1031,[726]],[1101,1121,[645,723]],[1122,1127,[882]],[1128,1203,[664,740]],[1204,1210,[757,809]],[1211,1223,[991]],[1224,1231,[1025]]]
];
