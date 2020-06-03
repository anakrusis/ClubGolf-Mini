var config = require('./config.js');

var io = require('socket.io')(config.port);
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt:""
});

const TILE_OUT_OF_BOUNDS = 1;
const TILE_ROUGH         = 2;
const TILE_FAIRWAY       = 3;
const TILE_GREEN         = 4;
const TILE_HOLE          = 5;
const TILE_TEE           = 6;
const TILE_BUNKER        = 7;
const TILE_WATER         = 8;

var clubs = require('./clubs.json');

var currentMap = -1;

console.log("Starting server...\n") // init server

var players = {};
var playerOrder = [];
var currentPlayer = 0;

var ballActive = false;
var ballReturn = false; // flagged true when out of bounds or in water
var betweenTurnTimer = -1;
var betweenCourseTimer = -1;
var ballInitialX = 0;
var ballInitialY = 0;

const BETWEEN_TURN_TIME = 56;
const BETWEEN_COURSE_TIME = 600;

var results_screen = false;
var results = {};
var results_names = {}; // results_names stores all the names of people who have completed a course,
						// regardless of whether or not they're in the server ATM

var getTileIndex = function(x, y){
	x = Math.floor(x / 8); y = Math.floor(y / 8);
	return ((y) * map.width ) + (x);
}

