var cam_x = 0;
var cam_y = 0;
var cam_dir = 0;
var cam_zoom = 1;
var cameraSpeed = 1;
originx = 320
originy = 320

var tra_x = function(x){ // translate x based on camera values
	return ((x-cam_x)*cam_zoom)+originx
}

var tra_y = function(y){ // translate y based on camera values
	return ((y-cam_y)*cam_zoom)+originy
}

var rot_x = function(angle,x,y){
	return x * Math.cos(angle) - y * Math.sin(angle) // appends an X val
}

var rot_y = function(angle,x,y){
	return x * Math.sin(angle) + y * Math.cos(angle) // and a Y val
}