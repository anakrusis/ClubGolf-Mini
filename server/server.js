var config = require('./config.js');

var io = require('socket.io')(config.port);

var clubs = require('./clubs.json');
var map = require('./map.json');
map.trees = []
map.par = 4

console.log("Starting server...\n") // init server

var players = []
var currentPlayer = 0;
var mapData = map.layers[0].data

var ballActive = false;

// getting positions of stuff that your only supposed to have 1 per map (if you have 0 it will BE BAD)
var startTile = mapData.findIndex( function(element, index, array){ return element == 21 });
var startX = (startTile % map.width) * 8;
var startY = Math.floor(startTile / map.width) * 8;
console.log("Start pos.: " + startX + "," + startY);
var holeTile = mapData.findIndex( function(element, index, array){ return element == 25 });
var holeX = (holeTile % map.width) * 8;
var holeY = Math.floor(holeTile / map.width) * 8;
console.log("Hole pos.: " + holeX + "," + holeY);

var getTileIndex = function(x, y){
	x = Math.floor(x / 8); y = Math.floor(y / 8);
	return ((y) * map.width ) + (x);
}

var nextAvailablePlayer = function(){
	for (i = 0; i < players.length; i++) {
		index = (currentPlayer + i + 1) % players.length;
		if (!players[index].done){
			return index;
		}
	}
	return -1;
}

class Tree {
	constructor(x_in, y_in){
		this.x = x_in;
		this.y = y_in;
		this.texture = 1;
		this.height = 16;
		this.width = 16;
		this.shadow = false;
	}
}

for (i = 0; i < config.max_trees; i++){
	treeX = Math.round ( Math.random() * map.width  * 8 );
	treeY = Math.round ( Math.random() * map.height * 8 );
	tree = new Tree (treeX, treeY) ;
	tree.height = Math.random() * 20 + 12;
	
	index = getTileIndex(treeX, treeY);
	if (mapData[index] == 1){
		map.trees.push( tree )
	}
}

var update = function () {
	if (players[currentPlayer]){
		ball = players[currentPlayer].ball;
		ball.x += ( ball.velocity * Math.cos(ball.dir) )
		ball.y += ( ball.velocity * Math.sin(ball.dir) )
	
		ball.velocity /= 1.1;
	
		if (ball.velocity < 0.001){
			ball.velocity = 0;
		}
	
		if (ballActive && ball.velocity < 1) {
			index = getTileIndex(ball.x, ball.y);
			if (mapData[index] == 25){
				players[currentPlayer].done = true;
				io.emit("playerUpdate", players[currentPlayer], currentPlayer);
				console.log(players[currentPlayer].name + " is done!");
				ball.velocity = 0;
			}
		}
		io.emit("ballUpdate", currentPlayer, ball);
		
		if (ball.velocity == 0){ // on Shot Finish
			if (ballActive){
	
				next = nextAvailablePlayer();	
				console.log(next);
				
				if (next != -1){
					players[currentPlayer].shot++; // incrementing the old players shot first.
					
					currentPlayer = next;
					io.emit("playerUpdate", players[currentPlayer], currentPlayer);
					io.emit("shotFinish", currentPlayer);
					console.log(players[currentPlayer].name + "'s turn! (ID: " + players[currentPlayer].id + ")");
					
				} else {
					console.log("Game over!");
				}
				ballActive = false;
			}
		}
	}
}

setInterval(()=> {update()}, 50);

io.on('connection', function (socket) {

	socket.on("ballHit", function (playerID, ball) {
	
		if (!ballActive && playerID == currentPlayer){
			currentClub = players[playerID].club;
			ball.velocity = clubs.clubs[currentClub].vel;
			players[playerID].ball = ball;
			io.emit("ballUpdate", playerID, ball);
			ballActive = true;
		}

	});

	socket.on("playerJoinRequest", function (playerJoining) {
		
		playerJoining.x = startX + (Math.random() * 32); // initialize player serverside
		playerJoining.y = startY + (Math.random() * 32);
		
		playerJoining.ball.x = playerJoining.x
		playerJoining.ball.y = playerJoining.y + 8
		
		//playerJoining.x = startX;
		//playerJoining.y = startY;
		
		playerJoining.id = players.length;
		
		players.push(playerJoining);
		
		io.emit("playerJoin", playerJoining, players, map, clubs.clubs, currentPlayer);
		io.emit("playerUpdate", playerJoining, playerJoining.id);
		
		console.log(playerJoining.name + " has joined the server (ID: " + playerJoining.id + ")" )
	});
	
	socket.on("playerUpdateRequest", function (playerUpdating, playerID) {
		//if (playerID == currentPlayer){
		if (true){
			players[playerID] = playerUpdating;
			io.emit("playerUpdate", playerUpdating, playerID);
		}
	});
	
	socket.on("ballUpdateRequest", function (playerID, ball) {
		// todo
	});
	
	socket.on("disconnect", function () {
		playerLeaving = getPlayerFromSocket(socket)
		
		console.log( playerLeaving.name + " has left the server (ID: " + playerLeaving.id + ")")
		players.splice(playerLeaving.id, 1)
		for (i = playerLeaving.id; i < players.length; i++){
			players[i].id--;
		}
		if (currentPlayer >= playerLeaving.id){
			currentPlayer--;
			currentPlayer = Math.max(currentPlayer, 0)
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

