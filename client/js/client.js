var socket;

var canvas;
var ctx;
var mapCanvas;
var mapCtx;
tileset = new Image(); tileset.src = "tileset.png";
texture_PLAYER = new Image(); texture_PLAYER.src = "player.png";
texture_TREE = new Image(); texture_TREE.src = "tree.png";
texture_BALL = new Image(); texture_BALL.src = "ball.png";
textures = [texture_PLAYER, texture_TREE, texture_BALL];

var keysDown = {};
var delta = 0;
var map;
var clubs

var connectTimer = 0;

players = [];
playerID = -1 // Your player ID
var currentPlayer; // The current player who is hitting the ball right now

cam_zoom = 2
cam_unlock = false // can the camera move freely yes or no
ball_unlock = true // can you swing and hit the ball?

function onSongLoaded(player) {
	player.play();
}

var modPlayer = new ScripTracker();
modPlayer.on(ScripTracker.Events.playerReady, onSongLoaded);
//modPlayer.loadModule("http://battleofthebits.org/player/EntryDonload/34188/BotB%252034188%2520intosy.mod");

var startClient = function(){
	// Main canvas for rendering
	canvas = document.querySelector("#Canvas");
	//canvas.tabindex = 0;
	//canvas.setAttribute('style', "padding-left: 0;padding-right: 0;margin-left: auto;margin-right: auto;display: block;width: 425;");
	ctx = canvas.getContext("2d");
	ctx.imageSmoothingEnabled = false;

	mapCanvas = document.getElementById("MapCanvas");
	mapCtx = mapCanvas.getContext("2d");
	mapCtx.imageSmoothingEnabled = false;

	addEventListener("keydown", function (e) { // when a key is pressed
		keysDown[e.keyCode] = true;
	}, false);

	addEventListener("keyup", function (e) { // when a key is unpressed
		delete keysDown[e.keyCode];
	}, false);

	addEventListener("mousewheel", function (e){
		delta = e.wheelDelta;
	}, false);

	var update = function (modifier) {
		//cameraX = players
		
		if (87 in keysDown) { // up
			if (cam_unlock){
				cam_y += 4 * Math.sin(cam_dir - Math.PI / 2);
				cam_x -= 4 * Math.cos(cam_dir - Math.PI / 2);
				
			} else if (ball_unlock && players[playerID]) {
				players[playerID].club = Math.min( players[playerID].club + 1, clubs.length-1);
				socket.emit("playerUpdateRequest", players[playerID], playerID);
				
				keysDown[87] = false;
			}

		}
		if (83 in keysDown) { // down
			if (cam_unlock){
				cam_y -= 4 * Math.sin(cam_dir - Math.PI / 2);
				cam_x += 4 * Math.cos(cam_dir - Math.PI / 2);
				
			} else if (ball_unlock && players[playerID]) {
				players[playerID].club = Math.max( players[playerID].club - 1, 0);
				socket.emit("playerUpdateRequest", players[playerID], playerID);
				
				keysDown[83] = false;
			}
		}
		if (65 in keysDown) { // left 
			if (cam_unlock){
				cam_y -= 4 * Math.sin(cam_dir - Math.PI);
				cam_x += 4 * Math.cos(cam_dir - Math.PI);
				
			}
		}
		if (68 in keysDown) { // right
			if (cam_unlock){
				cam_y += 4 * Math.sin(cam_dir - Math.PI);
				cam_x -= 4 * Math.cos(cam_dir - Math.PI);
				
			}
		}
		if (ball_unlock && players[playerID]){
			if (65 in keysDown || 68 in keysDown){
			
				if (65 in keysDown){
					players[playerID].ball.dir -= Math.PI / 64;
				}
				if (68 in keysDown){
					players[playerID].ball.dir += Math.PI / 64;
				}
			
				x_add = 8 * Math.cos(players[playerID].ball.dir + Math.PI / 1.2);
				y_add = 8 * Math.sin(players[playerID].ball.dir + Math.PI / 1.2);
				players[playerID].x = players[playerID].ball.x + x_add;
				players[playerID].y = players[playerID].ball.y + y_add;
			
				socket.emit("playerUpdateRequest", players[playerID], playerID);
				
				if (65 in keysDown){
					players[playerID].ball.dir += Math.PI / 64;
				}
				if (68 in keysDown){
					players[playerID].ball.dir -= Math.PI / 64;
				}
			}
		}

		
		if (100 in keysDown) { // numpad 4 
			cam_dir -= Math.PI / 32;
		}
		if (102 in keysDown) { // numpad 6
			cam_dir += Math.PI / 32;
		}
		if (104 in keysDown){ // numpad 8
			cam_zoom+=0.1
		}
		if (98 in keysDown){ // numpad 2
			cam_zoom-=0.1
		}
		
		if (32 in keysDown){ // space
			if (ball_unlock && players[playerID] && playerID == currentPlayer){
				socket.emit("ballHit", playerID, players[playerID].ball);
				ball_unlock = false
			}
		}
		//cam_dir = Math.round(cam_dir * 10)/10
		
		cam_zoom += (0.002 * delta)
		cam_zoom = Math.max(1, cam_zoom)
		
		if (players[playerID]){
			cam_dir = players[playerID].ball.dir;
			cam_x = players[playerID].ball.x;
			cam_y = players[playerID].ball.y;
		}
		
		delta = 0
		
		if (socket){
			if (!socket.connected){
				this.connectTimer++;
				
				if (this.connectTimer > 256){
					this.connectTimer = 0;
					socket.disconnect();
				}
			}
		}
	}

	// main loop
	var main = function () {
		var now = Date.now();
		var delta = now - then;
		
		update(delta / 1000);
		render();
		
		then = now;
		requestAnimationFrame(main);
	};
	var w = window;
	requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

	var then = Date.now();
	main();
}

