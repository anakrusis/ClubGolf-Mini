var config = require('./config.js');

var io = require('socket.io')(config.port);

var map = require('./map.json');
map.trees = []

console.log("Starting server") // init server

var players = []
var mapData = map.layers[0].data

var startTile = mapData.findIndex( function(element, index, array){ return element == 21 });
console.log(startTile)

var startX = (startTile % map.width) * 8;
var startY = Math.floor(startTile / map.width) * 8;

class Tree {
	constructor(x_in, y_in){
		this.x = x_in;
		this.y = y_in;
		this.texture = 1;
		this.height = 16;
	}
}

for (i = 0; i < config.max_trees; i++){
	treeX = Math.round ( Math.random() * map.width  * 8 );
	treeY = Math.round ( Math.random() * map.height * 8 );
	tree = new Tree (treeX, treeY) ;
	tree.height = Math.random() * 20 + 8;
	
	map.trees.push( tree )
}

io.on('connection', function (socket) {

	socket.on("playerJoinRequest", function (playerJoining) {
		
		playerJoining.x = startX + (Math.random() * 32); // initialize player serverside
		playerJoining.y = startY + (Math.random() * 32);
		
		//playerJoining.x = startX;
		//playerJoining.y = startY;
		
		playerJoining.id = players.length;
		
		players.push(playerJoining);
		
		io.emit("playerJoin", playerJoining, players, map)
		io.emit("playerMove", playerJoining.id, playerJoining.x, playerJoining.y)
		
		console.log(playerJoining.name + " has joined the server (ID: " + playerJoining.id + ")" )
	});
	
	socket.on("disconnect", function () {
		playerLeaving = getPlayerFromSocket(socket)
		
		console.log( playerLeaving.name + " has left the server (ID: " + playerLeaving.id + ")")
		players.splice(playerLeaving.id, 1)
		for (i = playerLeaving.id; i < players.length; i++){
			players[i].id--;
		}
		io.emit("playerLeave", playerLeaving.id, players)
	});
});

var getPlayerFromSocket = function(socket_in){
	for (i=0; i<players.length; i++){
		if (socket_in.id == players[i].socket) {
			return players[i];
		}
	}
	return -1;
}

