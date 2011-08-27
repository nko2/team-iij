var usersById = {};
var nextUserId = 0;
var usersByTwitId = {};
var express = require('express');
var ejs = require('ejs');
var app = module.exports = express.createServer()
    ,io = require('socket.io').listen(app)
    ,RedisStore = require('connect-redis')(express)
    , nko = require('nko')('YIjnA93TUs1ZJBym');

io.configure('production', function(){
  io.enable('browser client minification');  
  io.enable('browser client etag');          
  io.set('log level', 2);
  io.set('transports', [                     
      'websocket'
    , 'flashsocket'
    , 'htmlfile'
    , 'xhr-polling'
    , 'jsonp-polling'
  ]);
});

io.sockets.on('connection', function (socket) {
  socket.on('connect', function(){
    console.log("user connected");
  });
  socket.on('message', function (msg) {
    if("nekoData" in msg) {
      socket.json.broadcast.send(msg);
    }
  });
  socket.on('disconnect', function () {
    console.log('user disconnected');
  });
});

function addUser (source, sourceUser) {
  var user;
  user = usersById[++nextUserId] = {id: nextUserId};
  user[source] = sourceUser;
  return user;
}

var everyauth = require('everyauth');
var consumerKey = "lBVc0hFWaAoDCGbXVe3JRg";
//var consumerKey = 'S6rnCD5fZqx8T9LXPoISbA';
var consumerSecret = 'UQtjm72v9Kz3mt9AVzjqFr7KIpN2025eC5dkkZ1UUCQ';
//var consumerSecret = '3SKffY2ZSrfd6o3jQRhGADRYF29MBzkz9i8LJWPo';
everyauth.twitter
  .consumerKey(consumerKey)
  .consumerSecret(consumerSecret)
  .findOrCreateUser(function (sess, accessToken, accessSecret, twitUser) {
    return usersByTwitId[twitUser.id] || (usersByTwitId[twitUser.id] = addUser('twitter', twitUser));
  })
  .redirectPath('/');

everyauth.everymodule.findUserById( function (id, callback) {
      callback(null, usersById[id]);
});


// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.set('view options', { layout: false });
  app.use(express.logger());
  app.use(express.favicon());
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({secret: '20110827teamiij'
                           ,store: new RedisStore
                           ,cookie: { maxAge: 30 * 86400 * 1000 }}));
  app.use(everyauth.middleware());  
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes
everyauth.helpExpress(app);

app.get('/', function (req, res) {
  if(req.session.auth && req.user ){
    res.render('index.ejs', {locals : {user: req.user}});
  } else {
    res.render('login.ejs');
  }
});

app.get('/logout', function(req, res, next){
  req.session.destroy(function() {
    res.redirect('/');
  });
});
app.listen(parseInt(process.env.PORT) || 8080);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
});
