const path = require('path');
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage } = require('../src/utils/messages');
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require('../src/utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectory = path.join(__dirname, '../public');

app.use(express.static(publicDirectory));
app.use(express.json());

io.on('connection', (socket) => {
  socket.on('join', (options, cb) => {
    const { error, user } = addUser({ ...options, id: socket.id });

    if (error) {
      return cb(error);
    }

    socket.join(user.room);

    socket.emit('message', generateMessage('admin', 'Welcome!!'));
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        generateMessage(user.username, `${user.username} has joined!!`)
      );

    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    cb();
  });

  socket.on('sendMessage', (message, cb) => {
    const filter = new Filter();
    const user = getUser(socket.id);

    if (filter.isProfane(message)) {
      return cb('Profanity is not allowed@');
    }

    io.to(user.room).emit('message', generateMessage(user.username, message));
    cb();
  });

  socket.on('sendlocation', (location, cb) => {
    const user = getUser(socket.id);
    const url = `https://google.com/maps?q=${location.latitude},${location.longtitude}`;
    io.to(user.room).emit(
      'locationMessage',
      generateMessage(user.username, url)
    );
    cb('server have received the coords');
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        generateMessage(user.username, `${user.username} left the room`)
      );
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(port, () => {
  console.log('listening on port' + port);
});
