var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require("socket.io")(server);
var Db = require("mongodb").Db;
var mongo = require("mongodb").MongoClient;
var _ = require('underscore')._;
var assert = require('assert');

app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 3000);
  app.set('ipaddr', process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1");
app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res) {
  res.render('index.html');
});

var mongourl = 'mongodb://localhost:27017/chat';


//functions
function purge(socket, action) {
  //The user isn't in a room, but maybe he just disconnected, handle the scenario:
  if (action === "disconnect") {
    io.sockets.emit("update", people[socket.id].name + " has disconnected from the server.");
    delete people[socket.id];
    sizePeople = _.size(people);
    io.sockets.emit("update-people", {people: people, count: sizePeople});
    var o = _.findWhere(sockets, {'id': socket.id});
    sockets = _.without(sockets, o);
  }   
}

//Stuff to do with database connection
mongo.connect(mongourl, function(err, db) {
  assert.equal(null, err);
  console.log("Connected to mongoserver");
  io.on("connection", function(socket) {
    var col = db.collection('ChatHistory');
    col.find().limit(100).sort({_id:1}).toArray(function (err, res) {
      if (err) throw err;
      socket.emit('history', res);
    })
    
    socket.on('send', function(data){
      if (typeof people[socket.id] !== "undefined") {
        var msg = people[socket.id].name + ": " + data;
        col.insert({msg:msg}, function(){
          io.sockets.emit("chat", msg);
        });
      }
    });
  });
});

var people = {};
var sockets = [];

//stuff to do with socket connection
io.on('connection', function (socket){
  console.log("somebody connected apparently at " + Date.now());
  socket.on("disconnect", function(){
    console.log("somebody disconnected");
  });
  socket.on("joinserver", function(name){
    var exists = false;
    _.find(people, function(key, value){
      if (key.name.toLowerCase() === name.toLowerCase()){
        return exists = true;
      }
    });
    if (exists) {
        socket.emit("exists", {msg : "name taken!!"});
    } else {
        people[socket.id] = { "name" : name };
        socket.emit("update", "You has connected to the server.");
        io.sockets.emit("update", people[socket.id].name + " has joined the server!!!!!");
        sizePeople = _.size(people);
        io.sockets.emit("update-people", { people : people, count : sizePeople });
        sockets.push(socket);
        user = people[socket.id];
        socket.emit("update", "welcome to the pizza suicide tv chat!");
    }
  });

  socket.on("getOnlinePeople", function(fn) {
    fn({people: people});
  });
  
  socket.on("disconnect", function() {
    if (typeof people[socket.id] !== "undefined") { //this handles the refresh of the name screen
      purge(socket, "disconnect");
    }
  });
  
});


server.listen(app.get('port'), app.get('ipaddr'), function(){
  console.log('Express server listening on  IP: ' + app.get('ipaddr') + ' and port ' + app.get('port'));
});

