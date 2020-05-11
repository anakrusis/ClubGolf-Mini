class Ball {
	constructor(){
		this.name = "Ball";
		this.x = 0;
		this.y = 0;
		this.altitude = 0;
		this.dir = 0;
		this.velocity = 0;
		
		this.height = 1;
		this.texture = 2;
		this.width = 1;
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
		this.width = 8;
	}
}

var settings;

document.addEventListener('DOMContentLoaded', function(e) {
	settings = new SETTINGS();
	
	settings.init();
	startClient();
});