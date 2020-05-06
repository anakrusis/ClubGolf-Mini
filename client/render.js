var render = function () {

	ctx.clearRect(0,0,canvas.width,canvas.height)
	ctx.fillStyle = "#94D1D1"; // one blank color for the canvas
	ctx.fillRect(0,0,canvas.width,canvas.height);
	
	mapCtx.clearRect(0,0,mapCanvas.width,mapCanvas.height)
	mapCtx.fillStyle = "#94D1D1"; // one blank color for the canvas
	mapCtx.fillRect(0,0,mapCanvas.width,mapCanvas.height);
	
	mapCtx.translate(320, 320);
	mapCtx.rotate(cam_dir);
	
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

	ctx.drawImage(mapCanvas,0,0);
	
	mapCtx.rotate(-cam_dir);
	mapCtx.translate(-320, -320);
	
	for (var i = 0; i < players.length; i++){ // players render
		tx = tra_x(players[i].x) - 320;
		ty = tra_y(players[i].y) - 320;
		rx = rot_x(cam_dir, tx, ty) + 320;
		ry = rot_y(cam_dir, tx, ty) + 320;
		
		ctx.drawImage(texture_PLAYER, rx, ry, 8*cam_zoom, 8*cam_zoom)
		
		if (i == playerID){
			var seqond = new Date().getTime();
			ctx.fillStyle = "rgb(" + seqond%255 + ", " + seqond%255 + ", "+ seqond%255 + ")";
		}else{
			ctx.fillStyle = "#000000"
		}
		
		ctx.fillText(players[i].name, rx , ry);
	}
	
	ctx.font = "30px Arial Narrow";
	ctx.fillStyle = "#000000";
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