var nextAvailablePlayer = function(){

	var allwent = true; // The first loop determines if all players have gone so far
	for (index in players){ 
		if (!players[index].went){
			allwent = false;
			break;
		}
	}
	if (allwent){ // If all players have gone so far, then they are all going to be set back to false
		for (index in players){
			players[index].went = false;
		}
	}

	for (index in players) { // Now we find the next player who hasn't gone yet
		player = players[index];
		//if (player.id != undefined){
			if (!player.done && !player.went){
				console.log(player.id);
				player.went = true;
				return player.id;
			}
		//}
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

rl.on('line', (line) => { // Command line parsing!
	firstArg = line.trim().split(' ')[0]
	switch (firstArg) {
		
		case "/list":
			for (index in players){
				console.log ( players[index].name + " (ID: " + players[index].id + ")" )
			}
			if (Object.keys(players).length == 0){
				console.log("No players online!")
			}
			console.log("");
			break;
		case "/restart":
			onCourseStart();
			break;
		case "/stop":
			console.log("Stopping server...");
			process.exit(0);
			break;
		case "/load":
			pathString = line.trim().substring(6);
			onMapLoad( pathString );
			break;
		case "/kick":
			arg = line.trim().substring(6);
			if (parseInt(arg, 10) != NaN){
				id = parseInt(arg, 10);
				if ( players[id] ){
					io.emit("playerKick", id);
				
				}else{
					console.log("Invalid player ID!\n");
				}
			}else{
				console.log("Invalid player ID: not an integer!\n");
			}
			break;
		case "/next":
			onTurnStart();
			break;
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

var onTurnFinish = function() {

	if (!players[currentPlayer].done){
		players[currentPlayer].shot++;// incrementing the old players shot first, if not the final shot
	}
	
	var thisBall = players[currentPlayer].ball; //tile handler when ball lands
	index = getTileIndex(thisBall.x, thisBall.y);
	switch (mapData[index]){
		case TILE_OUT_OF_BOUNDS:
			status = 0; // out of bounds
			ballReturn = true;
			break;
			
		case TILE_ROUGH:
			status = 1; // rough
			break;
		
		case TILE_FAIRWAY:
		case TILE_TEE:
			status = 2; // fairway
			break;
		
		case TILE_GREEN:
			status = 3; // green
			break;
			
		case TILE_HOLE:
			status = 4; // hole
			break;
		case TILE_BUNKER:
			status = 5;
			break;
		case TILE_WATER:
			status = 6;
			ballReturn = true;
			break;
		default:
			status = -1; // misc
			ballReturn = true;
			break;
	}
	// If your ball somehow manages to escape the map (i.e. small map)
	if (thisBall.x >= map.width * 8 || thisBall.y >= map.height * 8 || thisBall.x < 0 || thisBall.y < 0){
		status = 0;
		ballReturn = true;
	}
	
	io.emit("playerUpdate", players[currentPlayer], currentPlayer);
	io.emit("turnFinish", currentPlayer, status);
	
	ballActive = false;
	betweenTurnTimer = BETWEEN_TURN_TIME;
}

var onCourseEnd = function() {
	console.log("\nAll players have finished the course!");
	console.log("Here are the scores:");
	
	for (i in results){
		console.log( results_names[i] + ": " + results[i][currentMap]);
	}
	console.log("");
	
	io.emit("courseFinish", results, currentMap, results_names);
	results_screen = true;
}

var onTurnStart = function() {

	if (ballReturn && players[currentPlayer]){ // action on ball lost, 1 stroke penalty and move back to old spot
		players[currentPlayer].ball.x = ballInitialX; players[currentPlayer].ball.y = ballInitialY;
		players[currentPlayer].shot++;
		io.emit("playerUpdate", players[currentPlayer], currentPlayer);
		ballReturn = false;
	}
	
	next = nextAvailablePlayer();

	if (next != -1){
		currentPlayer = next;
		console.log(players[currentPlayer].name + "'s turn! (ID: " + players[currentPlayer].id + ")");
		
		var thisBall = players[currentPlayer].ball
		thisBall.dir = Math.atan2(holeY + 4 - thisBall.y, holeX + 4 - thisBall.x);
		io.emit("playerUpdate", players[currentPlayer], currentPlayer);
		io.emit("turnStart", currentPlayer);
	
	} else {
		if (Object.keys(players).length == 0){ 
			// unique handling for empty server? naaaa.... just waiting for someone to join
		}else{
			onCourseEnd();
		}
	}
	ballActive = false;
	betweenTurnTimer = -1;
}

var onCourseStart = function() {
	map = mapLoaded;
	mapData = map.layers[0].data
	currentMap++;
	
	console.log("Current map: " + currentMap);
	// getting positions of stuff that your only supposed to have 1 per map (if you have 0 it will BE BAD)
	startTile = mapData.findIndex( function(element, index, array){ return element == TILE_TEE });
	startX = (startTile % map.width) * 8;
	startY = Math.floor(startTile / map.width) * 8;
	console.log("Start pos.: " + startX + "," + startY);
	holeTile = mapData.findIndex( function(element, index, array){ return element == TILE_HOLE });
	holeX = (holeTile % map.width) * 8;
	holeY = Math.floor(holeTile / map.width) * 8;
	console.log("Hole pos.: " + holeX + "," + holeY + "\n");
	
	ballActive = false;
	ballReturn = false;
	betweenTurnTimer = -1;
	
	map.trees = [];
	
	var flag = new Tree(holeX + 4, holeY + 4);
	flag.collide = false; flag.texture = 3;
	flag.width = 4; flag.height = 8;
	map.trees.push( flag );

	for (i = 0; i < config.max_trees; i++){ // Randomly spawns trees on out of bounds or rough
		treeX = Math.round ( Math.random() * map.width  * 8 );
		treeY = Math.round ( Math.random() * map.height * 8 );
		tree = new Tree (treeX, treeY) ;
		tree.height = Math.random() * 20 + 12;
		tree.width = tree.height;
		
		index = getTileIndex(treeX, treeY);
		if (mapData[index] == TILE_OUT_OF_BOUNDS || mapData[index] == TILE_ROUGH){
			map.trees.push( tree )
		}
	}
	
	for (i in players){
		initPlayer( players[i] );
	}
	
	results_screen = false;
	
	io.emit("courseStart", players, map);
	onTurnStart();
}

onMapLoad("map");
onCourseStart();

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
	
		if (ballActive && ball.altitude < 0.1) {
			index = getTileIndex(ball.x, ball.y);
			
			if (mapData[index] == TILE_HOLE){ // hole 
			
				if ( ball.velocity < 1 ){ // this allows the ball to skim over the hole if going too fast
				
					players[currentPlayer].done = true;
					console.log(players[currentPlayer].name + " is done!");
					ball.velocity = 0;
					
					if (results[currentPlayer] === undefined){
						results[currentPlayer] = [];
					}
					
					results[currentPlayer][currentMap] = players[currentPlayer].shot;
					results_names[currentPlayer] = players[currentPlayer].name;
				}
			} else if (mapData[index] == TILE_BUNKER){
				ball.velocity = 0;
				
			} else if (mapData[index] == TILE_WATER){
				ball.velocity = 0;
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
	
		ballInitialX = ball.x; ballInitialY = ball.y;
		
		index = getTileIndex(ball.x, ball.y); // Handling for bunker on initial shot: shot strength 1/10th
		if (mapData[index] == TILE_BUNKER){
			powerMeter *= 0.5;
		}
		
		if (!ballActive && playerID == currentPlayer){
			currentClub = players[playerID].club;
			ball.velocity = clubs.clubs[currentClub].vel * powerMeter;
			ball.altvel = clubs.clubs[currentClub].lift * powerMeter;
			
			players[playerID].ball = ball;
			io.emit("ballUpdate", playerID, ball);
			ballActive = true;
			io.emit("ballHit", powerMeter);
		}

	});

	socket.on("playerJoinRequest", function (playerJoining) {
		
		initPlayer(playerJoining);
		playerJoining.id = newID();
		players[playerJoining.id] = playerJoining;
		
		io.emit("playerJoin", playerJoining, players, map, clubs.clubs, currentPlayer);
		io.emit("playerUpdate", playerJoining, playerJoining.id);
		
		console.log(playerJoining.name + " has joined the server (ID: " + playerJoining.id + ")" )
		
		if (results_screen){
			io.emit("courseFinish", results, currentMap, results_names);
		}else{
			if (Object.keys(players).length == 1){
				onTurnStart();
			}
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

		playerLeaving = getPlayerFromSocket(socket);
		 
		if (playerLeaving != -1){
			onPlayerLeave(playerLeaving);
		}
		
	});
});

var getPlayerFromSocket = function(socket_in){
	for (i in players){
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
	p.went = false;
	p.shot = 1;
	p.club = 0;
}

var onPlayerLeave = function(p){
	var ind = p.id;
	console.log( p.name + " has left the server (ID: " + ind + ")")
	delete players[p.id];
	
	io.emit("playerLeave", ind, players);
			
	if (ind == currentPlayer && !results_screen){
		onTurnStart();
	}
}

var newID = function(){
	return Math.round(Math.random() * 100000);
}

