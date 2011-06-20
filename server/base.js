var FB_ID       = '166824393371670',
    FB_SECRET   = 'accb35fd6f8c613931f6ab0df9295d37',
    TW_KEY      = 'a0avrZUo3Zwzk9QZ6VIw',
    TW_SECRET   = 'KouP9L7mLjhJiQfUJqtlyDKL5CGvr82C1Gs6oquA',
    YHOO_KEY    = 'dj0yJmk9YklwTG8waGF4M1kyJmQ9WVdrOU1tSk5PR1ZQTm1VbWNHbzlOalV5TWpZM05UWXkmcz1jb25zdW1lcnNlY3JldCZ4PTc1',
    YHOO_SECRET = '7f28566b58829d0606339b025b826b7539eb7f0f',
    sys         = require('sys'),
    events      = require('events'),
    fs          = require('fs'),
    querystring = require('querystring'),
    hostname    = 'dashr.net:8081';
    Connect     = require('connect'),
    RedisStore  = require('connect-redis'),
    redis       = new RedisStore(),
    rclient     = redis.client,
    auth        = require('connect-auth'),
    myauth      = require('./auth'),
    OAuth       = require('oauth').OAuth,
    facebook    = require('./facebook/local'),
    twitter     = require('./twitter/local'),
    checkServices = require('./checkServices'),
    server      = Connect.createServer(
//        Connect.logger() // Log responses to the terminal using Common Log Format.
        Connect.favicon()
        ,Connect.cookieParser()
        ,Connect.static(__dirname + '/../static') // Serve all static files in the current dir.
        ,Connect.session({ store: redis, secret: 'dashboard' })
        ,myauth.authCheck(rclient, hostname)
        ,auth([auth.Facebook({appId : FB_ID, appSecret: FB_SECRET, scope: "offline_access,xmpp_login,user_status,friends_status,read_stream", callback: 'http://' + hostname + '/auth/facebook'})])
        ,facebook.local_facebook({ rclient: rclient, hostname: hostname, fb_id: FB_ID, fb_secret: FB_SECRET })
        ,auth([auth.Twitter({consumerKey: TW_KEY, consumerSecret: TW_SECRET, callback: 'http://' + hostname + '/auth/twitter' })])
        ,twitter.local_twitter({ key: TW_KEY, secret: TW_SECRET, rclient: rclient, hostname: hostname })
        /*
        ,auth([auth.Yahoo({consumerKey: YHOO_KEY, consumerSecret: YHOO_SECRET, callback: 'http://' + hostname + '/auth/yahoo' })])
        ,yahoo.local_yahoo({ key: YHOO_KEY, secret: YHOO_SECRET, rclient: rclient, hostname: hostname })
        */
    ),
    io      = require('socket.io'),
    socket  = io.listen(server),
    nxb     = require('node-xmpp-bosh'),
    bosh_server = nxb.start({
//        logging: "DEBUG",
        port: 5280,
        no_tls_domains: [ 'chat.facebook.com' ]
    });

var MessageServer = function(args) {
    events.EventEmitter.call(this);

    var _this = this;

    this.socket = args.socket;
    this.redis  = args.redis;
    this.server = args.server;
    this.sockets = {};
    this.setUp();

    socket.on('connection', function(socketClient) {
        socketClient.on('message', function(data) {

            if (data.event !=  'iamHere') {
                console.log('GOT MESSAGE');
                console.log(data);
            }

            if (data.uid) {
                _this.sockets[data.uid] = socketClient;
                socketClient.uid = data.uid;
            }
            _this.emit(data.event, data);//, socketClient);
        });

        socketClient.on('disconnect', function() { 
            console.log('bye bye ' + this.uid); 
            delete _this.sockets[this.uid]; 
        });
    });
}
sys.inherits(MessageServer, events.EventEmitter);

MessageServer.prototype.setUp = function() {
    var _this = this;

    this.server.use(Connect.router(function(app){
        app.get('/together', function(req, res) {
            //var url = req.urlp = urlparser.parse(req.url, true);
            /*
            console.log('referer');
            console.log(req.headers.referer);
            console.log('----');
            console.log(req);
            */
            if (req.headers.referer && req.headers.referer.match(hostname)) {
                res.end('');
            } else if (!req.session || !req.session.user) {
                //res.end('top.location.href="http://' + hostname + '/start/login.html";', 'utf8');
                res.end('top.location.href="http://' + hostname + '/dashr/index.html";', 'utf8');
            } else {
                res.write('var USER_ID = "' + req.session.user + '";', 'utf8');
                var tracker_js = fs.createReadStream('../static/start/init.js');
                tracker_js.resume();
                tracker_js.pipe(res);
            }
        });

        app.get('/', function(req, res) {
            _this.redis.hgetall(req.session.user, function(error, user_obj) {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                if (user_obj.fb_access_token) {
                    res.end('Successfully linked with Facebook!');
                } else {
                    res.end('<a href="/facebook">Link With Facebook</a>');
                }
            });
        });
    }));
};

MessageServer.prototype.sendMessage = function(who, data) {
    if (this.sockets[who]) {
        this.sockets[who].send(data);
    }
};

MessageServer.prototype.get = function(who, what, cb) {
    this.redis.hget(who, what, function(error, val) {
        cb(val);
    });
};

var PORT = 8081;
server.listen(PORT);
console.log('Together server listening on port ' + PORT);
var ms = new MessageServer( { socket: socket, redis: rclient, server: server } );

/// FACEBOOK
var remote_fb = require('./facebook/remote');
var local_facebook = new remote_fb.remote_facebook({ messenger: ms, redis: rclient });

/// TWITTER
var remote_twitter = require('./twitter/remote');
var local_twitter = new remote_twitter.remote_twitter({ messenger: ms, redis: rclient });

