var flat_factor = 10
var horizon_scanline = 224
var renderAngle;

var rotatedX = function(x, y){
	tx = tra_x( x ) - 320;
	ty = tra_y( y ) - 320;
	return rot_x(renderAngle, tx, ty) + 320; 
	
}

var rotatedY = function(x, y){
	tx = tra_x( x ) - 320;
	ty = tra_y( y ) - 320;
	return rot_y(renderAngle, tx, ty) + 320;
}

var scaledX = function (x, y){

	rx = rotatedX(x, y); ry = rotatedY(x, y);

	line = (640 * ry) / (-ry + 640) // This is the algebraic inverse of the map drawing code
	scale = 1 + (line/640)
	return (rx - 320) * scale + 320
}

var scaledY = function (x, y){
	
	rx = rotatedX(x, y); ry = rotatedY(x, y);

	line = (640 * ry) / (-ry + 640)
	scale = 1 + (line/640)
	return horizon_scanline + line / flat_factor
}

var compareHeightVal = function (entity1, entity2){

	sy1 = scaledY(entity1.x, entity1.y);
	sy2 = scaledY(entity2.x, entity2.y);
	
	return sy1 - sy2;
}

var renderEntity = function (entity, x_offset, y_offset) {
	
	rx = rotatedX(entity.x, entity.y);// rotated x/y
	ry = rotatedY(entity.x, entity.y);
	sx = scaledX(entity.x, entity.y); // scaled x/y
	sy = scaledY(entity.x, entity.y);
	sx -= (entity.width / 2) * cam_zoom * scale;
	sy -= entity.height * cam_zoom * scale; // To draw at the bottom left corner
	
	if (entity.name == "Ball"){
		mapCtx.drawImage(textures[2], rx, ry, 2*cam_zoom, 2*cam_zoom)
	}
	
	if (sy > horizon_scanline - ( entity.height * cam_zoom * scale)){ // Culling past the horizon
	
		// the real drawing
		ctx.drawImage(textures[entity.texture], sx, sy, entity.width * cam_zoom * scale, entity.height * cam_zoom * scale)
		
		// Id is a property unique to players! nametag rendering
		if (entity.id != undefined){
			if (entity.id == playerID){ // current player name flashes
				var seqond = new Date().getTime();
				ctx.fillStyle = "rgb(" + seqond%255 + ", " + seqond%255 + ", "+ seqond%255 + ")";
			}else{
				ctx.fillStyle = "#ffffff"
			}
			ctx.font = "30px Arial Narrow";
			ctx.fillText(entity.name, sx , sy);
		}
	}
}

var render = function () {

	renderAngle = 2 * Math.PI - cam_dir - Math.PI / 2

	// canvas clear and initial translation
	ctx.clearRect(0,0,canvas.width,canvas.height)
	ctx.fillStyle = "#7FC9FF";
	//ctx.fillStyle = "#FF00FF"; // deastl mode
	ctx.fillRect(0,0,canvas.width,canvas.height);
	
	mapCtx.clearRect(0,0,mapCanvas.width,mapCanvas.height)
	mapCtx.fillStyle = "#006600";
	mapCtx.fillRect(0,0,mapCanvas.width,mapCanvas.height);
	
	mapCtx.translate(320, 320);
	mapCtx.rotate(renderAngle);
	
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
	
	ctx.beginPath(); // crosshair
	ctx.moveTo(320, 280);
	ctx.lineTo(320, horizon_scanline);
	ctx.stroke();
	

	for (var i = 0; i < players.length; i++){
	
		if (!players[i].done){
			entityRenderList.push(players[i]);
			entityRenderList.push(players[i].ball);
		}

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
	ctx.textAlign = "left";
	
	if (players[currentPlayer]){ // player list
		var topString = players[currentPlayer].name + "'s turn (Shot: " + players[currentPlayer].shot + ")";
		ctx.fillText(topString,10,32);
	}

	ctx.fillText("Players: ",10,96); 
	for (var i = 0; i < players.length; i++){
	
		if (i == playerID){
			var seqond = new Date().getTime();
			ctx.fillStyle = "rgb(" + seqond%255 + ", " + seqond%255 + ", "+ seqond%255 + ")";
		}else{
			ctx.fillStyle = "#ffffff"
		}
		ctx.fillText(players[i].name,10,128 + (i*32) );
	}
	ctx.fillStyle = "#ffffff"
	if (map){
		ctx.fillText("Par: " + map.par, 566, 32);
	}
	
	if (clubs){ // clubs
		ctx.fillText(clubs[players[playerID].club].name, 10, 630);
	}
	
	if (betweenTurnTimer > 0){
		ctx.fillStyle = "rgba(255, 255, 255, " + betweenTurnTimer/BETWEEN_TURN_TIME + ")";
		ctx.font = "bold 60px Arial";
		ctx.textAlign = "center";
		ctx.fillText(statusStrings[turnStatus], 320, 320);
		ctx.fillStyle = "rgba(0, 0, 0, " + betweenTurnTimer/BETWEEN_TURN_TIME + ")";
		ctx.strokeText(statusStrings[turnStatus], 320, 320);
	}
	
	if (socket){
		if (!socket.connected){
			ctx.fillText("Can't connect to server!", 200, 320)
		}
	}
};