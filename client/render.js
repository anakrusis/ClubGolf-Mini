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

	for (var i = 0; i < players.length; i++){ // players pre-render (gathering positions)
		tx = tra_x(players[i].x) - 320; // translated x/y
		ty = tra_y(players[i].y) - 320;
		rx = rot_x(cam_dir, tx, ty) + 320; // rotated x/y
		ry = rot_y(cam_dir, tx, ty) + 320;
		mapCtx.drawImage(texture_PLAYER, rx, ry, 8*cam_zoom, 8*cam_zoom)
	}
	
	var flat_factor = 16
	var horizon_scanline = 128

	for (i = 0; i < 640 * flat_factor; i+=flat_factor){
	
		scale = 1 + (i/640)
		ctx.drawImage(mapCanvas, 0, i / scale, // source x y
		
		640, 1, // source width height 
		
		320 - (320 * scale) , horizon_scanline + i / flat_factor, // destination x y

		640 * scale, 1); // destination width height

	//	ctx.drawImage(mapCanvas, 0, i, 640, 1, 0, i, 640, 1); // top down plain scanline render
	}
	

	for (var i = 0; i < playerXs.length; i++){
	
		//
		//scale = 1 + (ry / 640)// scaled x/y
		
		//ctx.fillText(scale, 200, 200)
		
		//sy = (ry * scale) + horizon_scanline
		
		//ctx.drawImage(texture_PLAYER, rx, sy, 8*cam_zoom*scale, 8*cam_zoom*scale)
		
		//if (i == playerID){
		//	var seqond = new Date().getTime();
		//	ctx.fillStyle = "rgb(" + seqond%255 + ", " + seqond%255 + ", "+ seqond%255 + ")";
		//}else{
		//	ctx.fillStyle = "#000000"
		//}
		
		//ctx.fillText(players[i].name, rx , sy);
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
			ctx.fillStyle = "#000000"
		}
		ctx.fillText(players[i].name,10,96 + (i*32) );
	}
	
	if (socket){
		if (!socket.connected){
			ctx.fillText("Can't connect to server!", 200, 320)
		}
	}
};