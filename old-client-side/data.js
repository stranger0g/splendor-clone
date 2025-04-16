// Splendor Game Data

const GEM_TYPES = ['white', 'blue', 'green', 'red', 'black'];
const GOLD = 'gold';

// Updated CARDS_DATA based on the provided images and specific request
const CARDS_DATA = [
  // --- Black Cards ---
  // Level 1 (8 cards)
  { level: 1, color: 'black', vp: 0, cost: { white: 1, red: 1, blue: 1, green: 1 } },
  { level: 1, color: 'black', vp: 0, cost: { red: 1, green: 2 } },
  { level: 1, color: 'black', vp: 0, cost: { white: 2, green: 2 } },
  { level: 1, color: 'black', vp: 0, cost: { black: 1, red: 3, green: 1 } },
  { level: 1, color: 'black', vp: 0, cost: { blue: 3 } },
  { level: 1, color: 'black', vp: 0, cost: { white: 1, red: 1, blue: 2, green: 1 } },
  { level: 1, color: 'black', vp: 0, cost: { white: 2, red: 1, blue: 2 } },
  { level: 1, color: 'black', vp: 1, cost: { blue: 4 } },
  // Level 2 (6 cards)
  { level: 2, color: 'black', vp: 1, cost: { white: 3, blue: 2, green: 2 } },
  { level: 2, color: 'black', vp: 1, cost: { black: 2, white: 3, green: 3 } },
  { level: 2, color: 'black', vp: 2, cost: { red: 2, blue: 1, green: 4 } },
  { level: 2, color: 'black', vp: 2, cost: { white: 5 } },
  { level: 2, color: 'black', vp: 2, cost: { red: 3, green: 5 } },
  { level: 2, color: 'black', vp: 3, cost: { black: 6 } },
  // Level 3 (4 cards)
  { level: 3, color: 'black', vp: 3, cost: { white: 3, red: 3, blue: 3, green: 5 } },
  { level: 3, color: 'black', vp: 4, cost: { red: 7 } },
  { level: 3, color: 'black', vp: 4, cost: { black: 3, red: 6, green: 3 } },
  { level: 3, color: 'black', vp: 5, cost: { black: 3, red: 7 } },

  // --- Blue Cards ---
  // Level 1 (8 cards)
  { level: 1, color: 'blue', vp: 0, cost: { black: 2, white: 1 } },
  { level: 1, color: 'blue', vp: 0, cost: { black: 1, white: 1, red: 2, green: 1 } },
  { level: 1, color: 'blue', vp: 0, cost: { black: 1, white: 1, red: 1 } },
  { level: 1, color: 'blue', vp: 0, cost: { red: 1, blue: 1, green: 3 } },
  { level: 1, color: 'blue', vp: 0, cost: { black: 3 } },
  { level: 1, color: 'blue', vp: 0, cost: { white: 1, red: 2, green: 2 } },
  { level: 1, color: 'blue', vp: 0, cost: { black: 2, green: 2 } },
  { level: 1, color: 'blue', vp: 1, cost: { red: 4 } },
  // Level 2 (6 cards)
  { level: 2, color: 'blue', vp: 1, cost: { white: 5, red: 3 } },
  { level: 2, color: 'blue', vp: 1, cost: { blue: 2, red: 3, green: 2 } },
  { level: 2, color: 'blue', vp: 2, cost: { white: 5 } },
  { level: 2, color: 'blue', vp: 2, cost: { blue: 5 } },
  { level: 2, color: 'blue', vp: 2, cost: { black: 4, white: 2, red: 1 } },
  { level: 2, color: 'blue', vp: 3, cost: { blue: 6 } },
  // Level 3 (4 cards)
  { level: 3, color: 'blue', vp: 3, cost: { black: 5, white: 3, red: 3, green: 3 } },
  { level: 3, color: 'blue', vp: 4, cost: { white: 7 } },
  { level: 3, color: 'blue', vp: 4, cost: { black: 3, white: 6, blue: 3 } },
  { level: 3, color: 'blue', vp: 5, cost: { white: 7, blue: 3 } },

  // --- Green Cards ---
  // Level 1 (8 cards)
  { level: 1, color: 'green', vp: 0, cost: { white: 2, blue: 1 } },
  { level: 1, color: 'green', vp: 0, cost: { blue: 2, red: 2 } },
  { level: 1, color: 'green', vp: 0, cost: { white: 1, blue: 3, red: 1 } },
  { level: 1, color: 'green', vp: 0, cost: { black: 1, white: 1, blue: 1 } },
  { level: 1, color: 'green', vp: 0, cost: { black: 2, white: 1, blue: 1 } },
  { level: 1, color: 'green', vp: 0, cost: { black: 3, red: 2 } },
  { level: 1, color: 'green', vp: 0, cost: { red: 3 } },
  { level: 1, color: 'green', vp: 1, cost: { black: 4 } },
  // Level 2 (6 cards)
  { level: 2, color: 'green', vp: 1, cost: { black: 1, white: 2, blue: 4 } },
  { level: 2, color: 'green', vp: 1, cost: { white: 3, blue: 5 } },
  { level: 2, color: 'green', vp: 2, cost: { black: 1, white: 4, green: 2 } },
  { level: 2, color: 'green', vp: 2, cost: { blue: 5 } },
  { level: 2, color: 'green', vp: 2, cost: { black: 5, red: 3 } },
  { level: 2, color: 'green', vp: 3, cost: { green: 6 } },
  // Level 3 (4 cards)
  { level: 3, color: 'green', vp: 3, cost: { black: 3, white: 5, blue: 3, red: 3 } },
  { level: 3, color: 'green', vp: 4, cost: { blue: 7 } },
  { level: 3, color: 'green', vp: 4, cost: { black: 3, blue: 6, green: 3 } },
  { level: 3, color: 'green', vp: 5, cost: { blue: 7, green: 3 } },

  // --- Red Cards ---
  // Level 1 (8 cards)
  { level: 1, color: 'red', vp: 0, cost: { black: 3, white: 3 } },
  { level: 1, color: 'red', vp: 0, cost: { black: 1, white: 1, blue: 1 } },
  { level: 1, color: 'red', vp: 0, cost: { blue: 2, green: 1 } },
  { level: 1, color: 'red', vp: 0, cost: { black: 2, white: 2, green: 1 } },
  { level: 1, color: 'red', vp: 0, cost: { black: 1, white: 2, blue: 1, green: 1 } },
  { level: 1, color: 'red', vp: 0, cost: { black: 1, white: 1, green: 1 } },
  { level: 1, color: 'red', vp: 0, cost: { white: 2, blue: 2 } },
  { level: 1, color: 'red', vp: 1, cost: { white: 4 } },
  // Level 2 (6 cards)
  { level: 2, color: 'red', vp: 1, cost: { black: 3, blue: 2, green: 2 } },
  { level: 2, color: 'red', vp: 1, cost: { black: 2, white: 1, red: 2 } },
  { level: 2, color: 'red', vp: 2, cost: { black: 1, white: 4, blue: 2 } },
  { level: 2, color: 'red', vp: 2, cost: { black: 5, white: 3 } },
  { level: 2, color: 'red', vp: 2, cost: { black: 5 } },
  { level: 2, color: 'red', vp: 3, cost: { red: 6 } },
  // Level 3 (4 cards)
  { level: 3, color: 'red', vp: 3, cost: { black: 3, white: 3, blue: 5, green: 3 } },
  { level: 3, color: 'red', vp: 4, cost: { green: 7 } },
  { level: 3, color: 'red', vp: 4, cost: { white: 3, blue: 3, green: 6 } },
  { level: 3, color: 'red', vp: 5, cost: { white: 3, green: 7 } },

  // --- White Cards ---
  // Level 1 (8 cards)
  { level: 1, color: 'white', vp: 0, cost: { black: 1, blue: 2, green: 2 } },
  { level: 1, color: 'white', vp: 0, cost: { black: 1, red: 2 } },
  { level: 1, color: 'white', vp: 0, cost: { black: 1, red: 1, blue: 1, green: 1 } },
  { level: 1, color: 'white', vp: 0, cost: { red: 3 } },
  { level: 1, color: 'white', vp: 0, cost: { blue: 2, black: 2 } }, // 5th Card - COST UPDATED HERE
  { level: 1, color: 'white', vp: 0, cost: { black: 1, red: 1, blue: 1, green: 2 } },
  { level: 1, color: 'white', vp: 0, cost: { black: 1, white: 3, blue: 1 } },
  { level: 1, color: 'white', vp: 1, cost: { green: 4 } },
  // Level 2 (6 cards)
  { level: 2, color: 'white', vp: 1, cost: { red: 3, blue: 3, green: 2 } },
  { level: 2, color: 'white', vp: 1, cost: { blue: 5, green: 3 } },
  { level: 2, color: 'white', vp: 2, cost: { black: 2, green: 1, red: 4 } },
  { level: 2, color: 'white', vp: 2, cost: { red: 5 } },
  { level: 2, color: 'white', vp: 2, cost: { black: 3, red: 5 } },
  { level: 2, color: 'white', vp: 3, cost: { white: 6 } },
  // Level 3 (4 cards)
  { level: 3, color: 'white', vp: 3, cost: { black: 3, red: 3, blue: 3, green: 5 } },
  { level: 3, color: 'white', vp: 4, cost: { black: 7 } },
  { level: 3, color: 'white', vp: 4, cost: { black: 6, white: 3, green: 3 } },
  { level: 3, color: 'white', vp: 5, cost: { black: 7, white: 3 } },
];

