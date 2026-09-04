/* Resort facts, prices and dues.
   Direct prices from Disney's July 2026 published list; resale averages from August 2026 sales; 2026 annual dues.

   Loaded as a classic script before the app, so these top-level consts land
   in the same global lexical scope the application code reads them from.
   Editing a price here is a data change, not a code change. */

const RESORTS_META={label:"Resort prices and dues",source:"Disney published direct price list (July 2026); broker sold averages (August 2026); 2026 annual dues",captured:"2026-09-03",estimated:false,note:"Old Key West is modelled at the extended 2057 deed. Direct prices are list, before the volume incentives Disney runs most of the year."};

const RESORTS = [
  {
    name:"Animal Kingdom Villas", exp:2057, direct:215, resale:113.14, dues:10.1608, restricted:false,
    modes:["bus"], modeLabel:"Bus only",
    note:"Two buildings under one deed. Jambo House holds the Value studios and the club-level villas; Kidani Village has the larger two-bedrooms and its own parking garage. Savanna views are the reason to own here and they go first at 11 months.",
    rooms:[
      ["Value Studio","4","Jambo House only. No balcony, dramatically cheaper in points."],
      ["Deluxe Studio","5","Standard, Savanna, or Club Level at Jambo."],
      ["One-Bedroom Villa","5","Value, Standard, Savanna, or Club Level."],
      ["Two-Bedroom Villa","8&ndash;9","Jambo sleeps 8, Kidani 9. Same four view categories."],
      ["Three-Bedroom Grand Villa","12","Savanna view at Kidani; club level at Jambo."]
    ],
    transport:[
      "Bus to all four parks, Disney Springs and the water parks. No boat, no monorail, no Skyliner.",
      "Internal bus links Jambo House and Kidani Village; walking between them takes about 10 minutes.",
      "Animal Kingdom is roughly 5 minutes away; Magic Kingdom is the longest ride in the system at 20&ndash;25 minutes.",
      "The most car-friendly reason to own here: free self-parking and short drives to every park."
    ],
    dining:[
      ["Signature and table service","Jiko &mdash; The Cooking Place (African-inflected fine dining, deep wine list). Boma &mdash; Flavors of Africa (buffet, breakfast and dinner). Sanaa at Kidani (Indian-African, book a savanna-window table)."],
      ["Quick service","The Mara at Jambo House. Kidani has grab-and-go only, which is a real inconvenience if you stay there."],
      ["Bars and lounges","Victoria Falls Lounge (overlooks Boma). Uzima Springs Pool Bar at Jambo. Maji Pool Bar at Kidani."]
    ],
    amenities:[
      "Uzima Springs Pool at Jambo with a 67-foot slide; Samawati Springs Pool at Kidani with its own slide and the Uwanja Camp play area.",
      "Four savannas with 200-plus animals and 30-plus bird species, viewable from villa balconies and public overlooks.",
      "Night-vision goggles for after-dark savanna viewing, plus cultural representatives and animal programs run daily.",
      "Community Hall at Kidani for DVC activities, board games and free bike rentals. Zahanati Fitness Center and massage rooms at Kidani; Zahanati Massage at Jambo.",
      "Pumbaa's Fun and Games arcade, campfire with s'mores, Zawadi Marketplace, and the Wanyama Safari plus dinner experience."
    ]
  },
  {
    name:"Bay Lake Tower", exp:2060, direct:275, resale:140.74, dues:8.7415, restricted:false,
    modes:["walk","monorail","boat","bus"], modeLabel:"Walk &middot; Monorail &middot; Boat &middot; Bus",
    note:"The best transportation position in the system. Theme park view villas cost a large point premium and are the hardest booking anywhere on fireworks nights.",
    rooms:[
      ["Deluxe Studio","5","Standard, Lake, or Theme Park view."],
      ["One-Bedroom Villa","5","Standard, Lake, or Theme Park view."],
      ["Two-Bedroom Villa","9","Standard, Lake, or Theme Park view."],
      ["Three-Bedroom Grand Villa","12","All face Magic Kingdom. Two-story."]
    ],
    transport:[
      "Walk to Magic Kingdom in about 10 minutes on a covered skybridge &mdash; no other DVC resort offers this.",
      "Monorail resort loop to Magic Kingdom and the Ticket and Transportation Center; transfer there for the Epcot monorail.",
      "Boat to Wilderness Lodge and Fort Wilderness across Bay Lake.",
      "Bus to Animal Kingdom, Hollywood Studios, Disney Springs and the water parks.",
      "Exterior maintenance on the main Contemporary tower runs into late 2027; rooms and dining stay open."
    ],
    dining:[
      ["Signature and table service","California Grill on the 15th floor (sushi and the best indoor fireworks view at Walt Disney World). Steakhouse 71 off the lobby, open all three meals and better value than it looks. Chef Mickey's, the classic Fab Five character buffet."],
      ["Quick service","Contempo Caf&eacute; on the Grand Canyon Concourse, with mobile ordering."],
      ["Bars and lounges","Outer Rim, Steakhouse 71 Lounge, California Grill Lounge. The Sand Bar and Cove Bar at the pools. Top of the World Lounge &mdash; A Villains Lair on the roof is open only to members who bought direct."]
    ],
    amenities:[
      "Bay Cove Pool with a slide, reserved for Bay Lake Tower guests, plus access to the Contemporary's larger feature pool.",
      "Top of the World Lounge, a rooftop bar with an outdoor fireworks deck &mdash; the single most tangible blue card perk in the system.",
      "Sammy Duvall's Watersports Centre for parasailing, wakeboarding and boat rentals on Bay Lake.",
      "Community Hall, fitness center, white sand beach with Electrical Water Pageant views, tennis, and the Game Station arcade."
    ]
  },
  {
    name:"Beach Club Villas", exp:2042, direct:275, resale:138.66, dues:9.8113, restricted:false,
    modes:["walk","skyliner","boat","bus"], modeLabel:"Walk &middot; Skyliner &middot; Boat &middot; Bus",
    note:"Stormalong Bay and a five-minute walk to Epcot. The shortest deed at Walt Disney World, which is why the amortized number looks so bad next to a headline price that seems reasonable.",
    rooms:[
      ["Deluxe Studio","5","Single view category. Books out at 11 months for most of the year."],
      ["One-Bedroom Villa","4","Plus one child under three."],
      ["Two-Bedroom Villa","8","Lock-off or dedicated."]
    ],
    transport:[
      "Walk 5&ndash;8 minutes to Epcot's International Gateway, which puts you in World Showcase without a bus or a bag check queue at the main entrance.",
      "Walk about 20 minutes to Hollywood Studios, or take the Friendship boat.",
      "Skyliner from the International Gateway station to Hollywood Studios and the Caribbean Beach hub.",
      "Friendship boats to BoardWalk, Swan and Dolphin, and Hollywood Studios.",
      "Bus to Magic Kingdom, Animal Kingdom, Disney Springs and the water parks."
    ],
    dining:[
      ["Signature and table service","Cape May Caf&eacute; (Minnie's character breakfast, seafood clambake at dinner). Beaches and Cream Soda Shop, the ice cream parlor behind the Kitchen Sink. Ale and Compass Restaurant at the Yacht Club next door. Yachtsman Steakhouse at the Yacht Club, back from a refurbishment that closed it through summer 2026."],
      ["Quick service","Marketplace at Ale and Compass. Hurricane Hanna's Waterside Bar and Grill at Stormalong Bay."],
      ["Bars and lounges","Martha's Vineyard and Crew's Cup Lounge at the Yacht Club. Ale and Compass Lounge. Epcot's World Showcase is a five-minute walk, which effectively adds eleven countries of dining."]
    ],
    amenities:[
      "Stormalong Bay: three acres of sand-bottom pool with a lazy river, a shipwreck slide and a snorkeling area. Widely considered the best pool at Walt Disney World and restricted to Beach Club, Yacht Club and villa guests.",
      "Two quiet pools, Ship Shape Health Club with a sauna and massage, and Bayside Marina for boat rentals.",
      "Community Hall, volleyball on the beach, campfires, and the Lafferty Place Arcade.",
      "Best walkable position of any DVC resort for Epcot festival season &mdash; Food and Wine runs roughly August through November."
    ]
  },
  {
    name:"BoardWalk Villas", exp:2042, direct:240, resale:127.70, dues:9.6717, restricted:false,
    modes:["walk","skyliner","boat","bus"], modeLabel:"Walk &middot; Skyliner &middot; Boat &middot; Bus",
    note:"Walk to Epcot and to Hollywood Studios. Recently refurbished with reworked view categories, so check the current chart rather than an old one. Same 2042 deed as Beach Club.",
    rooms:[
      ["Deluxe Studio","5","Standard, Garden, Pool or BoardWalk view depending on current categories."],
      ["One-Bedroom Villa","4","Plus one child under three."],
      ["Two-Bedroom Villa","8","Lock-off or dedicated."],
      ["Three-Bedroom Grand Villa","12","Two-story, very few units."]
    ],
    transport:[
      "Walk 5&ndash;10 minutes to Epcot's International Gateway.",
      "Walk 15&ndash;20 minutes to Hollywood Studios along the canal path, or take the Friendship boat.",
      "Skyliner from the International Gateway station to Hollywood Studios and Caribbean Beach.",
      "Friendship boats to Beach and Yacht Club, Swan and Dolphin, and Hollywood Studios.",
      "Bus to Magic Kingdom, Animal Kingdom, Disney Springs and the water parks."
    ],
    dining:[
      ["Signature and table service","Flying Fish, the seafood signature and the strongest restaurant on the boardwalk. The Cake Bake Shop by Gwendolyn Rogers, now occupying the old ESPN Club space, serving breakfast through dinner plus afternoon tea. Trattoria al Forno for Italian."],
      ["Quick service","BoardWalk Deli, Carousel Coffee, the Pizza Window, BoardWalk Ice Cream, Blue Ribbon Corn Dogs, and the Cake Bake Shop bakery counter."],
      ["Bars and lounges","AbracadaBar, Belle Vue Lounge, BoardWalk Joe's Marvelous Margaritas, Leaping Horse Libations at the pool. Hurly-Burly, a seaside theatre venue with live music and 21-plus evenings, is due to open late 2026."],
      ["Since closed","ESPN Club, Big River Grille, Jellyrolls and the original BoardWalk Bakery are all gone. Older guides still list them."]
    ],
    amenities:[
      "Luna Park Pool with the Keister Coaster, a 200-foot clown-mouth slide, plus two quiet pools.",
      "Surrey bike rentals along the boardwalk and the promenade itself, with nightly street performers, jugglers and magicians.",
      "Muscles and Bustles Health Club, tennis courts, Community Hall, and the Side Show Games Arcade.",
      "The only DVC resort where the entertainment district is the resort &mdash; useful with kids who wind down slowly after park days."
    ]
  },
  {
    name:"Boulder Ridge Villas", exp:2042, direct:215, resale:102.40, dues:9.7672, restricted:false,
    modes:["boat","bus"], modeLabel:"Boat &middot; Bus",
    note:"The original Wilderness Lodge villas. Quiet, no grand villas, one view category, and the cheapest way into a boat-to-Magic-Kingdom resort &mdash; but the deed ends in 2042.",
    rooms:[
      ["Deluxe Studio","5","Single view category."],
      ["One-Bedroom Villa","4","Plus one child under three."],
      ["Two-Bedroom Villa","8","Lock-off or dedicated."]
    ],
    transport:[
      "Boat to Magic Kingdom directly from the resort dock, roughly 10 minutes.",
      "Boat across Bay Lake to the Contemporary and Fort Wilderness.",
      "Bus to Epcot, Hollywood Studios, Animal Kingdom, Disney Springs and the water parks.",
      "No monorail and no Skyliner. The boat is pleasant but weather-dependent; buses substitute during storms."
    ],
    dining:[
      ["Signature and table service","Story Book Dining at Artist Point with Snow White, a fixed-price character dinner. Whispering Canyon Caf&eacute;, loud and deliberately unruly, all three meals."],
      ["Quick service","Roaring Fork. Geyser Point Bar and Grill, an open-air spot on Bay Lake that works as both counter service and lounge and is the local favorite."],
      ["Bars and lounges","Territory Lounge, Trout Pass Pool Bar, and the Geyser Point bar side."]
    ],
    amenities:[
      "Boulder Ridge Cove Pool, a quiet pool right beside the villas, plus Copper Creek Springs Pool with a slide and Fire Rock Geyser, which erupts hourly.",
      "Sturdy Branches Health Club, Teton Boat and Bike Rental, and a Bay Lake beach with Electrical Water Pageant views.",
      "Community Hall, Buttons and Bells Arcade, evening campfires and outdoor movies, and horse-drawn carriage rides.",
      "The lobby itself is the draw: an eight-story timber atrium with a working geyser spring running through it."
    ]
  },
  {
    name:"Copper Creek Villas &amp; Cabins", exp:2068, direct:255, resale:140.20, dues:9.0200, restricted:false,
    modes:["boat","bus"], modeLabel:"Boat &middot; Bus",
    note:"Same building and grounds as Boulder Ridge but a 2068 deed instead of 2042. The Cascade Cabins are standalone waterfront units on Bay Lake and carry an enormous point cost.",
    rooms:[
      ["Deluxe Studio","4","Queen plus queen Murphy bed. Smaller than most DVC studios."],
      ["One-Bedroom Villa","5","King, queen pull-down, single pull-down."],
      ["Two-Bedroom Villa","8","Lock-off or dedicated."],
      ["Cascade Cabin","8","Freestanding two-bedroom cabin on the water with a private hot tub."],
      ["Three-Bedroom Grand Villa","12","Two units only."]
    ],
    transport:[
      "Boat to Magic Kingdom from the resort dock, roughly 10 minutes.",
      "Boat across Bay Lake to the Contemporary and Fort Wilderness.",
      "Bus to Epcot, Hollywood Studios, Animal Kingdom, Disney Springs and the water parks.",
      "No monorail and no Skyliner."
    ],
    dining:[
      ["Signature and table service","Story Book Dining at Artist Point with Snow White. Whispering Canyon Caf&eacute; for all three meals."],
      ["Quick service","Roaring Fork. Geyser Point Bar and Grill on Bay Lake, counter service and lounge in one."],
      ["Bars and lounges","Territory Lounge, Trout Pass Pool Bar, Geyser Point bar."]
    ],
    amenities:[
      "Copper Creek Springs Pool with a slide and Fire Rock Geyser, the closer of the two pools to these villas, plus the quieter Boulder Ridge Cove Pool.",
      "Sturdy Branches Health Club, Teton Boat and Bike Rental, and beach access on Bay Lake.",
      "Community Hall, arcade, campfires, outdoor movies, and carriage rides through the grounds.",
      "Cascade Cabin guests get a private hot tub and a dock &mdash; the closest thing to a house on the water in the DVC system."
    ]
  },
  {
    name:"Old Key West", exp:2057, direct:215, resale:97.04, dues:11.2054, restricted:false,
    alert:"Old Key West trades in two deed lengths. Everything here models the <strong>extended 2057 deed</strong>, which sells at a premium. If the contract you are looking at is an original <strong>2042</strong> deed, it expires 15 years sooner than the figures on this page assume &mdash; check the expiration on the listing itself.",
    modes:["boat","bus"], modeLabel:"Boat &middot; Bus",
    note:"The largest rooms in the entire system &mdash; the one-bedroom is 942 square feet, bigger than some two-bedrooms elsewhere. The trade-off is the highest dues at Walt Disney World outside the Fort Wilderness cabins, and a sprawling bus-dependent layout.",
    rooms:[
      ["Deluxe Studio","5","Two queen beds, unusual for DVC. Standard or Near Hospitality House."],
      ["One-Bedroom Villa","5","942 sq ft. King, queen sleeper, plus a chair bed."],
      ["Two-Bedroom Villa","9","Lock-off or dedicated."],
      ["Three-Bedroom Grand Villa","12","Single-story, 2,265 sq ft."]
    ],
    transport:[
      "Bus to all four parks, the water parks and Disney Springs. No park is walkable.",
      "Boat to Disney Springs from the Hospitality House dock &mdash; scenic, slow, and it stops running in bad weather.",
      "Four internal bus stops across a sprawling site. Ask for a building near the Hospitality House if bus time bothers you.",
      "Parking is at your building, which makes this one of the easiest resorts to drive from."
    ],
    dining:[
      ["Table service","Olivia's Caf&eacute;, home-style Key West cooking and one of the more relaxed sit-down rooms on property. Breakfast here is a genuine local institution."],
      ["Quick service","Good's Food to Go, a walk-up window at the Hospitality House. Turtle Shack Pool Bar near the Turtle Pond pool, seasonal."],
      ["Bars and lounges","Gurgling Suitcase Libations, a tiny bar off Olivia's with maybe a dozen seats."]
    ],
    amenities:[
      "Sandcastle Pool with a 125-foot slide, a sauna and a hot tub, plus three quiet pools spread through the resort.",
      "R.E.S.T. Beach Recreation for bike, surrey and watercraft rentals on Trumbo Canyon.",
      "Community Hall, two tennis courts, basketball, shuffleboard, volleyball, a playground and the Electric Eel Arcade.",
      "Movies under the stars, fishing excursions on Bay Lake, and Conch Flats General Store.",
      "Full washer and dryer in every villa including studios &mdash; unusual, and the practical reason many families with kids stay here."
    ]
  },
  {
    name:"Polynesian Villas &amp; Bungalows", exp:2066, direct:243, resale:169.58, dues:8.3334, restricted:false,
    modes:["walk","monorail","boat","bus"], modeLabel:"Walk &middot; Monorail &middot; Boat &middot; Bus",
    note:"Two very different products on one deed. The longhouse studios are the largest deluxe studios in DVC at 447 square feet; the Island Tower added a full range of villa sizes in December 2024. Low dues, high resale price &mdash; the market has already priced in the location.",
    alert:"Exterior work on the Great Ceremonial House runs through 2026, and views from &lsquo;Ohana may be partly obstructed. Trader Sam&rsquo;s Tiki Terrace has been closed for refurbishment.",
    rooms:[
      ["Longhouse Deluxe Studio","5","447 sq ft, split bathroom. Standard, Lake, or Theme Park view."],
      ["Bungalow","8","Over-water on Seven Seas Lagoon with a plunge pool. Highest points per night of any non-grand villa."],
      ["Island Tower Duo Studio","2","262 sq ft, queen Murphy bed only. No connecting rooms."],
      ["Island Tower Deluxe Studio","4","Has a dishwasher, which studios normally do not."],
      ["Island Tower One-Bedroom","5","Full kitchen, laundry, patio."],
      ["Island Tower Two-Bedroom","9","Three full baths."],
      ["Island Tower Two-Bedroom Penthouse","8","Top floor, wraparound patio facing Magic Kingdom."]
    ],
    transport:[
      "Monorail resort loop to Magic Kingdom and the Ticket and Transportation Center; transfer at the TTC for the Epcot monorail.",
      "Boat to Magic Kingdom across Seven Seas Lagoon, often faster than the monorail.",
      "Walk about 10 minutes to the Grand Floridian on a paved path, and on to Magic Kingdom in roughly 20 minutes total.",
      "Walk about 10 minutes to the TTC, which is the quickest route to Epcot on a busy morning.",
      "Bus to Animal Kingdom, Hollywood Studios, Disney Springs and the water parks."
    ],
    dining:[
      ["Signature and table service","&lsquo;Ohana, family-style Polynesian dinner and the Lilo and Stitch Best Friends Breakfast &mdash; the hardest reservation on this side of property. Kona Caf&eacute; for Tonga Toast and macadamia pancakes. Wailulu Bar and Grill in the Island Tower, table service with lagoon views and far easier to book."],
      ["Quick service","Capt. Cook's, open early and late. Pineapple Lanai for Dole Whip. Kona Island for coffee and grab-and-go sushi."],
      ["Bars and lounges","Trader Sam's Grog Grotto, the tiki bar with the interactive effects &mdash; walk-up only, and the line forms before it opens. Tambu Lounge beside &lsquo;Ohana serves the same appetizers. Barefoot Pool Bar and the Oasis Bar and Grill at the Island Tower pool."]
    ],
    amenities:[
      "Lava Pool with a volcano slide and a zero-entry edge, the Oasis quiet pool, and the Island Tower pool with the Moana splash pad.",
      "White sand beach on Seven Seas Lagoon with direct sightlines to the Magic Kingdom fireworks and the Electrical Water Pageant.",
      "Nightly torch lighting ceremony, campfires, and outdoor movies on the beach.",
      "Fitness center in the Island Tower, Community Hall, Moana Mercantile, and the Moorea Marina for watercraft.",
      "Lowest dues of any Magic Kingdom-area DVC resort except Grand Floridian, which matters more over thirty years than the purchase price does."
    ]
  },
  {
    name:"Riviera Resort", exp:2070, direct:243, resale:123.72, dues:9.4553, restricted:true,
    modes:["skyliner","bus"], modeLabel:"Skyliner &middot; Bus",
    note:"Skyliner to both Epcot and Hollywood Studios. The resale restriction is severe: a Riviera resale contract can book Riviera and nothing else, ever. That is the entire reason it trades at roughly half the direct price despite being one of the newest deeds.",
    rooms:[
      ["Tower Studio","2","255 sq ft, queen Murphy bed, shower only. Cheapest room in the system by points."],
      ["Deluxe Studio","5","Standard or Preferred view."],
      ["One-Bedroom Villa","5","Standard or Preferred. 813 sq ft."],
      ["Two-Bedroom Villa","9","Lock-off or dedicated."],
      ["Three-Bedroom Grand Villa","12","Corner units with wraparound balconies."]
    ],
    transport:[
      "Skyliner station at the resort, direct to Epcot's International Gateway and, with one transfer at Caribbean Beach, to Hollywood Studios.",
      "Bus to Magic Kingdom, Animal Kingdom, Disney Springs and the water parks.",
      "No boat and no monorail. The Skyliner stops for lightning and high wind, and the bus backup adds real time on those days.",
      "Compact enough to walk the whole resort in a few minutes, which is a genuine advantage with a stroller."
    ],
    dining:[
      ["Signature and table service","Topolino's Terrace &mdash; Flavors of the Riviera on the rooftop: a French-Italian dinner signature, and Breakfast &agrave; la Art with Mickey and friends in artist smocks. One of the best character meals on property."],
      ["Quick service","Primo Piatto, a genuinely good counter service with breakfast through dinner."],
      ["Bars and lounges","Le Petit Caf&eacute;, a lobby coffee bar by day and a wine bar by night. Bar Riva at the pool."]
    ],
    amenities:[
      "Riviera Pool with a zero-entry edge and a slide, the Beau Soleil quiet pool, and the S'il Vous Play splash pad.",
      "Rooftop sightlines to both the Epcot and Hollywood Studios fireworks from Topolino's Terrace and the observation deck.",
      "Bambou Feu fire pit, movies on the lawn, and a curated art collection with member art tours.",
      "Fitness center, Community Hall, and Le Petit Caf&eacute; &mdash; the smallest DVC footprint at Walt Disney World, and the least walking."
    ]
  },
  {
    name:"Saratoga Springs Resort &amp; Spa", exp:2054, direct:215, resale:102.56, dues:9.1877, restricted:false,
    modes:["boat","bus"], modeLabel:"Boat &middot; Bus",
    note:"The largest resort in the system, which is exactly why people buy it: availability at seven months is better here than anywhere else, so it works well as a cheap trading contract.",
    alert:"The Turf Club Bar and Grill and its lounge have been in phased refurbishment from March through mid-September 2026. Check what is open before you count on it.",
    rooms:[
      ["Deluxe Studio","5","Standard or Preferred view."],
      ["One-Bedroom Villa","4","Plus one child under three."],
      ["Two-Bedroom Villa","8","Lock-off or dedicated."],
      ["Three-Bedroom Grand Villa","12","Two-story."],
      ["Treehouse Villa","9","Freestanding three-bedroom cabin elevated in the woods. Its own bus stop."]
    ],
    transport:[
      "Boat to Disney Springs, and a walkway over the bridge that takes 10&ndash;15 minutes on foot.",
      "Bus to all four parks and the water parks. No park is walkable.",
      "Five internal bus stops &mdash; Congress Park, The Springs, The Paddock, The Carousel, The Grandstand &mdash; plus a separate Treehouse stop. Longest internal transit of any DVC resort, so request The Springs if that matters.",
      "Congress Park buildings look across the water at Disney Springs and are the shortest walk out."
    ],
    dining:[
      ["Table service","The Turf Club Bar and Grill, with a patio over the golf course. Currently in phased refurbishment."],
      ["Quick service","The Artist's Palette, a combined counter service and grocery market that is the resort's hub. The Paddock Grill by the main pool."],
      ["Bars and lounges","On the Rocks at High Rock Spring Pool, Backstretch Pool Bar at The Paddock, and the Turf Club Lounge.",],
      ["Nearby","Disney Springs is a 10-minute walk or a short boat ride, which effectively gives this resort forty restaurants."]
    ],
    amenities:[
      "High Rock Spring Pool with a zero-entry edge, a slide and a waterfall, plus three leisure pools spread across the site.",
      "Senses Spa, a full-service spa &mdash; one of only two at a DVC resort.",
      "Lake Buena Vista Golf Course on the property, plus tennis, basketball, bike and surrey rentals, and a playground.",
      "Community Hall, Win Place or Show Arcade, campfires and outdoor movies.",
      "The Disney Springs walkway is the underrated feature: dinner without a bus, and a grocery run without a car."
    ]
  },
  {
    name:"Villas at Grand Floridian", exp:2064, direct:275, resale:165.78, dues:8.3142, restricted:false,
    modes:["walk","monorail","boat","bus"], modeLabel:"Walk &middot; Monorail &middot; Boat &middot; Bus",
    note:"The lowest dues at Walt Disney World and a walking path to Magic Kingdom. The Resort Studios in Big Pine Key are converted hotel rooms &mdash; more floor space and two real queen beds, but only a beverage cooler instead of a kitchenette.",
    alert:"A resort-wide refurbishment runs into 2027. Grand Floridian Caf&eacute; closed on 20 July 2026 with reopening expected around October; its brunch has moved to C&iacute;tricos in the meantime and there is no dinner replacement.",
    rooms:[
      ["Resort Studio","5","Big Pine Key building. Two queens, ~440 sq ft, no kitchenette."],
      ["Deluxe Studio","5","~374 sq ft with a full kitchenette and split bath. Standard, Lake, or Theme Park view."],
      ["One-Bedroom Villa","5","844 sq ft."],
      ["Two-Bedroom Villa","9","Lock-off or dedicated."],
      ["Three-Bedroom Grand Villa","12","Very limited inventory."]
    ],
    transport:[
      "Walk to Magic Kingdom in about 15 minutes on a dedicated paved path &mdash; the villas sit at the near end of it.",
      "Monorail resort loop to Magic Kingdom and the Ticket and Transportation Center; transfer for Epcot.",
      "Boat to Magic Kingdom across Seven Seas Lagoon.",
      "Walk about 10 minutes to the Polynesian, which doubles your dining options.",
      "Bus to Animal Kingdom, Hollywood Studios, Disney Springs and the water parks."
    ],
    dining:[
      ["Signature and table service","Victoria and Albert's, the only Forbes Five-Star restaurant in Florida &mdash; adults only, jackets, months of lead time. C&iacute;tricos and Narcoossee's, both signatures. 1900 Park Fare for character dining. Grand Floridian Caf&eacute; is closed for a refresh until roughly October 2026."],
      ["Quick service","Gasparilla Island Grill, open 24 hours, which is genuinely useful with a small child."],
      ["Bars and lounges","Enchanted Rose, a large themed lounge off the lobby. Garden View Tea Room, whose afternoon tea returned in 2026 after six years. Beaches Pool Bar and Grill, Courtyard Pool Bar, and the C&iacute;tricos lounge."]
    ],
    amenities:[
      "Beach Pool with a slide and the Alice in Wonderland splash pad, plus the quieter Courtyard Pool.",
      "Senses Spa at the Grand Floridian and a full health club.",
      "White sand beach with fireworks and Electrical Water Pageant views, and the Captain's Shipyard marina for watercraft.",
      "The Grand Floridian Society Orchestra and a lobby pianist play daily in the atrium &mdash; the most formal resort lobby on property.",
      "Community Hall, arcade, and a location that lets you walk home from Magic Kingdom at park close instead of queuing for a bus."
    ]
  },
  {
    name:"The Cabins at Fort Wilderness", exp:2075, direct:243, resale:null, dues:12.2756, restricted:true,
    modes:["boat","bus"], modeLabel:"Boat &middot; Bus",
    note:"The longest deed in the system and the highest dues. One room type only. Resale contracts here can book nothing but these cabins, and the resale market is still too thin to price reliably.",
    rooms:[
      ["Cabin","6","Freestanding cabin with a bedroom, a living area with a Murphy bed, a full kitchen, and a deck. Park at your door."]
    ],
    transport:[
      "Boat to Magic Kingdom from the Settlement dock, and across Bay Lake to Wilderness Lodge and the Contemporary.",
      "Bus to Epcot, Hollywood Studios, Animal Kingdom and Disney Springs &mdash; but almost every trip starts with an internal bus to the Settlement or Outpost first.",
      "Internal buses run constantly because the campground is 750 acres. Realistically the most transit-heavy resort at Walt Disney World.",
      "The offsetting advantage is that you park a car at your own cabin, which no other DVC resort offers."
    ],
    dining:[
      ["Table service and shows","Hoop-Dee-Doo Musical Revue at Pioneer Hall, the long-running dinner show and still one of the better-value meals on property."],
      ["Quick service","Trail's End Restaurant, now a quick-service marketplace serving breakfast, lunch and dinner &mdash; it is no longer the buffet older guides describe. Meadow Snack Bar, seasonal. The Chuck Wagon food truck."],
      ["Bars and lounges","Crockett's Tavern beside Pioneer Hall, open afternoons and evenings, with a full lounge menu."],
      ["Nearby","A short boat ride reaches Geyser Point and Whispering Canyon at Wilderness Lodge, which is what most guests actually do for a sit-down meal."]
    ],
    amenities:[
      "Meadow Swimmin' Pool with a slide and a splash zone, plus the smaller Wilderness Swimmin' Pool.",
      "Tri-Circle-D Ranch for horseback trail rides, pony rides and carriage rides &mdash; the only stables on property.",
      "Archery, fishing excursions, canoe and kayak rentals, bike and golf cart rentals at the Bike Barn.",
      "Nightly campfire with Chip 'n Dale and an outdoor movie, plus Electrical Water Pageant views from the beach.",
      "Tennis, basketball, volleyball, horseshoes, and Davy Crockett's Wilderness Arcade.",
      "Every cabin has a full kitchen and a private deck with a grill and a picnic table."
    ]
  }
];

