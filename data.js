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
      strongbox: 545,   // +100 if the High-Ranking Captive is ransomed (option not picked yet)
      glory: 1
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
      strongbox: 0,          // called for Reinforcements after games 2 and 3
      glory: 6               // 8 start - 4 Mamluk Faris - 4 Knighthood (bought after game 1), + games (deeds + Knighthood)
    },
    {
      id: "akuu20",
      name: "Children of Gro-goroth",
      player: "Akuu20",
      faction: "The Cult of the Black Grail",
      variant: null,
      patron: "Anti-Pope of Avignon",
      color: "#d08a00",
      strongbox: null,
      glory: 1               // 14 start (8 + 6 latecomer catch-up), all spent on the list; +1 game 4
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
      glory: { fim: 2, eire: 1 },   // eire: Hold Your Ground (no Knighthood yet)
      xp: { fim: 7, eire: null },
      ducats: { fim: 180, eire: 110 },   // fim: old 30 Pieces of Silver (20) removed
    },
    {
      n: 2,
      date: "2026-11-25",
      scenario: "Hunt for Heroes",
      players: ["fim", "eire"],
      winner: "fim",
      vp: { fim: 29, eire: 17 },
      glory: { fim: 2, eire: 2 },   // eire: High Risk, High Reward + Knighthood (Lieutenant survived)
      xp: { fim: 8, eire: null },
      ducats: { fim: 160, eire: 0 },   // fim: old 30 Pieces of Silver (16) removed; eire skipped Exploration (Reinforcements)
    },
    {
      n: 3,
      date: "2026-11-26",
      scenario: "Supply Raid",
      players: ["fim", "eire"],
      winner: "fim",
      vp: { fim: 19, eire: 6 },
      glory: { fim: 3, eire: 3 },   // eire: 3 deeds; no Knighthood Glory (Lieutenant taken Out of Action)
      xp: { fim: 7, eire: null },
      ducats: { fim: 160, eire: 0 },   // fim: Exploration 16 (Black Market); eire skipped Exploration (Reinforcements)
    },
    {
      n: 4,
      date: "2026-11-27",
      scenario: "Armoured Train",
      players: ["fim", "akuu20"],
      winner: "draw",   // agreed after the game: 6-8 on the table, but Undead Fortitude had been applied against FIRE
      vp: { fim: 6, akuu20: 8 },
      glory: { fim: 1, akuu20: 1 },   // fim: Knighthood
      xp: { fim: 4, akuu20: null },
      ducats: { fim: 290, akuu20: null },   // fim: Exploration 29 -> 25 High-Ranking Captive
    }
  ]
};
