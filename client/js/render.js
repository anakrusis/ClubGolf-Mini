var flat_factor = 8;
var horizon_scanline = 128;
var scanline_size = 2;
var renderAngle;

var mapOrX = 500; // map canvas origin x/y
var mapOrY = 520;
var mapCanvW = 1000;
var mapCanvH = 640;

var canvOrX = 500; // main canvas origin/x/y
var canvOrY = 320;
var canvW = 1000;
var canvH = 640;

var METER_SCALE = 4;

var redrawFlag = true; // this is a flag that gets set off whenever there is a change in perspective requiring a map redraw

var rotatedX = function(x, y){
	tx = tra_x_o( x, mapOrX ) - mapOrX;
	ty = tra_y_o( y, mapOrY ) - mapOrY;
	return rot_x(renderAngle, tx, ty) + mapOrX; 
	
}

var rotatedY = function(x, y){
	tx = tra_x_o( x, mapOrX ) - mapOrX;
	ty = tra_y_o( y, mapOrY ) - mapOrY;
	return rot_y(renderAngle, tx, ty) + mapOrY;
}

var scaledX = function (x, y){

	rx = rotatedX(x, y); ry = rotatedY(x, y);

	line = (canvH * ry) / (-ry + canvH) // This is the algebraic inverse of the map drawing code
	scale = 1 + (line / canvH)
	return ((rx - mapOrX ) * scale * (canvW / mapCanvW) + canvOrX)
	//return (rx - mapOrX) * scale + canvOrX
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

var initMapTex = function (map) {

	texCanvas.width = map.width * 8;
	texCanvas.height = map.height * 8;
	data = map.layers[0].data;
	
	for (var i = 0; i < data.length; i++){
		tileVal = data[i] - 1

		sourcex = (tileVal % 16) * 8;
		sourcey = Math.floor(tileVal / 16) * 8;
		
		destx = (i % map.width) * 8;
		desty = Math.floor(i / map.width) * 8;
		//if (destx >= -256 && desty >= -256 && destx < 256 && desty < 256){	
		texCtx.drawImage(tileset,sourcex,sourcey,8,8,destx,desty,8,8)
		//}
	}
}

var renderEntity = function (entity, x_offset, y_offset) {
	
	rx = rotatedX(entity.x, entity.y);// rotated x/y
	ry = rotatedY(entity.x, entity.y);
	sx = scaledX(entity.x, entity.y); // scaled x/y
	sy = scaledY(entity.x, entity.y);
	sx -= (entity.width / 2) * cam_zoom * scale;
	sy -= entity.height * cam_zoom * scale; // To draw at the bottom left corner
	
	if (sy > horizon_scanline - ( entity.height * cam_zoom * scale)){ // Culling past the horizon
		
		if (entity.shadow){
			ctx.drawImage(texture_SHADOW, sx, sy + entity.height * cam_zoom * scale * 0.95, entity.width * cam_zoom * scale, 1 * cam_zoom * scale)	
		}
		
		if (entity.altitude){
			sy -= (entity.altitude * cam_zoom * scale);
		}
		// the real drawing
		ctx.drawImage(textures[entity.texture], sx, sy, entity.width * cam_zoom * scale, entity.height * cam_zoom * scale)
		
		// Id is a property unique to players! nametag rendering
		if (entity.id != undefined){
			if (entity.id == currentPlayer){ // current player name flashes
				var seqond = new Date().getTime();
				ctx.fillStyle = "rgb(255, 255," + seqond%255 + ")";
			}else{
				ctx.fillStyle = "#ffffff"
			}
			ctx.font = "24px Verdana";
			ctx.textAlign = "center";
			ctx.fillText(entity.name, sx + entity.width / 2 * cam_zoom * scale, sy);
		}
	}
}

var render = function () {

	//flat_factor = 4.8 * cam_zoom + 9.6; 
	//flat_factor = 12;
	
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
		
		// transfer map from texctx to mapctx here
		dx = tra_x_o(0, mapOrX) - mapOrX;
		dy = tra_y_o(0, mapOrY) - mapOrY;
		mapCtx.drawImage(texCanvas, dx, dy, map.width*8*cam_zoom, map.height*8*cam_zoom)
		
		redrawFlag = false;
		mapCtx.setTransform(1, 0, 0, 1, 0, 0);
	}

	for (i = 0; i < 640 * flat_factor; i+=flat_factor * scanline_size){ // here is the mode7 style transform from mapcanvas -> canvas
	
		scale = 1 + (i/640)
		sourceY = Math.round(i/scale);
		ctx.drawImage(mapCanvas, 0, sourceY, // source x y
		
		mapCanvW, 1, // source width height 
		
		canvOrX - (mapOrX * scale), horizon_scanline + i / flat_factor, // destination x y

		mapCanvW * scale, scanline_size); // destination width height

	//	ctx.drawImage(mapCanvas, 0, i, 640, 1, 0, i, 640, 1); // top down plain scanline render
	}

	for (i in players){
	
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
	
	if (map){
		// MINIMAP
		var minimapWidth = 256;
		var minimapHeight = 256 * (map.height / map.width)
		ctx.drawImage(texCanvas, canvW - minimapWidth, canvH - minimapHeight, minimapWidth, minimapHeight)
		
		ctx.lineWidth = 2;
		ctx.strokeRect(canvW - minimapWidth, canvH - minimapHeight, minimapWidth, minimapHeight);
	}
	
	ctx.font = "24px Verdana";
	ctx.fillStyle = "#ffffff";
	ctx.textAlign = "left";
	
	if (players[currentPlayer]){ // player list
		var topString = players[currentPlayer].name + "'s turn (Stroke " + players[currentPlayer].shot + ")";
		ctx.fillText(topString,10,32);
	}

	ctx.fillText("Players: ",10,96); 
	var count = 0;
	for (i in players){
	
		if (i == currentPlayer){
			var seqond = new Date().getTime();
			ctx.fillStyle = "rgb(255, 255," + seqond%255 + ")";
		}else{
			ctx.fillStyle = "#ffffff"
		}
		var playerstr = players[i].name;
		if (i == playerID){
			playerstr += " ⬅You" // black arrow
		}
		ctx.fillText(playerstr,10,128 + (count*32) );
		count++;
	}
	ctx.fillStyle = "#ffffff"
	if (map){
		ctx.fillText("Par: " + map.par, canvW - 88, 32);
	}
	
	if (clubs && players[currentPlayer]){ // clubs
		ctx.fillText(clubs[players[currentPlayer].club].name, 10, 630);
	}
	
	if (powerMeter != -1){ // power meter		
		ctx.drawImage(texture_METER, 0, 0, // source x, y
		64 * powerMeter, 8, // source width, height
		320 - (METER_SCALE * 32), 600, // desination x, y
		METER_SCALE * 64 * powerMeter, METER_SCALE * 8); // destination width, height
		
		ctx.drawImage(texture_METER_OUTLINE, 320 - (METER_SCALE * 32), 600, METER_SCALE * 64, METER_SCALE * 8);
	}
	
	if (betweenTurnTimer > 0 && players[currentPlayer]){
		ctx.fillStyle = "rgba(255, 255, 255, " + betweenTurnTimer/BETWEEN_TURN_TIME + ")";
		ctx.font = "bold 60px Verdana";
		ctx.textAlign = "center";
		outStr = statusStrings[turnStatus];
		
		if (players[currentPlayer].done){
			if (players[currentPlayer].shot == 1){
				outStr = "Hole in One!"
			}else if (holeStrings[holeStatus]){
				outStr = holeStrings[holeStatus];
			}else{
				outStr = "+" + holeStatus;
			}
		}
		ctx.fillText(outStr, canvOrX, canvOrY);
		ctx.fillStyle = "rgba(0, 0, 0, " + betweenTurnTimer/BETWEEN_TURN_TIME + ")";
		ctx.strokeText(outStr, canvOrX, canvOrY);
	}
	
	if (results_screen && map){
		ctx.fillStyle = "rgba(0,0,0,0.2)"
		ctx.fillRect(0,0,canvW,canvH)
	
		ctx.fillStyle = "rgb(255, 255, 255)";
		ctx.font = "bold 54px Verdana";
		ctx.textAlign = "center";
		ctx.fillText("Results", canvOrX, 140);
		ctx.font = "20px Verdana";
		
		var hite = 200;
		for (key in results){
			ctx.fillText(results_names[key] + ": ", 100, hite);
			for (i = -6; i <= 0; i++){
				score = results[key][currentMap + i];
				if (score === undefined || score === null){
					score = "--";
				}else{
					if (score > 0){ score = "+" + score }
				}
				ctx.fillText(score, 550 + 64*i, hite);
			}
			hite += 40;
		}
		
		ctx.fillStyle = "rgb(0, 0, 0)";
		ctx.font = "bold 54px Verdana";
		ctx.strokeText("Results", canvOrX, 140);
	}
	
	if (socket){
		if (!socket.connected){
			ctx.fillText("Can't connect to server!", 200, 320)
		}
	}
	//ctx.fillText(flat_factor, 200, 320)
};