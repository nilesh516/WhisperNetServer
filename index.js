const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const chat = require('./routes/chat');
const cors = require('cors');

const {addUser, removeUser, getUser, getUserInRoom} = require('./users')

const PORT = process.env.PORT || 5000;
 
const app = express();
const server = http.createServer(app);
const io = socketio(server,{
    cors:{
        origin:'*'
    }
});
app.use(chat);
app.use(cors());

    io.on('connection', (socket)=>{
    socket.on('join',({name,room}, callback)=>{
        // console.log(name,room);
        const {error , user } = addUser({id:socket.id, name, room});

        if(error) return callback(error);

        socket.emit('message', {user: 'admin', text: `${user.name}, welcome to the room ${user.room}`} );   // telling the user that he is welcome to the chat
        socket.broadcast.to(user.room).emit('message', {user: 'admin', text: `${user.name}, has joined!`});// letting everybody else beside the user know that the user has joined

        socket.join(user.room); // joins user to the room

        io.to(user.room).emit('roomData', { room: user.room, users: getUserInRoom(user.room) }) // to get the details of users in a particular room

        callback();
    });

    // For sending message
    socket.on('sendMessage', (message, callback)=>{
        const {name , room} = getUser(socket.id);

        io.to(room).emit('message', {user : name, text:message})
        io.to(room).emit('roomData', { room: room, users: getUserInRoom(room)})

        callback(); 

    });

    socket.on('disconnect', ()=>{
        const user = removeUser(socket.id);
        if(user){
            io.to(user.room).emit('message', {user:'admin', text: `${user.name} has left !!`})
        }
        // console.log('User had left !!!');
   });
});


server.listen(PORT, ()=> console.log(`Server has started on port ${PORT}`))
 