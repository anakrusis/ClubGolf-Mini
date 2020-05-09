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

var settings;
var client;
var socket;

document.addEventListener('DOMContentLoaded', function(e) {
	settings = new SETTINGS();
	socket = new SOCKET();
	client = new CLIENT();
	
	settings.init();
	client.start();
});