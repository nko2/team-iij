var usersById = {};
var nextUserId = 0;
var usersByTwitId = {};
var express = require('express');
var ejs = require('ejs');
var app = module.exports = express.createServer()
    ,io = require('socket.io').listen(app)
    ,RedisStore = require('connect-redis')(express)
    , nko = require('nko')('YIjnA93TUs1ZJBym');


io.enable('browser client minification');  
io.enable('browser client etag');          
io.set('log level', 1); 
io.set('transports', [                     
      'websocket'
    , 'flashsocket'
    , 'htmlfile'
    , 'xhr-polling'
    , 'jsonp-polling'
]);


var fs = require('fs');
//var fd = fs.openSync('./node_neko.json','w');
var neko_auto = true;
var neko_auto_json;
if(neko_auto){
  neko_auto_json = JSON.parse(fs.readFileSync("./node_neko.json","utf8"));
}
io.sockets.on('connection', function (socket) {
  if(neko_auto){
    var i = 0;
    var tmout = setInterval(function(){
      socket.json.broadcast.send(neko_auto_json[i]);
      i++;
      if(i > neko_auto_json.length){
        i = 0;
      }
    },1000/10);
  }
  socket.on('connect', function(){
    console.log("user connected");
  });
  socket.on('message', function (msg) {
    if("nekoData" in msg) {
      socket.json.broadcast.send(msg);
//      fs.writeSync(fd, JSON.stringify(msg), encoding='utf8')
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
var consumerKey,consumerSecret;
if( process.env.NODE_ENV === 'production' ){
  consumerKey = "lBVc0hFWaAoDCGbXVe3JRg";
  consumerSecret = 'UQtjm72v9Kz3mt9AVzjqFr7KIpN2025eC5dkkZ1UUCQ';
} else {
  consumerKey = 'S6rnCD5fZqx8T9LXPoISbA';
  consumerSecret = '3SKffY2ZSrfd6o3jQRhGADRYF29MBzkz9i8LJWPo';
}

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
  if(req.session.auth){
    req.session.authed = true;
  }
  if(req.user && req.user.twitter && req.user.twitter.screen_name){
    req.session.screen_name = req.user.twitter.screen_name;
  }
//  console.log(req.session);
  if(req.session.authed && req.session.screen_name){
    res.render('index.ejs', {locals : {screen_name: req.session.screen_name}});
  } else {
    res.render('index.ejs', {locals : {screen_name: null}});
  }
});

app.get('/byebye', function(req, res, next){
  delete(req.session.authed);
  delete(req.session.screen_name);
  req.session.destroy(function() {
    res.redirect('/');
  });
});

app.listen(process.env.NODE_ENV === 'production' ? 80 : 8080, function() {
  console.log('Ready');

  // if run as root, downgrade to the owner of this file
  if (process.getuid() === 0)
    require('fs').stat(__filename, function(err, stats) {
      if (err) return console.log(err)
      process.setuid(stats.uid);
    });
});

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
});