const UPCOMING = {
  name:"Disney's Lakeshore Lodge", opens:"1 July 2027",
  note:"On Bay Lake between Wilderness Lodge and Fort Wilderness, 967 accommodations. Cash bookings open 6 October 2026 for members and 8 October for everyone. DVC point sales, price, dues and point charts have not been announced. The filed resort plan confirms it will carry the modern resale restrictions, so resale points from anywhere else will not book it.",
  rooms:[
    ["Resort Studio &mdash; Queen","4","Two queens, hotel-style with microwave and mini fridge."],
    ["Resort Studio &mdash; King","2","King bed, hotel-style."],
    ["Duo Studio","2","Queen pull-down, kitchenette, balcony."],
    ["Deluxe Studio","4","Queen plus queen pull-down, kitchenette."],
    ["One-Bedroom Villa","5","Full kitchen, laundry, split bath with soaking tub."],
    ["Two-Bedroom Villa","9","Adds a third bathroom."],
    ["Three-Bedroom Grand Villa","12","Bay Lake views."],
    ["One-Bedroom Lake House","5","Freestanding waterfront unit."],
    ["Two-Bedroom Lake House","8","A-frame with a waterfront porch."],
    ["Hidden Willow Presidential Suite","6","Two bedrooms, club level, fireworks views."]
  ],
  transport:[
    "Water taxi to Magic Kingdom across Bay Lake.",
    "Bus to everywhere else. No monorail, no Skyliner, no walking path to a park."
  ],
  dining:[
    ["Announced so far","The Artist's Nest concierge lounge for club-level guests &mdash; only the second club level at a Walt Disney World DVC resort, after Animal Kingdom Lodge. Full restaurant lineup has not been released."]
  ],
  amenities:[
    "A lazy river is confirmed, which no other Magic Kingdom-area DVC resort has.",
    "Nature and conservation theming throughout, carried over from the shelved Reflections concept.",
    "Point charts, dues and amenity detail are still unannounced &mdash; treat anything more specific as rumor."
  ]
};
