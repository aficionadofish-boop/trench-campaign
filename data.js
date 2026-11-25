// Campaign data. Edit this file after each game; the site recalculates everything else.
//
// Per game, per warband:
//   glory   = Glory earned that game (deeds, Glory Hound, etc.)
//   xp      = total Experience Points gained by the warband's models that game
//   ducats  = ducats earned that game (exploration loot, 30 Pieces of Silver, sales...)
//   (warband xpNow: current roster XP, shown when the per-game XP isn't known)
//   cvpBonus (optional) = extra Campaign VP (Treasure of the Holies, Patron's Visit)
// Use null when a number is not known yet. winner: warband id, or "draw".
// A warband with name: null is shown by its player's name until it has one.
// Campaign VP: win +15, loss +7, draw +10 (Digital Rulebook, Winning the Campaign).

window.CAMPAIGN = {
  name: "Trench Crusade Campaign",
  started: "2026-11-24",
  gamesPerPlayer: 12,
  thresholdNote: "Threshold: game N = 800 + 100 x (N - 1)",
  thresholdBase: 800,       // Threshold for game 1 (book is 700; agreed +100)
  thresholdStep: 100,

  warbands: [
    {
      id: "fim",
      name: "Friendship is Magic",
      player: "CMDR Nervous Energy",
      faction: "The Court of the Seven-Headed Serpent",
      variant: "Silk Bed of Sloth",
      patron: "Infernal Noble",
      color: "#9b2d6f",
      strongbox: 197,
      glory: 7
    },
    {
      id: "eire",
      name: "75th Eire Regiment",
      player: "Espiovv",
      faction: "New Antioch",
      variant: "Eire Rangers",
      patron: "Learned Saint",
      xpNow: 9,              // XP on his roster after game 2 (per-game split unknown)
      color: "#2e7d32",
      strongbox: 0,          // called for Reinforcements after game 2
      glory: null
    },
    {
      id: "akuu20",
      name: null,            // warband name not chosen yet
      player: "Akuu20",
      faction: null,
      variant: null,
      patron: null,
      color: "#d08a00",
      strongbox: null,
      glory: null
    },
    {
      id: "infernus",
      name: null,
      player: "Infernus",
      faction: null,
      variant: null,
      patron: null,
      color: "#5161b8",
      strongbox: null,
      glory: null
    }
  ],

  games: [
    {
      n: 1,
      date: "2026-11-24",
      scenario: "Retake No Man's Land",
      players: ["fim", "eire"],
      winner: "fim",
      vp: { fim: 18, eire: 3 },
      glory: { fim: 2, eire: 1 },
      xp: { fim: 7, eire: null },
      ducats: { fim: 200, eire: 110 },
    },
    {
      n: 2,
      date: "2026-11-25",
      scenario: "Hunt for Heroes",
      players: ["fim", "eire"],
      winner: "fim",
      vp: { fim: 29, eire: 17 },
      glory: { fim: 2, eire: 1 },
      xp: { fim: 8, eire: null },
      ducats: { fim: 176, eire: 0 },   // eire skipped Exploration (Reinforcements)
    }
  ]
};
