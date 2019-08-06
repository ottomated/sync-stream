class Person {
	constructor(id) {
		this.id = id;
		this.nickname = '';
		this.room = null;
		this.color = 'black';
		this.canCreateRooms = true;
		this.socket = null;
	}

	toJSON() {
		let res = {};
		for (var x in this) {
			if (x == 'room' || x == 'socket')
				res[x] = this[x].id;
			else if (x != 'secret')
				res[x] = this[x];
		}
		return res;
	}
}

module.exports = Person;