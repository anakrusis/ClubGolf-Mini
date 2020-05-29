var flat_factor = 12;
var horizon_scanline = 224;
var scanline_size = 2;
var renderAngle;

var mapOrX = 320; // map canvas origin x/y
var mapOrY = 520;
var canvOrX = 320; // main canvas origin/x/y
var canvOrY = 320;
var canvW = 640;
var canvH = 640;
var mapCanvW = 640;
var mapCanvH = 640;

var METER_SCALE = 4;

var redrawFlag = true; // this is a flag that gets set off whenever there is a change in perspective requiring a map redraw

var rotatedX = function(x, y){
	tx = tra_x( x ) - mapOrX;
	ty = tra_y_o( y, mapOrY ) - mapOrY;
	return rot_x(renderAngle, tx, ty) + mapOrX; 
	
}

var rotatedY = function(x, y){
	tx = tra_x( x ) - mapOrX;
	ty = tra_y_o( y, mapOrY ) - mapOrY;
	return rot_y(renderAngle, tx, ty) + mapOrY;
}

var scaledX = function (x, y){

	rx = rotatedX(x, y); ry = rotatedY(x, y);

	line = (canvH * ry) / (-ry + canvH) // This is the algebraic inverse of the map drawing code
	scale = 1 + (line / canvH)
	return (rx - canvOrX) * scale + canvOrX
}

var scaledY = function (x, y){
	
	rx = rotatedX(x, y); ry = rotatedY(x, y);

	line = (canvH * ry) / (-ry + canvH)
	scale = 1 + (line / canvH)
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
	
	if (sy > horizon_scanline - ( entity.height * cam_zoom * scale)){ // Culling past the horizon
		
		if (entity.shadow && Math.random() > 0.5){
			ctx.drawImage(texture_SHADOW, sx, sy + entity.height * cam_zoom * scale * 0.95, entity.width * cam_zoom * scale, entity.width / 8 * cam_zoom * scale)	
		}
		
		if (entity.altitude){
			sy -= (entity.altitude * cam_zoom * scale);
		}
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
	ctx.fillStyle = "#7FC9FF";
	//ctx.fillStyle = "#FF00FF"; // deastl mode
	ctx.fillRect(0,0,canvas.width,canvas.height);
	

	entityRenderList = [];
	
	if (map && redrawFlag) { // map render (top-down here, mode7 afterwards)
	
		mapCtx.clearRect(0,0,mapCanvas.width,mapCanvas.height)
		mapCtx.fillStyle = "#006600";
		mapCtx.fillRect(0,0,mapCanvas.width,mapCanvas.height);
		
		mapCtx.translate(mapOrX, mapOrY);
		mapCtx.rotate(renderAngle);
	
		data = map.layers[0].data
		
		for (var i = 0; i < data.length; i++){
			tileVal = data[i] - 1
		
			sourcex = (tileVal % 16) * 8;
			sourcey = Math.floor(tileVal / 16) * 8;
			if (sourcex >= 0 && sourcey >= 0 && sourcex < mapCanvW && sourcey < mapCanvH){	
			
				destx = tra_x((i % map.width) * 8) - mapOrX;
				desty = tra_y_o(Math.floor(i / map.width) * 8, mapOrY) - mapOrY;
				mapCtx.drawImage(tileset,sourcex,sourcey,8,8,destx,desty,8*cam_zoom,8*cam_zoom)
			}
		}
		
		redrawFlag = false;
		mapCtx.setTransform(1, 0, 0, 1, 0, 0);
	}

	for (i = 0; i < 640 * flat_factor; i+=flat_factor * scanline_size){ // here is the mode7 style transform from mapcanvas -> canvas
	
		scale = 1 + (i/640)
		sourceY = Math.round(i/scale);
		ctx.drawImage(mapCanvas, 0, sourceY, // source x y
		
		640, 1, // source width height 
		
		320 - (320 * scale) , horizon_scanline + i / flat_factor, // destination x y

		640 * scale, scanline_size); // destination width height

	//	ctx.drawImage(mapCanvas, 0, i, 640, 1, 0, i, 640, 1); // top down plain scanline render
	}
	
	ctx.beginPath(); // crosshair
	ctx.moveTo(320, 450);
	ctx.lineTo(320, horizon_scanline + 100);
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
	
	if (powerMeter != -1){ // power meter		
		ctx.drawImage(texture_METER, 0, 0, // source x, y
		64 * powerMeter, 8, // source width, height
		320 - (METER_SCALE * 32), 600, // desination x, y
		METER_SCALE * 64 * powerMeter, METER_SCALE * 8); // destination width, height
		
		ctx.drawImage(texture_METER_OUTLINE, 320 - (METER_SCALE * 32), 600, METER_SCALE * 64, METER_SCALE * 8);
	}
	
	if (betweenTurnTimer > 0){
		ctx.fillStyle = "rgba(255, 255, 255, " + betweenTurnTimer/BETWEEN_TURN_TIME + ")";
		ctx.font = "bold 60px Arial";
		ctx.textAlign = "center";
		outStr = statusStrings[turnStatus];
		if (players[currentPlayer].done){
			if (holeStrings[holeStatus]){
				outStr = holeStrings[holeStatus];
			}else{
				outStr = holeStatus;
			}
		}
		ctx.fillText(outStr, 320, 320);
		ctx.fillStyle = "rgba(0, 0, 0, " + betweenTurnTimer/BETWEEN_TURN_TIME + ")";
		ctx.strokeText(outStr, 320, 320);
	}
	
	if (results_screen){
		ctx.fillStyle = "rgba(0,0,0,0.2)"
		ctx.fillRect(0,0,canvW,canvH)
	
		ctx.fillStyle = "rgb(255, 255, 255)";
		ctx.font = "bold 60px Arial";
		ctx.textAlign = "center";
		ctx.fillText("Results", 320, 140);
		
		for (i = 0; i < results[currentMap].length; i++){
			score = results[currentMap][i] - map.par
			if (score > 0){ score = "+" + score }
			ctx.fillText(results_names[i] + ": " + score, 320, 200 + i * 68);
		}
		
		ctx.fillStyle = "rgb(0, 0, 0)";
		ctx.strokeText("Results", 320, 140);
	}
	
	if (socket){
		if (!socket.connected){
			ctx.fillText("Can't connect to server!", 200, 320)
		}
	}
};