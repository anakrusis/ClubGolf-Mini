var flat_factor = 12
var horizon_scanline = 256

var scaledX = function (rx, ry){
	line = (640 * ry) / (-ry + 640) // This is the algebraic inverse of the map drawing code
	scale = 1 + (line/640)
	return (rx - 320) * scale + 320
}

var scaledY = function (rx, ry){
	line = (640 * ry) / (-ry + 640)
	scale = 1 + (line/640)
	return horizon_scanline + line / flat_factor
}

var compareHeightVal = function (entity1, entity2){
	tx1 = tra_x( entity1.x ) - 320; // translated x/y
	ty1 = tra_y( entity1.y ) - 320;
	rx1 = rot_x(cam_dir, tx1, ty1) + 320; // rotated x/y
	ry1 = rot_y(cam_dir, tx1, ty1) + 320;
	sx1 = scaledY(rx1, ry1);
	
	tx2 = tra_x( entity2.x ) - 320;
	ty2 = tra_y( entity2.y ) - 320;
	rx2 = rot_x(cam_dir, tx2, ty2) + 320;
	ry2 = rot_y(cam_dir, tx2, ty2) + 320;
	sx2 = scaledY(rx2, ry2);
	
	return sx1 - sx2;
}

var renderEntity = function (entity, x_offset, y_offset) {

	tx = tra_x( entity.x ) - 320; // translated x/y
	ty = tra_y( entity.y ) - 320;
	rx = rot_x(cam_dir, tx, ty) + 320; // rotated x/y
	ry = rot_y(cam_dir, tx, ty) + 320;
	
	sx = scaledX(rx, ry); // scaled x/y
	sy = scaledY(rx, ry);
	sy -= entity.height * cam_zoom * scale; // To draw at the bottom left corner
	
	if (sy > horizon_scanline - ( entity.height * cam_zoom * scale)){ // Culling past the horizon
	
		// the real drawing
		ctx.drawImage(textures[entity.texture], sx, sy, entity.height * cam_zoom * scale, entity.height * cam_zoom * scale)
		
		// Id is a property unique to players! nametag rendering
		if (entity.id != undefined){
			if (entity.id == client.playerID){ // current player name flashes
				var seqond = new Date().getTime();
				ctx.fillStyle = "rgb(" + seqond%255 + ", " + seqond%255 + ", "+ seqond%255 + ")";
			}else{
				ctx.fillStyle = "#ffffff"
			}
			ctx.fillText(entity.name, sx , sy);
		}
	}
}

var render = function () {

	// canvas clear and initial translation
	ctx.clearRect(0,0,canvas.width,canvas.height)
	ctx.fillStyle = "#7FC9FF";
	//ctx.fillStyle = "#FF00FF"; // deastl mode
	ctx.fillRect(0,0,canvas.width,canvas.height);
	
	mapCtx.clearRect(0,0,mapCanvas.width,mapCanvas.height)
	mapCtx.fillStyle = "#006600";
	mapCtx.fillRect(0,0,mapCanvas.width,mapCanvas.height);
	
	mapCtx.translate(320, 320);
	mapCtx.rotate(cam_dir);
	
	entityRenderList = [];
	
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

	for (i = 0; i < 640 * flat_factor; i+=flat_factor){
	
		scale = 1 + (i/640)
		sourceY = Math.round(i/scale);
		ctx.drawImage(mapCanvas, 0, sourceY, // source x y
		
		640, 1, // source width height 
		
		320 - (320 * scale) , horizon_scanline + i / flat_factor, // destination x y

		640 * scale, 1); // destination width height

	//	ctx.drawImage(mapCanvas, 0, i, 640, 1, 0, i, 640, 1); // top down plain scanline render
	}
	

	for (var i = 0; i < client.players.length; i++){
	
		//mapCtx.drawImage(texture_PLAYER, rx, ry, 8*cam_zoom, 8*cam_zoom)
		entityRenderList.push(client.players[i]);
	}
	if (map){
		for (i = 0; i < map.trees.length; i++){
			entityRenderList.push(map.trees[i]);
		}
	}
	entityRenderList.sort(compareHeightVal);
	for (var i = 0; i < entityRenderList.length; i++){
		renderEntity( entityRenderList[i], 0, 0);
	}
	
	ctx.font = "30px Arial Narrow";
	ctx.fillStyle = "#ffffff";
	ctx.fillText("Rotation: " + cam_dir ,10,32); // title and player list
	ctx.fillText("Players: ",10,64);
	for (var i = 0; i < client.players.length; i++){
		
		if (i == client.playerID){
			var seqond = new Date().getTime();
			ctx.fillStyle = "rgb(" + seqond%255 + ", " + seqond%255 + ", "+ seqond%255 + ")";
		}else{
			ctx.fillStyle = "#ffffff"
		}
		ctx.fillText(client.players[i].name,10,96 + (i*32) );
	}
	
	if (client.socket){
		if (!client.socket.connected){
			ctx.fillText("Can't connect to server!", 200, 320)
		}
	}
};