var server_connect = function(){
	
	var player = new Player() // player is just a temp variable, the properly synced one is players[playerID]
	var name = settings.opts.playerName;
	player.name = name;
	players = []
	
	if (socket){
		socket.disconnect();
	}
	socket = io.connect(settings.opts.connectionString);

	socket.on("playerJoin", function(playerJoining, serverPlayerList, serverMap, serverClubs, s_currentPlayer){
		console.log(playerJoining.name + " has joined the server")
		players = serverPlayerList
		
		if (playerID == -1) {  // Handler for uninitialized player (client-side)
			playerID = playerJoining.id
			cam_x = playerJoining.ball.x
			cam_y = playerJoining.ball.y
		}
		
		if (!map){ // If the player does not yet have the map, then here it is
			map = serverMap
			clubs = serverClubs
			currentPlayer = s_currentPlayer;
		}
	});
	
	socket.on("playerLeave", function(playerLeaving, serverPlayerList){
	
		if (playerLeaving < playerID) {
			playerID--;
		}
		if (playerLeaving == playerID) {
			//socket.disconnect();
		}
		console.log(players[playerLeaving].name + " has left the server")
		players = serverPlayerList
	});
	
	socket.on("playerUpdate", function(playerUpdating, playerUpdatingID){
		players[playerUpdatingID] = playerUpdating;
	});
	
	socket.on("connect", function(){
		var form = document.getElementById("form"); // text box for joining server goes away once you join
		form.remove();
		
		player.socket = socket.id
		socket.emit("playerJoinRequest", player)
		
		socket.on("disconnect", function(){
			
		});
	});
	
	socket.on("ballUpdate", function( id, ball ){
		if (players[id]) {
			if (ball.velocity != players[id].ball.velocity){
				players[id].ball = ball
			}	
		}
	});
	
	socket.on("shotFinish", function ( playerCurrent ){
		currentPlayer = playerCurrent;
		if (playerCurrent == playerID){
			ball_unlock = true;
		}
	});
}