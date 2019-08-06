const lobbyDiv = document.getElementById('lobby');
const roomList = document.getElementById('rooms');
const register = document.getElementById('register');
const nameEntry = document.getElementById('name');
const nameSubmit = document.getElementById('submitname')
const urlEntry = document.getElementById('url');
const urlSubmit = document.getElementById('submiturl');

const roomDiv = document.getElementById('room');
const roomName = document.getElementById('roomname');
const peopleList = document.getElementById('people');

var room = null;

nameSubmit.addEventListener('click', () => {
	if (nameEntry.value)
		socket.emit('register', nameEntry.value);
});
urlSubmit.addEventListener('click', () => {
	if (urlEntry.value)
		socket.emit('set video', urlEntry.value);
});

const socket = io();
socket.on('connect', () => {
	document.getElementById('connecting').style.display = 'none';
	if (window.localStorage.secret) {
		socket.emit('register with secret', window.localStorage.secret);
	} else {
		register.style.display = 'initial';
	}
});

socket.on('registered', (secret) => {
	window.localStorage.secret = secret;
	register.style.display = 'none';
	roomList.style.display = 'initial';
});

socket.on('secret failed', () => {
	window.localStorage.removeItem('secret');
	register.style.display = 'initial';
});

socket.on('rooms', (rooms) => {
	while (roomList.firstChild) roomList.removeChild(roomList.firstChild);
	for (let r of Object.values(rooms)) {
		let el = document.createElement('li');
		el.innerText = `${r.id}, ${Object.keys(r.people).length} people`;
		el.addEventListener('click', () => {
			socket.emit('join room', r.id);
		})
		roomList.appendChild(el);
	}
	let create = document.createElement('button');
	create.innerText = 'Create room';
	create.addEventListener('click', () => {
		socket.emit('create room');
	});
	roomList.appendChild(create);

	if (room != null) {
		while (peopleList.firstChild) peopleList.removeChild(peopleList.firstChild);
		for (let person of Object.values(rooms[room.id].people)) {
			let el = document.createElement('li');
			el.innerText = `${person.nickname}`;
			peopleList.appendChild(el);
		}
	}
});



socket.on('room join', (r) => {
	lobbyDiv.style.display = 'none';
	roomDiv.style.display = 'initial';
	roomName.innerText = r.id;
	room = r;
});
socket.on('room leave', () => {
	lobbyDiv.style.display = 'initial';
	roomDiv.style.display = 'none';
	room = null;
});

socket.on('client error', (error) => {
	console.error("ERROR", error);
});
socket.on('disconnect', () => {
	location.reload();
});