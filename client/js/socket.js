function SOCKET() {
	this.socket;
	this.onPlayerLeave = this.onPlayerLeave.bind(this);
	this.onPlayerJoin = this.onPlayerJoin.bind(this);
	
}
SOCKET.prototype.connectTimer = 0;

SOCKET.prototype.onPlayerJoin = function(playerJoining, serverPlayerList, serverMap) {
	console.log(playerJoining.name + " has joined the server");
	client.players = serverPlayerList
	
	if (client.playerID == -1) {  // Handler for uninitialized player (client-side)
		client.playerID = playerJoining.id
		cam_x = playerJoining.ball.x
		cam_y = playerJoining.ball.y
	}
	
	if (!map){ // If the player does not yet have the map, then here it is
		map = serverMap
	}
}

SOCKET.prototype.onPlayerLeave = function(playerLeaving, serverPlayerList) {
	if (playerLeaving < client.playerID) {
		client.playerID--;
	}
	if (playerLeaving == client.playerID) {
		this.socket.disconnect();
	}
	console.log(players[playerLeaving].name + " has left the server");
	client.players = serverPlayerList;
}

SOCKET.prototype.onDisconnect = function() {}

SOCKET.prototype.connect = function() {

	if (this.socket) {
		this.socket.disconnect();
	}
	
	var socket = io.connect(settings.opts.connectionString);
	
	socket.on("connect", function(e) {
		player = client.addPlayer(socket.id);
		socket.emit("playerJoinRequest", player)
		socket.on("disconnect", this.onDisconnect);
	});
	
	socket.on("playerJoin", this.onPlayerJoin);
	socket.on("playerLeave", client.onPlayerLeave);
	socket.on("playerMove", client.onPlayerMove);
	
	socket.on("ballUpdate", function( id, ball ){
		client.players[id].ball = ball
	});
}