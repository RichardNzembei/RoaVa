/*
  Curated, Kenya-resonant marketing imagery (Maasai Mara / safari / savanna).
  Verified free Pexels photos (free license, hotlink-permitted). Replace with
  the owner's own licensed Kenyan photography before launch — the design spec
  wants real, owned imagery, never generic stock (see DEPLOYMENT.md).

  Served compressed + sized for the data budget.
*/
function pexels(id: number, w = 1600): string {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
}

// Rotating hero backgrounds — the BREADTH of RoaVa, "Kenya from every angle":
// wildlife, hikes, the coast, the city, live events, and hidden-gem scenery —
// not just safari. (Free Pexels stock; swap for owned Kenyan photography.)
export const HERO_IMAGES = [
  pexels(33498304), // savanna / wildlife
  pexels(35037648), // hiking / mountains
  pexels(13291966), // coast / beach
  pexels(15496531), // Nairobi / city
  pexels(29705399), // festival / live event
  pexels(37824301), // forest / waterfall — hidden gems
];

export const OPERATOR_BAND_IMAGE = pexels(11189478, 1200); // people on an experience

/*
  Optional hero video. Empty by default: a full-screen autoplay video conflicts
  with the data-light budget (low-end Android, metered 4G), so it's off until
  the owner supplies a properly-encoded, licensed landscape Kenya clip
  (target ≤ ~3 MB, 720p, muted, looping). When set, the hero only plays it on
  fast connections with motion allowed; everyone else keeps the image carousel.
*/
export const HERO_VIDEO_SRC = "";
