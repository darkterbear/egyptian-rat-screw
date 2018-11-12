/**
 * User schema
 *
 * 'id': {
 *    name: String,
 *    room: String
 * }
 */
var users = {}

/**
 * A dictionary of pending setTimeout handlers for disconnecting users
 */
var disconnects = {}

/**
 * Room schema
 *
 * 'id': {
 *    members: [id],
 *    open: Boolean
 * }
 */
var rooms = {}

const hat = length => {
	var text = ''
	var possible = 'abcdef0123456789'

	for (var i = 0; i < length; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length))

	return text
}

module.exports = server => {
	const io = require('socket.io')(server)

	const updatePlayers = roomId => {
		io.to(roomId).emit(
			'updatePlayers',
			rooms[roomId].members.map(m => {
				var u = { ...users[m] }
				u.id = m
				return u
			})
		)
	}

	io.on('connection', socket => {
		// autoassign id
		var id = hat(8)
		while (Object.keys(users).includes(id)) {
			id = hat(8)
		}

		// send id to client
		socket.emit('id', id)

		// handle setId
		socket.on('setId', id => {
			id = id
			clearTimeout(disconnects[id])
		})

		// handle setName from client
		socket.on('setName', name => {
			if (users[id]) return

			users[id] = {
				name,
				room: null
			}
		})

		socket.on('createRoom', () => {
			if (users[id].room) return

			// autoassign roomId
			var roomId = hat(6)
			while (Object.keys(rooms).includes(roomId)) {
				roomId = hat(6)
			}

			rooms[roomId] = { members: [id], open: true }

			socket.emit('roomId', roomId)
			socket.join(roomId)
		})

		socket.on('joinRoom', roomId => {
			if (
				users[id].room ||
				!rooms[roomId] ||
				rooms[roomId].members.length > 6 ||
				!rooms[roomId].open
			)
				return

			rooms[roomId].members.push(id)
			socket.join(roomId)

			// push new players to entire group
			updatePlayers(roomId)
		})

		socket.on('leaveRoom', () => {
			if (!users[id].room) return

			const roomId = users[id].room
			const room = rooms[roomId]
			socket.leave(roomId)

			if (room.members.length <= 1) {
				delete rooms[roomId]
				users[id].room = null
			} else {
				room.members.splice(room.members.indexOf(id), 1)
				users[id].room = null
				updatePlayers(roomId)
			}
		})

		socket.on('disconnect', () => {
			const handler = setTimeout(() => {
				if (!users[id] || !users[id].room) return

				const roomId = users[id].room
				const room = rooms[roomId]
				socket.leave(roomId)

				if (room.members.length <= 1) {
					delete rooms[roomId]
					users[id].room = null
				} else {
					room.members.splice(room.members.indexOf(id), 1)
					users[id].room = null
					updatePlayers(roomId)
				}
			}, 5000)

			disconnects[id] = handler
		})
	})
}
