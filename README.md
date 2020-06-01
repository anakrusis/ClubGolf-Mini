# ClubGolf Mini
ClubGolf Mini is a multiplayer golf game using [socket.io](https://socket.io/). Host a server and play golf with friends! 

Maps are made in [Tiled](https://www.mapeditor.org/); both the .tmx source files and the exported .json files are present. The music is made from MIDI files, converted to MML with a custom python script. See the util folder for the source .mids and more! The tiles and other textures were made in [paint.net](https://www.getpaint.net/).

# How to play

ClubGolf Mini can run locally or on a file server! If playing the game locally, simply run the index.html file in your browser of choice. This game runs best in Firefox, and runs worse in Chrome.

__Controls:__

A/D:    Aim left/right

W/S:    Change club

Space:  Hold down and release at the right time to hit the ball!

Scroll: Zoom in/out

# How to host

The server uses socket.io for networking. You can use [npm](https://www.npmjs.com/) to download it! Once you have socket.io in your node_modules folder, just run server.bat, or do "node server.js".

__Server Commands:__

/list:           Lists all players and their IDs

/restart:        Restarts the current map

/load (mapname): Loads a new map to be sent on the next map restart

/kick (id):      Kicks a player

/stop:           Stops the server

# Credits
anakrusis/adggfjggfafafafa: programming, assets 

krma420: local storage programming and refactoring

Simon M.: course design

DeaSTL: power meter art
