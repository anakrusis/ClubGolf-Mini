var config = require('./config.js');

var io = require('socket.io')(config.port);

console.log("Starting server")

io.on('connection', function (socket) {

	socket.on("playerJoin", function (player) {
		console.log(player.name + " has joined the server")
		io.emit("playerJoin", player)
	});
	
});

