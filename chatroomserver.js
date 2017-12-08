var http = require('http');
var app = require('express')();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

// Commented ad he
//io.set("transports", ["xhr-polling", "jsonp-polling"]);
io.set('close timeout', 60*60*24);
app.listen(8080);

// routing
app.get('/', function (req, res) {
	console.log(__dirname + '\\index.html');
	   res.sendfile( '/index.html' , {root:__dirname});
});

// usernames which are currently connected to the chat
var usernames = {};
var io10 = io.of('/socket10');

// rooms which are currently available in chat
var rooms = ['room1','room2','room3'];

io10.on('connection', function (socket) {

	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username){
		// store the username in the socket session for this client
		socket.username = username;
		// store the room name in the socket session for this client
		socket.room = 'room1';
		// add the client's username to the global list
		usernames[username] = username;
		// send client to room 1
		socket.join('room1');
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER', 'you (' + username + ') have connected to socket10.room1');
		// echo to room 1 that a person has connected to their room
		socket.broadcast.to('room1').emit('updatechat', 'SERVER', username + ' has connected to this socket10.room');
		socket.emit('updaterooms', rooms, 'room1');
	});

	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters


        //socket.broadcast.in(socket.room).emit('updatechat', socket.username, data);

        // The following methods behaves diffrently for 1.0 and 0.9
        // This method doesn't send self in 1.0 while 0.09  it send self only
        //socket.to(socket.room).emit('updatechat', socket.username, data);

		io10.to(socket.room).emit('updatechat', socket.username, data);
	});

	socket.on('switchRoom', function(newroom){
		// leave the current room (stored in session)
		socket.leave(socket.room);
		// join new room, received as function parameter
		socket.join(newroom);
		socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
		// sent message to OLD room
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
		// update socket session room title
		socket.room = newroom;
		socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' has joined this room');
		socket.emit('updaterooms', rooms, newroom);
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete usernames[socket.username];
		// update list of users in chat, client-side
		io10.emit('updateusers', usernames);
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.room);
	});
});