const NOBLES_DATA = [
  { vp: 3, requirements: { black: 3, red: 3, white: 3 } },
  { vp: 3, requirements: { blue: 3, green: 3, white: 3 } },
  { vp: 3, requirements: { blue: 3, green: 3, red: 3 } },
  { vp: 3, requirements: { black: 3, red: 3, green: 3 } },
  { vp: 3, requirements: { black: 3, blue: 3, white: 3 } },
  { vp: 3, requirements: { black: 4, red: 4 } },
  { vp: 3, requirements: { green: 4, red: 4 } },
  { vp: 3, requirements: { blue: 4, green: 4 } },
  { vp: 3, requirements: { blue: 4, white: 4 } },
  { vp: 3, requirements: { black: 4, white: 4 } },
];

// Add unique IDs to cards and nobles and ensure cost/requirement objects are complete
let cardIdCounter = 0;
const ALL_CARDS = CARDS_DATA.map(card => ({
    ...card,
    id: `card-${cardIdCounter++}`,
    // Ensure all cost properties exist, defaulting to 0
    cost: {
        white: card.cost.white || 0,
        blue: card.cost.blue || 0,
        green: card.cost.green || 0,
        red: card.cost.red || 0,
        black: card.cost.black || 0,
    }
}));

let nobleIdCounter = 0;
const ALL_NOBLES = NOBLES_DATA.map(noble => ({
    ...noble,
    id: `noble-${nobleIdCounter++}`,
    // Ensure all requirement properties exist, defaulting to 0
    requirements: {
        white: noble.requirements.white || 0,
        blue: noble.requirements.blue || 0,
        green: noble.requirements.green || 0,
        red: noble.requirements.red || 0,
        black: noble.requirements.black || 0,
    }
}));