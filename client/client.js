function SETTINGS() {}

SETTINGS.prototype.init = function() {
	this.optsDefault = {
		playerName: "hello",
		connectionString: "http://localhost:23456"
	}

	this.localStorageKey = "gameSettings";
	this.settingsFormSelector = "#form";
	this.frm = document.querySelector(this.settingsFormSelector);
	
	this.formOnSubmit = this.formOnSubmit.bind(this);
	this.frm.addEventListener('submit', this.formOnSubmit, false);
	
	this.load();
}

SETTINGS.prototype.formOnSubmit = function(e) {
	e.preventDefault();
	
	this.opts = {
		playerName: this.frm.querySelector(".setting[name='playerName']").value,
		connectionString: this.frm.querySelector(".setting[name='connectionString']").value
	}

	this.save();
	server_connect();
}

SETTINGS.prototype.get = function() {
	return this.opts;
}

SETTINGS.prototype.save = function() {
	localStorage.setItem(this.localStorageKey, JSON.stringify(this.opts));
}

SETTINGS.prototype.load = function() {
	
	if (opts = JSON.parse(localStorage.getItem(this.localStorageKey))) {	
	} else {
		opts = this.optsDefault;
	}
	
	for (var i in opts) {
		this.frm.querySelector(".setting[name='"+i+"']").value = opts[i];
	}
	
	this.opts = opts;
}

var settings;
document.addEventListener('DOMContentLoaded', function(e) {
	settings = new SETTINGS();
	settings.init();
});

var socket;

// Main canvas for rendering
var canvas = document.getElementById("Canvas");
//canvas.tabindex = 0;
//canvas.setAttribute('style', "padding-left: 0;padding-right: 0;margin-left: auto;margin-right: auto;display: block;width: 425;");
var ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

var mapCanvas = document.getElementById("MapCanvas");
var mapCtx = mapCanvas.getContext("2d");
mapCtx.imageSmoothingEnabled = false;

var tileset = new Image(); tileset.src = "tileset.png";
var texture_PLAYER = new Image(); texture_PLAYER.src = "player.png";
var texture_TREE = new Image(); texture_TREE.src = "tree.png";

var textures = [texture_PLAYER, texture_TREE];

var keysDown = {};
var delta = 0;
var map;

var connectTimer = 0;

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
		this.texture = 0;
		this.height = 8;
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

function server_connect(name, connectionString) {
	
	var player = new Player() // player is just a temp variable, the properly synced one is players[playerID]
	var name = settings.opts.playerName;
	player.name = name;
	players = []
	
	if (socket){
		socket.disconnect();
	}
	socket = io.connect(settings.opts.connectionString);

	socket.on("playerJoin", function(playerJoining, serverPlayerList, serverMap){
		console.log(playerJoining.name + " has joined the server")
		players = serverPlayerList
		
		if (playerID == -1) {  // Handler for uninitialized player (client-side)
			playerID = playerJoining.id
			cam_x = playerJoining.x
			cam_y = playerJoining.y
		}
		
		if (!map){ // If the player does not yet have the map, then here it is
			map = serverMap
		}
	});
	
	socket.on("playerLeave", function(playerLeaving, serverPlayerList){
	
		if (playerLeaving < playerID) {
			playerID--;
		}
		if (playerLeaving == playerID) {
			socket.disconnect();
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
		
		socket.on("disconnect", function(){
			
		});
	});
}

var update = function (modifier) {
	//cameraX = players
	
	if (87 in keysDown) { // up
		cam_y += 4 * Math.sin(cam_dir - Math.PI / 2);
		cam_x -= 4 * Math.cos(cam_dir - Math.PI / 2);
	}
	if (83 in keysDown) { // down
		//cam_y += 4;
		cam_y -= 4 * Math.sin(cam_dir - Math.PI / 2);
		cam_x += 4 * Math.cos(cam_dir - Math.PI / 2);
	}
	if (65 in keysDown) { // left 
		//cam_x-=4;
		cam_y -= 4 * Math.sin(cam_dir - Math.PI);
		cam_x += 4 * Math.cos(cam_dir - Math.PI);
	}
	if (68 in keysDown) { // right
		//cam_x+=4;
		cam_y += 4 * Math.sin(cam_dir - Math.PI);
		cam_x -= 4 * Math.cos(cam_dir - Math.PI);
	}
	
	if (100 in keysDown) { // numpad 4 
		cam_dir-=0.1;
	}
	if (102 in keysDown) { // numpad 6
		cam_dir+=0.1;
	}
	if (104 in keysDown){ // numpad 8
		cam_zoom+=0.1
	}
	if (98 in keysDown){ // numpad 2
		cam_zoom-=0.1
	}
	//cam_dir = Math.round(cam_dir * 10)/10
	
	//cam_zoom += (0.01 * delta)
	cam_zoom = Math.max(1, cam_zoom)
	delta = 0
	
	if (socket){
		if (!socket.connected){
			connectTimer++;
			
			if (connectTimer > 256){
				connectTimer = 0;
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