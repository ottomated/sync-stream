const express = require('express'),
	socket = require('socket.io'),
	http = require('http');

const createError = require('http-errors'),
	path = require('path'),
	cookieParser = require('cookie-parser'),
	logger = require('morgan'),
	debug = require('debug')('sync:server'),
	debugS = require('debug')('sync:socket'),
	uuid = require('uuid/v4');

const Room = require('./classes/room'),
	Person = require('./classes/person');

const app = express(),
	server = http.createServer(app),
	io = socket.listen(server);

var port = process.env.PORT || '3000';
app.set('port', port);

server.listen(port);
server.on('listening', () => {
	var addr = server.address();
	var bind = typeof addr === 'string'
		? 'pipe ' + addr
		: 'port ' + addr.port;
	debug('Listening on ' + bind);
})

var rooms = {};
var people = {};
var secrets = {};

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', require('./routes/index'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});


io.on('connection', function (s) {
	var person = null;
	s.on('set video', () => {
		if (person == null) {
			debugS('[SETVID] Socket tried to set video without registering');
			return s.emit('client error', 'Need to set name first');
		}
		else if (person.room == null) {
			debugS(`[SETVID] ${person.id} tried to set video when not in room`);
			return s.emit('client error', 'Need to join a room first');
		}
		else if (!person.room.canSetVideo(person)) {
			debugS(`[SETVID] ${person.id} tried to set video without permission`);
			return s.emit('client error', 'You can\'t set videos in this room');
		}

	});
	s.on('create room', () => {
		if (person == null) {
			debugS('[CREATE] Socket tried to create room without registering');
			return s.emit('client error', 'Need to set name first');
		}
		else if (!person.canCreateRooms) {
			debugS(`[CREATE] ${person.id} tried to create room without permission`);
			return s.emit('client error', 'Don\'t have permission to create rooms');
		}
		else if (person.room != null) {
			debugS(`[CREATE] ${person.id} tried to create room when in room ${person.room.id}`);
			return s.emit('client error', 'Already in a room');
		}
		let id = uuid();
		rooms[id] = new Room(id);
		debugS(`[CREATE] ${person.id} created room ${id}`);
		rooms[id].join(person);
		io.emit('rooms', rooms);
	});
	s.on('register', (nick) => {
		nick = nick.trim();
		for (let current of Object.values(people)) {
			if (current.nickname == nick) {
				debugS(`[REGIST] ${nick} already taken`);
				return s.emit('client error', 'Name in use');
			}
		}
		if (person != null) {
			debugS(`[REGIST] ${person.id} registered again, changing name to ${nick}`);
			person.nickname = nick;
			io.emit('rooms', rooms);
			return;
		}
		let id = uuid();
		let secret = uuid();
		person = new Person(id);
		people[id] = person;
		person.nickname = nick;
		person.socket = s;
		person.secret = secret;
		s.emit('registered', secret);
		debugS(`[REGIST] ${id} registered as "${nick}"`);
	});
	s.on('register with secret', (secret) => {
		if (person != null) {
			debugS(`[SECRET] ${person.id} registered again`);
			return s.emit('client error', 'Already registered');
		}
		person = secrets[secret];
		if (!person) {
			debugS(`[SECRET] ${secret} invalid`);
			return s.emit('secret failed');
		}
		person.socket = s;
		people[person.id] = person;
		if (person.room) person.room.join(person);
		delete secrets[secret];
		s.emit('registered', secret);
		io.emit('rooms', rooms);
		debugS(`[SECRET] ${person.id} reconnected`);
	});
	s.on('join room', (id) => {
		if (person == null) {
			debugS('[JOIN  ] Socket tried to join room without registering');
			return s.emit('client error', 'Need to set name first');
		}
		let targetRoom = rooms[id];
		if (!targetRoom) {
			debugS(`[JOIN  ] ${person.id} tried to join invalid room ${id}`);
			s.emit('rooms', rooms); // Update their list in case that's why they joined an invalid room
			return s.emit('client error', 'Room doesn\'t exist');
		}
		if (person.room != null && id === person.room.id) {
			debugS(`[JOIN  ] ${person.id} was already in room ${id}`)
			// Silently fail
			return;
		}
		debugS(`[JOIN  ] ${person.id} joined room ${id}`);
		if (targetRoom.join(person)) {
			io.emit('rooms', rooms);
		} else {
			s.emit('client error', 'Room denied entry');
		}
	});
	s.on('leave room', () => {
		if (person == null) {
			debugS('[LEAVE ] Socket tried to leave room without registering');
			return s.emit('client error', 'Need to set name first');
		}
		if (person.room == null) {
			debugS(`[LEAVE ] ${person.id} wasn't in a room`);
			return;
		}
		debugS(`[LEAVE ] ${person.id} left their room`);
		person.room.leave(person);
		io.emit('rooms', rooms);
	});
	s.on('disconnect', () => {
		if (person) {
			debugS(`[DISCON] ${person.id} disconnected`);
			secrets[person.secret] = person;
			delete people[person.id];
			if (person.room) {
				person.room.leave(person, true);
			}
			io.emit('rooms', rooms);
		} else {
			debugS(`[DISCON] Socket disconnected`);
		}
	});



	s.emit('rooms', rooms);
})

module.exports = { app: app, io: io };
