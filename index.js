var fs = require('fs');
var https = require('https');

var express = require('express');
var app = express();

var options = {
  key: fs.readFileSync('./file.pem'),
  cert: fs.readFileSync('./file.crt')
};
var serverPort = 443;

var server = https.createServer(options, app);
var io = require('socket.io')(server);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index.html');
});


io.sockets.on('connection', function (socket) {
/*
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
*/
  socket.on('open', function (data) {
    console.log('  open request', data);
    socket.emit('open', data);
  });
});

server.listen(serverPort, function() {
  console.log('server up and running at %s port', serverPort);
});