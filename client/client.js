var socket;

// Main canvas for rendering
var canvas = document.getElementById("Canvas");
canvas.tabindex = 0;
canvas.setAttribute('style', "padding-left: 0;padding-right: 0;margin-left: auto;margin-right: auto;display: block;width: 425;");
var ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

var mapCanvas = document.getElementById("MapCanvas");
var mapCtx = mapCanvas.getContext("2d");

var tileset = new Image();
tileset.src = "tileset.png";
var texture_PLAYER = new Image();
texture_PLAYER.src = "player.png";

var keysDown = {};
var delta = 0;
var map;

class Ball {
	constructor(){
		this.x = 0;
		this.y = 0;
		this.height = 0;
	}
}

class Player {
	constructor(){
		this.name = "Player";
		this.x = 0;
		this.y = 0;
		this.id = 0;
		this.ball = new Ball();
	}
}
players = [];
playerID = -1

cam_zoom = 2

addEventListener("keydown", function (e) { // when a key is pressed
	keysDown[e.keyCode] = true;
}, false);

addEventListener("keyup", function (e) { // when a key is unpressed
	delete keysDown[e.keyCode];
}, false);

addEventListener("mousewheel", function (e){
	delta = e.wheelDelta;
}, false);

function server_connect(){

	var player = new Player() // player is just a temp variable, the properly synced one is players[playerID]
	var name = document.getElementById("name").value;
	player.name = name;
	players = []
	
	if (socket){
		socket.disconnect();
	}
	socket = io.connect("http://localhost:23456");

	socket.on("playerJoin", function(playerJoining, serverPlayerList, serverMap){
		console.log(playerJoining.name + " has joined the server")
		players = serverPlayerList
		
		if (playerID == -1) {  // Handler for uninitialized player (client-side)
			playerID = playerJoining.id
			cam_x = playerJoining.x
			cam_y = playerJoining.y
		}
		
		map = serverMap
	});
	
	socket.on("playerLeave", function(playerLeaving, serverPlayerList){
	
		if (playerLeaving < playerID) {
			playerID--;
		}
		console.log(players[playerLeaving].name + " has left the server")
		players = serverPlayerList
	});
	
	socket.on("playerMove", function(playerMovingID, x, y){
		players[playerMovingID].x = x
		players[playerMovingID].y = y
	});
	
	socket.on("connect", function(){
		var form = document.getElementById("form"); // text box for joining server goes away once you join
		form.remove();
		
		player.socket = socket.id
		socket.emit("playerJoinRequest", player)
		
	});
}

var update = function (modifier) {
	//cameraX = players
	
	if (87 in keysDown) { // up
		cam_y-=4;
	}
	if (83 in keysDown) { // down
		cam_y+=4;
	}
	if (65 in keysDown) { // left 
		cam_x-=4;
	}
	if (68 in keysDown) { // right
		cam_x+=4;
	}
	if (100 in keysDown) { // numpad 4 
		cam_dir-=0.1;
	}
	if (102 in keysDown) { // numpad 6
		cam_dir+=0.1;
	}
	
	//cam_zoom += (0.01 * delta)
	//cam_zoom = Math.max(1, cam_zoom)
	delta = 0
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