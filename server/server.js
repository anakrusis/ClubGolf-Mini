var config = require('./config.js');

var io = require('socket.io')(config.port);
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt:""
});

var clubs = require('./clubs.json');

var currentMap = -1;

console.log("Starting server...\n") // init server

var players = [];
var currentPlayer = 0;

var ballActive = false;
var betweenTurnTimer = -1;
var betweenCourseTimer = -1;
var BETWEEN_TURN_TIME = 56;
var BETWEEN_COURSE_TIME = 600;

var results_screen = false;
var results = [];
var results_names = []; // for now, results_names stores all the names per round

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
		this.collide = true;
	}
}

rl.on('line', (line) => {
	switch (line.trim()) {
		case "/list":
			for (i = 0; i < players.length; i++){
				console.log ( players[i].name + " (ID: " + players[i].id + ")" )
			}
			if (players.length == 0){
				console.log("No players online!")
			}
			console.log("");
			break;
		case "/restart":
			onCourseStart();
	}
	if (line.trim().substring(0,6) == "/load "){
		pathString = line.trim().substring(6);
		onMapLoad( pathString );
	}
});

var onMapLoad = function( path ) {
	if (path == ""){
		//mapLoaded = {}; // put cool perlin noise generation stuff here :3
	}else{
		fullPath = "./" + path + ".json";
		try {
	
			mapLoaded = require( fullPath );
			mapLoaded.par = 4
			console.log('Loaded map "' + path + '.json" successfully!\n');

		} catch( err ) {
			console.log('Could not load map "' + path + '.json"!\n'); 
		}
	}
}

var onCourseStart = function() {
	map = mapLoaded;
	mapData = map.layers[0].data

	// getting positions of stuff that your only supposed to have 1 per map (if you have 0 it will BE BAD)
	startTile = mapData.findIndex( function(element, index, array){ return element == 21 });
	startX = (startTile % map.width) * 8;
	startY = Math.floor(startTile / map.width) * 8;
	console.log("Start pos.: " + startX + "," + startY);
	holeTile = mapData.findIndex( function(element, index, array){ return element == 25 });
	holeX = (holeTile % map.width) * 8;
	holeY = Math.floor(holeTile / map.width) * 8;
	console.log("Hole pos.: " + holeX + "," + holeY + "\n");
	
	currentPlayer = 0;
	ballActive = false;
	
	map.trees = [];
	
	var flag = new Tree(holeX + 4, holeY + 4);
	flag.collide = false; flag.texture = 3;
	flag.width = 4; flag.height = 8;
	map.trees.push( flag );

	for (i = 0; i < config.max_trees; i++){ // Randomly spawns trees exclusively on Out of Bounds area
		treeX = Math.round ( Math.random() * map.width  * 8 );
		treeY = Math.round ( Math.random() * map.height * 8 );
		tree = new Tree (treeX, treeY) ;
		tree.height = Math.random() * 20 + 12;
		tree.width = tree.height;
		
		index = getTileIndex(treeX, treeY);
		if (mapData[index] == 1){
			map.trees.push( tree )
		}
		
		ballActive = false;
		betweenTurnTimer = -1;
		results_screen = false;
	}
	
	for (i = 0; i < players.length; i++){
		initPlayer( players[i] );
	}
	
	currentMap++;
	
	results_names = [];
	results[currentMap] = [];
	
	io.emit("courseStart", players, map);
}

onMapLoad("map");
onCourseStart();

var onTurnFinish = function() {

	if (!players[currentPlayer].done){
		players[currentPlayer].shot++;// incrementing the old players shot first, if not the final shot
	}
	
	var thisBall = players[currentPlayer].ball; //tile handler when ball lands
	index = getTileIndex(thisBall.x, thisBall.y);
	switch (mapData[index]){
		case 1:
			status = 0; // out of bounds
			break;
			
		case 19:
			status = 1; // rough
			break;
		
		case 21:
		case 23:
			status = 2; // fairway
			break;
		
		case 26: // all these different green tiles (this isn't even all of them) will probably be scrapped
		case 27:
		case 28:
		case 42:
		case 43:
			status = 3; // green
			break;
			
		case 25:
			status = 4; // hole
			break;
			
		default:
			status = 5; // misc
	}
	
	io.emit("playerUpdate", players[currentPlayer], currentPlayer);
	io.emit("turnFinish", currentPlayer, status);
	
	ballActive = false;
	betweenTurnTimer = BETWEEN_TURN_TIME;
}

var onTurnStart = function() {
	next = nextAvailablePlayer();

	if (next != -1){
		currentPlayer = next;
		console.log(players[currentPlayer].name + "'s turn! (ID: " + players[currentPlayer].id + ")");
		
		var thisBall = players[currentPlayer].ball
		thisBall.dir = Math.atan2(holeY + 4 - thisBall.y, holeX + 4 - thisBall.x);
		io.emit("playerUpdate", players[currentPlayer], currentPlayer);
		io.emit("turnStart", currentPlayer);
	
	} else {
		if (players.length == 0){ 
			// unique handling for empty server? naaaa.... just waiting for someone to join
		}else{
			onCourseEnd();
		}
	}
	ballActive = false;
	betweenTurnTimer = -1;
}

