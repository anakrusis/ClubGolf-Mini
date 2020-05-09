var renderEntity = function (entity, x_offset, y_offset) {
	
}

var render = function () {

	// canvas clear and initial translation
	ctx.clearRect(0,0,canvas.width,canvas.height)
	ctx.fillStyle = "#220022";
	ctx.fillRect(0,0,canvas.width,canvas.height);
	
	mapCtx.clearRect(0,0,mapCanvas.width,mapCanvas.height)
	mapCtx.fillStyle = "#006600";
	mapCtx.fillRect(0,0,mapCanvas.width,mapCanvas.height);
	
	mapCtx.translate(320, 320);
	mapCtx.rotate(cam_dir);
	
	// this is used to create a priority queue which is sorted from back to front
	playerXs = [];
	playerYs = [];
	playerScreenYs = [];
	playerIDs = [];
	
	if (map) { // map render (top-down for now, mode7 later)
		data = map.layers[0].data
		
		for (var i = 0; i < data.length; i++){
			tileVal = data[i] - 1
		
			sourcex = (tileVal % 16) * 8;
			sourcey = Math.floor(tileVal / 16) * 8;
			
			destx = tra_x((i % map.width) * 8) - 320;
			desty = tra_y(Math.floor(i / map.width) * 8) - 320;
			
			mapCtx.drawImage(tileset,sourcex,sourcey,8,8,destx,desty,8*cam_zoom,8*cam_zoom)
		}	
		
	}
	mapCtx.setTransform(1, 0, 0, 1, 0, 0);
	
	var flat_factor = 12
	var horizon_scanline = 128

	for (i = 0; i < 640 * flat_factor; i+=flat_factor){
	
		scale = 1 + (i/640)
		sourceY = Math.round(i/scale);
		ctx.drawImage(mapCanvas, 0, sourceY, // source x y
		
		640, 1, // source width height 
		
		320 - (320 * scale) , horizon_scanline + i / flat_factor, // destination x y

		640 * scale, 1); // destination width height

	//	ctx.drawImage(mapCanvas, 0, i, 640, 1, 0, i, 640, 1); // top down plain scanline render
	}
	

	for (var i = 0; i < players.length; i++){
		
		tx = tra_x(players[i].x) - 320; // translated x/y
		ty = tra_y(players[i].y) - 320;
		rx = rot_x(cam_dir, tx, ty) + 320; // rotated x/y
		ry = rot_y(cam_dir, tx, ty) + 320;
		mapCtx.drawImage(texture_PLAYER, rx, ry, 8*cam_zoom, 8*cam_zoom)
	
		line = (640 * ry) / (-ry + 640) // This is the algebraic inverse of the map drawing code
		scale = 1 + (line/640)
		sx = (rx - 320) * scale + 320
		sy = horizon_scanline + line / flat_factor
		
		sy -= 8*cam_zoom*scale
		
		if (sy > horizon_scanline - (8*cam_zoom*scale)){
			ctx.drawImage(texture_PLAYER, sx, sy, 8*cam_zoom*scale, 8*cam_zoom*scale)
		}
		
		if (i == playerID){
			var seqond = new Date().getTime();
			ctx.fillStyle = "rgb(" + seqond%255 + ", " + seqond%255 + ", "+ seqond%255 + ")";
		}else{
			ctx.fillStyle = "#ffffff"
		}
		
		ctx.fillText(players[i].name, sx , sy);
	}
	
	ctx.font = "30px Arial Narrow";
	ctx.fillStyle = "#ffffff";
	ctx.fillText("Rotation: " + cam_dir ,10,32); // title and player list
	ctx.fillText("Players: ",10,64);
	for (var i = 0; i < players.length; i++){
		
		if (i == playerID){
			var seqond = new Date().getTime();
			ctx.fillStyle = "rgb(" + seqond%255 + ", " + seqond%255 + ", "+ seqond%255 + ")";
		}else{
			ctx.fillStyle = "#ffffff"
		}
		ctx.fillText(players[i].name,10,96 + (i*32) );
	}
	
	if (socket){
		if (!socket.connected){
			ctx.fillText("Can't connect to server!", 200, 320)
		}
	}
};