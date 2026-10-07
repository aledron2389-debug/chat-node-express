const express = require('express');
const { Server } = require('socket.io');

const app = express();
const server = app.listen(4000, () => {
  console.log('Servidor corriendo en http://localhost:4000');
});

app.use(express.static('public'));

const io = new Server(server, {
  maxHttpBufferSize: 25 * 1024 * 1024 // 25 MB
});

io.on('connection', (socket) => {
  console.log('Hay una conexión', socket.id);

  socket.on('chat', (data) => {
    io.sockets.emit('chat', data);
  });

  socket.on('typing', (data) => {
    socket.broadcast.emit('typing', data);
  });

  socket.on('archivo', (data) => {
    io.sockets.emit('archivo', data);
  });
});