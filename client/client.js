socket = io.connect("http://localhost:23456")

var canvas = document.getElementById("Canvas");
var ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

var tileset = new Image();
tileset.src = "tileset.png";

var keysDown = {};
var delta = 0;

class Player {
	constructor(){
		this.name = "Player";
	}
}
player = new Player();

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

	var name = document.getElementById("name").value;
	player.name = name;
	
	socket.disconnect()
	socket = io.connect("http://localhost:23456");
	
	socket.on("playerJoin", function(player){
		console.log(player.name + " has joined the server")
	});
	
	socket.emit("playerJoin", player)
}

var update = function (modifier) {

}

var render = function () {
	ctx.clearRect(0,0,canvas.width,canvas.height)
	ctx.fillStyle = "rgb(0, 0, 0)"; // one blank color for the canvas
	ctx.fillRect(0,0,canvas.width,canvas.height);
	
	ctx.fillStyle = "rgb(255,255,255)";
	ctx.drawImage(tileset,0,0)
	
	ctx.font = "30px Arial Narrow";
	ctx.fillStyle = "rgb(0, 255, 255)";
	ctx.fillText("Golf",10,32);
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