var onCourseEnd = function() {
	console.log("\nAll players have finished the course!");
	console.log("Here are the scores:");
	
	for (i = 0; i < players.length; i++){
		console.log( players[i].name + ": " + players[i].shot);
	}
	console.log("");
	
	io.emit("courseFinish", results, currentMap, results_names);
	results_screen = true;
}

var update = function () {
	if (players[currentPlayer]){
		ball = players[currentPlayer].ball;
		ball.x += ( ball.velocity * Math.cos(ball.dir) )
		ball.y += ( ball.velocity * Math.sin(ball.dir) )
		ball.altitude += (ball.altvel * 0.5);
	
		ball.velocity /= 1.1; //friction
		
		if (ball.altitude <= 0){ // ball can't go under map, and will bounce off the surface of the map
			ball.altitude = 0;
			ball.altvel = -0.5 * ball.altvel;
		}else{
			ball.altvel -= 1;
		}
	
		if (ball.velocity < 0.001){ // velocity cutoffs
			ball.velocity = 0;
		}
		if (ball.altvel < 0.1 && ball.altitude <= 0.01){
			ball.altvel = 0;
			ball.altitude = 0;
		} else {
			
		}
		
		if (!ballActive){ // when the ball is at a standstill, the player entity moves around it to aim
			x_add = 8 * Math.cos(ball.dir + Math.PI / 1.2);
			y_add = 8 * Math.sin(ball.dir + Math.PI / 1.2);
			players[currentPlayer].x = ball.x + x_add;
			players[currentPlayer].y = ball.y + y_add;
		}
	
		if (ballActive && ball.velocity < 1 && ball.altitude < 0.1) {
			index = getTileIndex(ball.x, ball.y);
			
			if (mapData[index] == 25){ // hole 
			
				players[currentPlayer].done = true;
				console.log(players[currentPlayer].name + " is done!");
				ball.velocity = 0;
				results[currentMap][currentPlayer] = players[currentPlayer].shot;
				results_names[currentPlayer] = players[currentPlayer].name;
			}
		}
		io.emit("playerUpdate", players[currentPlayer], currentPlayer);
		
		if (ball.velocity == 0){ // shot is considered finished when the ball has 0 velocity
			if (ballActive){
				ball.altvel = 0;
				ball.altitude = 0;
				onTurnFinish();
			}
		}
		
		if (betweenTurnTimer > 0){
			betweenTurnTimer--;
			//console.log(betweenTurnTimer);
		}else if (betweenTurnTimer == 0){
			onTurnStart();
		}
	}

}

setInterval(()=> {update()}, 50);

io.on('connection', function (socket) {

	socket.on("ballHit", function (playerID, ball, powerMeter) {
	
		if (!ballActive && playerID == currentPlayer){
			currentClub = players[playerID].club;
			ball.velocity = clubs.clubs[currentClub].vel * powerMeter;
			ball.altvel = clubs.clubs[currentClub].lift * powerMeter;
			
			players[playerID].ball = ball;
			io.emit("ballUpdate", playerID, ball);
			ballActive = true;
			io.emit("ballHit");
		}

	});

	socket.on("playerJoinRequest", function (playerJoining) {
		
		initPlayer(playerJoining);
		playerJoining.id = players.length;
		players.push(playerJoining);
		
		io.emit("playerJoin", playerJoining, players, map, clubs.clubs, currentPlayer);
		io.emit("playerUpdate", playerJoining, playerJoining.id);
		
		console.log(playerJoining.name + " has joined the server (ID: " + playerJoining.id + ")" )
		
		if (results_screen){
			io.emit("courseFinish", results, currentMap, results_names);
		}else{

		}
	});
	
	socket.on("playerUpdateRequest", function (playerUpdating, playerID) {
		players[playerID] = playerUpdating;
		io.emit("playerUpdate", playerUpdating, playerID);
	});
	
	socket.on("ballUpdateRequest", function (playerID, ball) {
		// todo
	});
	
	socket.on("disconnect", function () {

		playerLeaving = getPlayerFromSocket(socket)
		 
		if (playerLeaving != -1){
			console.log( playerLeaving.name + " has left the server (ID: " + playerLeaving.id + ")")
			players.splice(playerLeaving.id, 1)
			for (i = playerLeaving.id; i < players.length; i++){
				players[i].id--;
			}
			io.emit("playerLeave", playerLeaving.id, players)
			
			if (playerLeaving.id == currentPlayer && !results_screen){
				onTurnStart();
			}
		}
		
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

var initPlayer = function(p){
	p.ball.x = startX + (Math.random() * 32) // initialize player serverside
	p.ball.y = startY + (Math.random() * 32)
	p.ball.dir = Math.atan2(holeY + 4 - p.ball.y, holeX + 4 - p.ball.x);
	p.ball.velocity = 0;
		
	p.x = startX; 
	p.y = startY;
		
	p.done = false;
	p.shot = 1;
	p.club = 0;
}

