function CLIENT() {
	this.player;
	this.players = [];
	this.playerID = -1;
	
	this.onKeyDown = this.onKeyDown.bind(this);
	this.onKeyUp = this.onKeyUp.bind(this);
	this.onMouseWheel = this.onMouseWheel.bind(this);
	
	this.onPlayerMove = this.onPlayerMove.bind(this);
}

var ctx, canvas, map, mapCtx, mapCanvas, textures, tileset, texture_PLAYER, texture_TREE;

CLIENT.prototype.keysDown = {};
CLIENT.prototype.delta = 0;
CLIENT.prototype.player;

CLIENT.prototype.onKeyDown = function(e) {
	this.keysDown[e.keyCode] = true;
}

CLIENT.prototype.onKeyUp = function(e) {
	delete this.keysDown[e.keyCode];
}

CLIENT.prototype.onMouseWheel = function(e) {
	this.delta = e.wheelDelta;
}

CLIENT.prototype.addPlayer = function(socketId) {
	
	this.player = new Player() // player is just a temp variable, the properly synced one is players[playerID]
	this.player.name = settings.opts.playerName;
	this.player.socket = socket.id;
	var form = document.querySelector("form"); // text box for joining server goes away once you join
	form.remove();
	
	return this.player;
}

CLIENT.prototype.onPlayerMove = function(playerMovingID, x, y) {
	this.players[playerMovingID].x = x;
	this.players[playerMovingID].y = y;
}

CLIENT.prototype.start = function() {
	// Main canvas for rendering
	canvas = document.querySelector("#Canvas");
	//canvas.tabindex = 0;
	//canvas.setAttribute('style', "padding-left: 0;padding-right: 0;margin-left: auto;margin-right: auto;display: block;width: 425;");
	ctx = canvas.getContext("2d");
	ctx.imageSmoothingEnabled = false;

	mapCanvas = document.getElementById("MapCanvas");
	mapCtx = mapCanvas.getContext("2d");
	mapCtx.imageSmoothingEnabled = false;

	tileset = new Image(); tileset.src = "tileset.png";
	texture_PLAYER = new Image(); texture_PLAYER.src = "player.png";
	texture_TREE = new Image(); texture_TREE.src = "tree.png";
	texture_BALL = new Image(); texture_BALL.src = "ball.png";
	textures = [texture_PLAYER, texture_TREE, texture_BALL];

	this.delta = 0;
	this.connectTimer = 0;

	cam_zoom = 2
	cam_unlock = false // can the camera move freely yes or no

	addEventListener("keydown", this.onKeyDown, false);
	addEventListener("keyup", this.onKeyUp, false);
	addEventListener("mousewheel", this.onMouseWheel, false);

	var keysDown = this.keysDown;
	var update = function (modifier) {
		//cameraX = players
		
		if (87 in keysDown) { // up
			if (cam_unlock){
				cam_y += 4 * Math.sin(cam_dir - Math.PI / 2);
				cam_x -= 4 * Math.cos(cam_dir - Math.PI / 2);
			}

		}
		if (83 in keysDown) { // down
			if (cam_unlock){
				cam_y -= 4 * Math.sin(cam_dir - Math.PI / 2);
				cam_x += 4 * Math.cos(cam_dir - Math.PI / 2);
			}
		}
		if (65 in keysDown) { // left 
			if (cam_unlock){
				cam_y -= 4 * Math.sin(cam_dir - Math.PI);
				cam_x += 4 * Math.cos(cam_dir - Math.PI);
			} else {
			
				player = client.players[client.playerID];
				player.ball.dir -= Math.PI / 64;
				socket.socket.emit("ballUpdateRequest", client.playerID, client.players[client.playerID].ball);
			}
		}
		if (68 in keysDown) { // right
			if (cam_unlock){
				cam_y += 4 * Math.sin(cam_dir - Math.PI);
				cam_x -= 4 * Math.cos(cam_dir - Math.PI);
			} else {
				this.players[this.playerID].ball.dir += Math.PI / 64;
				socket.emit("ballUpdateRequest", this.playerID, this.players[this.playerID].ball);
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
		//cam_dir = Math.round(cam_dir * 10)/10
		
		//cam_zoom += (0.01 * delta)
		cam_zoom = Math.max(1, cam_zoom)
		
		if (this.players){
			cam_dir = this.players[this.playerID].ball.dir;
		}
		
		delta = 0
		
		if (socket.socket){
			if (!socket.socket.connected){
				this.connectTimer++;
				
				if (this.connectTimer > 256){
					this.connectTimer = 0;
					socket.socket.disconnect();
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