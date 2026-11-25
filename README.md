# Trench Crusade Campaign Tracker

A Windows XP-styled page that tracks a Trench Crusade campaign: Campaign VP, Glory, XP, treasure, wins and losses, and head-to-head records.

Everything is in `data.js`. Add a game to `games` (and a warband to `warbands` when someone joins); the page works out the rest.

Campaign VP: win +15, loss +7, draw +10.

When you change `style.css`, `data.js` or `app.js`, bump the `?v=` number on their links in `index.html` so browsers don't mix old and new files.
