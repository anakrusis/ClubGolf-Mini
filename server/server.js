var config = require('./config.js');

var io = require('socket.io')(config.port);

var map = require('./map.json');

console.log("Starting server") // init server

var players = []
var mapData = map.layers[0].data

var startTile = mapData.findIndex( function(element, index, array){ return element == 21 });
console.log(startTile)

var startX = (startTile % map.width) * 8;
var startY = Math.floor(startTile / map.width) * 8;

io.on('connection', function (socket) {

	socket.on("playerJoin", function (playerJoining) {
		console.log(playerJoining.name + " has joined the server")
		
		playerJoining.x = startX + (Math.random() * 32);
		playerJoining.y = startY + (Math.random() * 32);
		playerJoining.id = players.length;
		
		players.push(playerJoining);
		
		io.emit("playerJoin", playerJoining, players, map)
		io.emit("playerMove", playerJoining.id, startX, startY)
	});
	
	socket.on("disconnect", function () {
		
	});
});

