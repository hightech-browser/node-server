var fs = require('fs');
var http = require('http');

var express = require('express');
var app = express();

var options = {
  key: fs.readFileSync('./file.pem'),
  cert: fs.readFileSync('./file.crt')
};
var serverPort = process.env.PORT || 5000;
var server = http.createServer(app);
var io = require('socket.io')(server);

app.set('port', serverPort);

function log(text) {
  var date = new Date();
  console.log('[' + date.getHours() + ':' + date.getMinutes() +'] ' + text);
}

var clients = {};

io.sockets.on('connection', function (socket) {
  var clientHash;
  log('new connection: ' + socket.id);
  io.to(socket.id).emit('registry');

  socket.on('registry', function (data) {
    clientHash = data.hash;
    log('registry client: ' + clientHash);

    if(!clients[clientHash]){
      clients[clientHash] = {
        'name' : data.name,
        'sockets' : []
      };
    }
      
    if(clients[clientHash].sockets.indexOf(socket.id) === -1){
      clients[clientHash].sockets.push(socket.id);
    }

  });
  socket.on('change-name', function (data) {
    log('name changed from ' + clients[clientHash].name + ' to ' + data);
    clients[clientHash].name = data;
  });



  socket.on('disconnect', function() {
    log('disconnect: ' + socket.id + ' / ' + clientHash);
    if(clientHash && clients[clientHash].sockets instanceof Array){
      var index = clients[clientHash].sockets.indexOf(socket.id);
      clients[clientHash].sockets.splice(index, 1);
    }
  });

  socket.on('open', function (obj) {
    if(!clients[obj.hash]){
      log('client with ' + obj + ' not registred!');
      io.to(socket.id).emit('error', 'client not registred!');
      return;
    }

    if(clients[obj.hash].sockets.length === 0){
      log('client with ' + obj + ' has no socket connected!');
      io.to(socket.id).emit('error', 'client has no socket connected!');
      return;
    }

    var socketID = clients[obj.hash].sockets[0];
    io.to(socketID).emit('open', obj);
  });
});

if(!(process.env.ENV && process.env.ENV === 'heroku')){
  app.get('/', function(req, response) {
    var objToJson = { };
    objToJson.response = clients;
    response.send(JSON.stringify(objToJson));
  });
}

app.get('/name', function(req, response) {
  var objToJson = { };
  objToJson.response = clients;
  response.send(clients[req.query.id]);
});



server.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});