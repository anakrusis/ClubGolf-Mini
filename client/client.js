var canvas = document.getElementById("Canvas");
canvas.tabindex = 0;
canvas.setAttribute('style', "padding-left: 0;padding-right: 0;margin-left: auto;margin-right: auto;display: block;width: 425;");

var ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

var tileset = new Image();
tileset.src = "tileset.png";
var texture_PLAYER = new Image();
texture_PLAYER.src = "player.png";

var keysDown = {};
var delta = 0;
var map;

class Player {
	constructor(){
		this.name = "Player";
		this.x = 0;
		this.y = 0;
		this.id = 0;
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
	
	socket = io.connect("http://localhost:23456");
	
	var form = document.getElementById("form"); // text box for joining server goes away once you join
	form.remove();
	
	socket.on("playerJoin", function(playerJoining, serverPlayerList, serverMap){
		console.log(playerJoining.name + " has joined the server")
		players = serverPlayerList
		
		if (playerID == -1) {  // Handler for uninitialized player (client-side)
			playerID = players.length - 1
			cam_x = playerJoining.x
			cam_y = playerJoining.y
		}
		
		map = serverMap
	});
	
	socket.on("playerMove", function(playerMovingID, x, y){
		players[playerMovingID].x = x
		players[playerMovingID].y = y
	});
	
	socket.emit("playerJoin", player)
}

var update = function (modifier) {
	//cameraX = players
	
	if (87 in keysDown) { // up
		cam_y-=5;
	}
	if (83 in keysDown) { // down
		cam_y+=5;
	}
	if (65 in keysDown) { // left 
		cam_x-=5;
	}
	if (68 in keysDown) { // right
		cam_x+=5;
	}
	
	cam_zoom += (0.001 * delta)
	delta = 0
}

var render = function () {

	ctx.clearRect(0,0,canvas.width,canvas.height)
	ctx.fillStyle = "#94D1D1"; // one blank color for the canvas
	ctx.fillRect(0,0,canvas.width,canvas.height);
	
	if (map) { // map render (top-down for now, mode7 later)
		data = map.layers[0].data
		
		for (var i = 0; i < data.length; i++){
			tileVal = data[i] - 1
		
			sourcex = (tileVal % 16) * 8;
			sourcey = Math.floor(tileVal / 16) * 8;
			
			destx = tra_x((i % map.width) * 8);
			desty = tra_y(Math.floor(i / map.width) * 8);
			
			ctx.drawImage(tileset,sourcex,sourcey,8,8,destx,desty,8*cam_zoom,8*cam_zoom)
		}	
		
	}
	for (var i = 0; i < players.length; i++){ // players render
		ctx.drawImage(texture_PLAYER, tra_x(players[i].x), tra_y(players[i].y),8*cam_zoom, 8*cam_zoom)
	}
	
	ctx.font = "30px Arial Narrow";
	ctx.fillStyle = "#000000";
	ctx.fillText("You Hit The Ball Into The Hole",10,32); // title and player list
	ctx.fillText("Players: ",10,64);
	for (var i = 0; i < players.length; i++){
		ctx.fillText(players[i].name,10,96 + (i*32) );
	}
	
};
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