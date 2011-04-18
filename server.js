/*jslint plusplus: false */
var fb_app_id     = '166824393371670';
var fb_cookie     = 'fbs_' + fb_app_id;
var fb_app_secret = 'accb35fd6f8c613931f6ab0df9295d37';
var fb_access_token, fb_access_token_expires;
var hostname      = 'ps48174.dreamhostps.com:8081';
var querystring = require('querystring');
var URL = require('url');
var http = require('http');
var https = require('https');
var fs = require('fs');

function http_request(cb, url, method) {

    var url_data = URL.parse(url)
        ,port = url_data.port || 80
        ,secure = url_data.protocol == 'https:'
        ,data = '';

    if (port == 80 && secure) {
        port = 443;
    }
    method = method || 'GET';

    var options = {
        host: url_data.hostname,
        port: port,
        path: url_data.pathname,
        method: method
    };

    if (url_data.search) {
        options.path += url_data.search;
    }

    console.log(options);

    var base = secure ? https : http;

    var req = base.request(options, function(res) {
        res.on('data', function(d) {
            data += d;
        });
        res.on('end', function(d) {
            cb(data);
        });
    });
    req.end();
}

function getFBFriends(cb, token) {
    var url = 'https://graph.facebook.com/me/friends?access_token=' + token;
    http_request(cb, url);
}

var Connect = require('connect'), server = Connect.createServer(
        Connect.logger() // Log responses to the terminal using Common Log Format.
        ,Connect.favicon()
        ,Connect.cookieParser()
        ,Connect.static('/home/trostler/server/static') // Serve all static files in the current dir.
        ,Connect.router(function(app){
            app.get('/together', function(req, res, next) {
                var fb_app_id = '166824393371670',
                    fb_cookie = 'fbs_' + fb_app_id;
                if ((!req.headers.referer || (req.headers.referer.match(hostname) || req.headers.referer.match('facebook.com/plugins') ||
                        req.headers.referer.match('fbcdn.net/connect') || req.headers.referer.match('fbcdn.net')))) {
                    // don't track us!
                    res.writeHead(200, {
                          'Content-Length': 0,
                          'Content-Type': 'application/javascript'
                    });
                    res.end();
                } else if (req.headers.referer) {
                    if (!req.cookies[fb_cookie]) {
                        // Login to FB ya bastardo
                        var body = 'window.top.location="http://' + hostname + '/index.html";';
                        res.writeHead(200, {
                            'Content-Length': body.length,
                            'Content-Type': 'text/html'
                        });
                        res.end(body, 'utf8');
                    } else {
                        var fb_cookie = querystring.parse(req.cookies[fb_cookie]);
                        res.writeHead(200, {
                            'Content-Type': 'application/javascript'
                        });
                        res.write('var FB_USER_ID = "' + fb_cookie.uid + '";', 'utf8');
//                        res.write('var FB_ACCESS  = "' + fb_cookie.access_token + '";', 'utf8');
                        var tracker_js = fs.createReadStream('static/tracker2.js');
                        tracker_js.resume();
                        tracker_js.pipe(res);

                        rclient.hset(fb_cookie.uid, 'token',         fb_cookie.access_token);
                        rclient.hset(fb_cookie.uid, 'token_expires', fb_cookie.expires);
                        rclient.zadd('expires', fb_cookie.expires, fb_cookie.uid);
                        getFBFriends(
                            function(r) { 
                                var friends = JSON.parse(r).data; 
                                friends.forEach(function(friend) {
                                    rclient.sadd(fb_cookie.uid + '_friends', friend.id);
                                    rclient.hset(friend.id, 'name', friend.name);
                                });
                            }
                            ,fb_cookie.access_token
                        );
                    }
                } else {
                }
            });
        })
    ),
    io      = require('socket.io'), 
    socket  = io.listen(server),
    redis   = require('redis'),
    rclient = redis.createClient(),
    bulk    = 100, subscriptions = {};

server.fb_cookie = fb_cookie;

function sendEvents(name, index, socketClient) {
    rclient.llen(name, function(error, length) {
        var end, bulk = length;
        if (index < length) {
            end = index + bulk - 1;
            rclient.lrange(name, index, end, function(error, events) {
                console.log('sending ' + events.length + ' messages: ' + index + ' to ' + end + ' length: ' + events.length);
                socketClient.send({ event: 'events', data: events, start: index, end: events.length + index, name: name  });
            });
        }
    });
}

var map = {
    keepAlive: function(data, client) {
        var uid = data.uid;
        rclient.hset(uid, 'title',     data.title);
        rclient.hset(uid, 'href',      data.href);
        rclient.hset(uid, 'timestamp', Math.round(Date.now()/1000));
        rclient.sadd('users', uid);

        // Check if token is expired
        //  Am I following or leading anyone?
        //
        // find online friends - intersection of this user's friends & 'users'
        rclient.sinter('users', uid + '_friends', function(error, set) {
            var friends = [];
            set.forEach(function(friend) {
                friends.push({});
            });
            console.log(set);
                socketClient.send({ event: 'events', data: events, start: index, end: events.length + index, name: name  });
        });
    },
    startCapture: function(data) {
//        console.log('starting to capture for: ' + data.name);
        rclient.sadd('tracker_sessions', data.name);
        rclient.del(data.name);
    },
    stopCapture: function(data) {
//        console.log('stopping to capture for: ' + data.name);
    },
    startFollow: function(data, socketClient) {
//        console.log('starting to follow for: ' + data.name);
//        sendTrackerEvent(data.name, data.index, socketClient);
        sendEvents(data.name, data.index, socketClient);
        console.log("" + socketClient);
        if (!subscriptions[socketClient]) {
            subscriptions[socketClient] = {};
        }
        subscriptions[socketClient][data.name] = 1;
        subscriptions[socketClient].client = socketClient;
    },
    event: function(data) {
        var json_event = JSON.stringify(data.data), obj;
        rclient.rpush(data.name, json_event);
        rclient.llen(data.name, function(error, length) {
            for (var client in subscriptions) {
                obj = subscriptions[client];
                if (obj[data.name]) {
                    obj.client.send({ event: 'events', data: [ json_event ], name: data.name, start: length  });
                }
            }
        });
    },
    getCaptures: function(data, socketClient) {
        rclient.smembers('tracker_sessions', function(error, captures) {
            socketClient.send({ event: 'captures', data: captures });
        });
    },
    getInfo: function(data, socketClient) {
        rclient.smembers('tracker_sessions', function(error, captures) {
            captures.forEach(function(name) {
                rclient.llen(name, function(error, length) {
                    if (length > 0) {
                        rclient.lindex(name, 0, function(error, event) {
                            var event_obj = JSON.parse(event);
                            socketClient.send({ event: 'info', name: name, length: length, url: event_obj.host });
                        });
                    }
                });
            });
        });
    },
    capDelete: function(data) {
        rclient.del(data.name);
        rclient.srem('tracker_sessions', data.name);
    }
};

socket.on('connection', function(socketClient) {
    // new client is here!
    socketClient.on('message', function(data) { 
        var ev = data.event;
        if (map[ev]) {
            map[ev](data, socketClient);
        } else {
            console.log('I do not know event: ' + ev);
        }
    });

    socketClient.on('disconnect', function() { console.log('DISCONNECT'); });
});

var PORT = 8081;
server.listen(PORT);
console.log('Tracker server listening on port ' + PORT);

