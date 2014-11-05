var express = require('express')
, app = express()
, server = require('http').createServer(app)
, io = require("socket.io").listen(server)
, uuid = require('node-uuid')
, Room = require('./room.js')
, _ = require('underscore')._;

app.configure(function() {
  app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 3000);
    app.set('ipaddr', process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1");
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use('/components', express.static(__dirname + '/components'));
  app.use('/js', express.static(__dirname + '/js'));
  app.use('/icons', express.static(__dirname + '/icons'));
  app.set('views', __dirname + '/views');
  app.engine('html', require('ejs').renderFile);
});

app.get('/', function(req, res) {
  res.render('index.html');
});

server.listen(app.get('port'), app.get('ipaddr'), function(){
  console.log('Express server listening on  IP: ' + app.get('ipaddr') + ' and port ' + app.get('port'));
});

io.set("log level", 1);
var default_room_id = uuid.v4();
var default_room = new Room("Pizza Suicide Tv Chat", default_room_id);
var people = {};
var rooms = {};
rooms[default_room_id] = default_room;
var sockets = [];
var chatHistory = {};
chatHistory['Pizza Suicide Tv Chat'] = [];
sizeRooms = _.size(rooms);

function purge(s, action) {
  if (people[s.id].inroom) { //user is in a room
    var room = rooms[people[s.id].inroom]; //check which room user is in.
    console.log(rooms);
    console.log(people[s.id].inroom);
    //user in room but does not own room
    if (action === "disconnect") {
      io.sockets.emit("update", people[s.id].name + " has disconnected from the server.");
      if (_.contains((room.people), s.id)) {
        var personIndex = room.people.indexOf(s.id);
        room.people.splice(personIndex, 1);
        s.leave(room.name);
      }
      delete people[s.id];
      sizePeople = _.size(people);
      io.sockets.emit("update-people", {people: people, count: sizePeople});
      var o = _.findWhere(sockets, {'id': s.id});
      sockets = _.without(sockets, o);
    } else if (action === "leaveRoom") {
      if (_.contains((room.people), s.id)) {
        var personIndex = room.people.indexOf(s.id);
        room.people.splice(personIndex, 1);
        people[s.id].inroom = null;
        io.sockets.emit("update", people[s.id].name + " has left the room.");
        s.leave(room.name);
      }
    } 
  } else {
    //The user isn't in a room, but maybe he just disconnected, handle the scenario:
    if (action === "disconnect") {
      io.sockets.emit("update", people[s.id].name + " has disconnected from the server.");
      delete people[s.id];
      sizePeople = _.size(people);
      io.sockets.emit("update-people", {people: people, count: sizePeople});
      var o = _.findWhere(sockets, {'id': s.id});
      sockets = _.without(sockets, o);
    }   
  }
}

io.sockets.on("connection", function (socket) {
  socket.on("joinserver", function(name, device) {
    var exists = false;
    inRoomID = default_room_id;

    _.find(people, function(key,value) {
      if (key.name.toLowerCase() === name.toLowerCase())
        return exists = true;
    });
    if (exists) {//provide unique username:
      var randomNumber=Math.floor(Math.random()*1001)
      do {
        proposedName = name+randomNumber;
        _.find(people, function(key,value) {
          if (key.name.toLowerCase() === proposedName.toLowerCase())
            return exists = true;
        });
      } while (!exists);
      socket.emit("exists", {msg: "The username already exists, please pick another one.", proposedName: proposedName});
    } else {
      people[socket.id] = {"name" : name, "inroom" : null, "device": device};
      socket.emit("update", "You have connected to the server.");
      io.sockets.emit("update", people[socket.id].name + " is online.")
      sizePeople = _.size(people);
      sizeRooms = _.size(rooms);
      io.sockets.emit("update-people", {people: people, count: sizePeople});
//      socket.emit("roomList", {rooms: rooms, count: sizeRooms});
      sockets.push(socket);
      default_room.addPerson(socket.id);
      people[socket.id].inroom = default_room_id;
      socket.room = default_room.name;
      socket.join(socket.room);
      user = people[socket.id];
      io.sockets.in(socket.room).emit("update", user.name + " has connected to " + default_room.name + " room.");
      socket.emit("update", "Welcome to " + default_room.name + ".");
      socket.emit("sendRoomID", {id: default_room_id});
      var keys = _.keys(chatHistory);
      if (_.contains(keys, socket.room)) {
        socket.emit("history", chatHistory[socket.room]);
      }
    }
  });

  socket.on("getOnlinePeople", function(fn) {
                fn({people: people});
        });


  socket.on("typing", function(data) {
    if (typeof people[socket.id] !== "undefined")
      io.sockets.in(socket.room).emit("isTyping", {isTyping: data, person: people[socket.id].name});
  });
  
  socket.on("send", function(msg) {
    console.log(chatHistory);
    console.log(chatHistory[socket.room]);
    console.log(socket.room);
    //process.exit(1);
    var re = /^[w]:.*:/;
    var whisper = re.test(msg);
    var whisperStr = msg.split(":");
    var found = false;
    if (whisper) {
      var whisperTo = whisperStr[1];
      var keys = Object.keys(people);
      if (keys.length != 0) {
        for (var i = 0; i<keys.length; i++) {
          if (people[keys[i]].name === whisperTo) {
            var whisperId = keys[i];
            found = true;
            if (socket.id === whisperId) { //can't whisper to ourselves
              socket.emit("update", "You can't whisper to yourself.");
            }
            break;
          } 
        }
      }
      if (found && socket.id !== whisperId) {
        var whisperTo = whisperStr[1];
        var whisperMsg = whisperStr[2];
        socket.emit("whisper", {name: "You"}, whisperMsg);
        io.sockets.socket(whisperId).emit("whisper", people[socket.id], whisperMsg);
      } else {
        socket.emit("update", "Can't find " + whisperTo);
      }
    } else {
      if (io.sockets.manager.roomClients[socket.id]['/'+socket.room] !== undefined ) {
        io.sockets.in(socket.room).emit("chat", people[socket.id], msg);
        socket.emit("isTyping", false);
        if (_.size(chatHistory[socket.room]) > 100) {
          chatHistory[socket.room].splice(0,1);
        } else {
          chatHistory[socket.room].push(people[socket.id].name + ": " + msg);
        }
          } else {
        socket.emit("update", "Please connect to a room.");
          }
    }
  });

  socket.on("disconnect", function() {
    if (typeof people[socket.id] !== "undefined") { //this handles the refresh of the name screen
      purge(socket, "disconnect");
    }
  });


});
