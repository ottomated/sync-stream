class Room {
	constructor(id) {
		this.id = id;
		this.movie = null;
		this.timestamp = 0;
		this.playing = false;
		this.people = {};
		this.canJoin = (person) => true; // Can join room
		this.canSetVideo = (person) => true; // Can set video
	}

	join(person) {
		for (let current of Object.keys(this.people)) {
			if (current == person.id || !this.canJoin(person))
				return false;
		}
		if (person.room != null) {
			person.room.leave(person);
		}
		this.people[person.id] = person;
		person.room = this;
		person.socket.join(this.id);
		person.socket.emit('room join', this);
		return true;
	}

	leave(person, disconnecting = false) {
		delete this.people[person.id];
		if (!disconnecting)
			person.room = null;
		person.socket.leave(this.id);
		person.socket.emit('room leave');
	}

	setVideo(url) {
		this.movie = url;
		this.playing = false;
		this.timestamp = 0;
	}

	setVideoPutlocker(pageUrl) {

	}

}

module.exports = Room;