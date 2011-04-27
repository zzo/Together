/*jslint plusplus: false */
var fb_app_id     = '166824393371670';
var fb_cookie     = 'fbs_' + fb_app_id;
var fb_app_secret = 'accb35fd6f8c613931f6ab0df9295d37';
var hostname      = 'ps48174.dreamhostps.com:8081';
var querystring = require('querystring');
var URL = require('url');
var http = require('http');
var https = require('https');
var fs = require('fs');
var sockets = {};

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
//        ,Connect.static('/home/trostler/server/static') // Serve all static files in the current dir.
        ,Connect.static(__dirname + '/static') // Serve all static files in the current dir.
        ,Connect.router(function(app){
            app.get('/together', function(req, res, next) {
                // See if we already got an access token...
                var fb_app_id = '166824393371670',
                    fb_cookie = 'fbs_' + fb_app_id;
                if ((!req.headers.referer || (req.headers.referer.match(hostname) || req.headers.referer.match('facebook.com') ||
                        req.headers.referer.match('fbcdn.net') || req.headers.referer.match('toolbar.yahoo.com')))) {
                    // don't track us!
                    res.writeHead(200, {
                          'Content-Length': 0,
                          'Content-Type': 'application/javascript'
                    });
                    res.end();
                } else if (req.headers.referer) {
                    if (!req.cookies[fb_cookie]) {
                        var body = 'window.top.location="http://' + hostname + '/index.html";';
                        res.writeHead(200, {
                            'Content-Length': body.length,
                            'Content-Type': 'application/javascript'
                        });
                        res.end(body, 'utf8');
                    } else {
                        var fb_cookie = querystring.parse(req.cookies[fb_cookie]);
                        res.writeHead(200, {
                            'Content-Type': 'application/javascript'
                        });
                        res.write('var FB_USER_ID = "' + fb_cookie.uid + '";', 'utf8');
                        //var tracker_js = fs.createReadStream('static/tracker2.js');
                        var tracker_js = fs.createReadStream('static/start/init.js');
                        tracker_js.resume();
                        tracker_js.pipe(res);

                        rclient.hset(fb_cookie.uid, 'token', fb_cookie.access_token);
                        getFBFriends(
                            function(r) { 
                                var friends = JSON.parse(r).data; 
                                if (typeof friends == 'object') {
                                    friends.forEach(function(friend) {
                                        rclient.sadd(fb_cookie.uid + '_friends', friend.id);
                                        rclient.hset(friend.id, 'name', friend.name);
                                    });
                                }
                            }
                            ,fb_cookie.access_token
                        );
                    }
                } else {
                    console.log('WEIRDNESS!!');
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
    join: function(data, socketClient) {
        var me = data.me, them = data.them;

        if (sockets[them]) {
            rclient.hgetall(me, function(error, me_hash) {
                console.log('sending join_request to ' + them);
                sockets[them].send({ event: 'join_request', from: me, name: me_hash.name });
                rclient.hset(me,   'want_to_join', them);
                rclient.hset(them, 'wants_to_join', me);
            });
        }
    },
    join_response: function(data, socketClient) {
        var me = data.me, them = data.them, response = data.response;
        rclient.hgetall(me, function(error, me_hash) {
            rclient.hgetall(them, function(error, them_hash) {
                /*
                console.log('ME');
                console.log(me_hash);
                console.log('THEM');
                console.log(them_hash);
                */
                if (them_hash.want_to_join == me && me_hash.wants_to_join == them) {
                    rclient.hdel(me,   'wants_to_join');
                    rclient.hdel(them, 'want_to_join');
                    sockets[them].send({ event: 'join_response', from: me, name: me_hash.name, response: response });
                    if (response) {
                        socketClient.send({ event: 'follower', uid: them });
                        rclient.sadd(me + '_followers', them);
                        rclient.hset(them, 'following', me);
                    }
                }
            });
        });
    },
    invite: function(data, socketClient) {
    },
    iamHere: function(data, socketClient) {
        var uid = data.uid;
        rclient.hset(uid, 'title',     data.title);
        rclient.hset(uid, 'href',      data.href);
        rclient.hset(uid, 'timestamp', Math.round(Date.now()/1000));
        rclient.sadd('users', uid);

        sockets[uid] = socketClient;

        // Check if token is expired
        //  Am I following or leading anyone?
        //
        // find online friends - intersection of this user's friends & 'users'
        rclient.hgetall(uid, function(error, me) {
            rclient.sinter('users', uid + '_friends', function(error, set) {
                set.forEach(function(friend) {
                    rclient.hgetall(friend, function(err, friend_hash) {
                        // back out to me - my friend's status
                        var msg = { event: 'friend', name: friend_hash.name, href: friend_hash.href, title: friend_hash.title, uid: friend, following: friend_hash.following };
                        socketClient.send(msg);

                        // send my status out to my friends
                        if (sockets[friend]) {
                            msg = { event: 'friend', name: me.name, href: data.href, title: data.title, uid: data.uid, following: me.following };
                            sockets[friend].send(msg);
                        }
                    });
                });
            });
        });

        /*
         * Tell me everyone following me
         */
        rclient.smembers(uid + '_followers', function(err, members) {
            members.forEach(function(follower) {
                Y.log(follower + ' is following ' + uid);
                socketClient.send({ event: 'follower', uid: follower });
            });
        });
    },
             /*
    startCapture: function(data) {
//        console.log('starting to capture for: ' + data.name);
        rclient.sadd('tracker_sessions', data.name);
        rclient.del(data.name);
    },
    stopCapture: function(data) {
//        console.log('stopping to capture for: ' + data.name);
    },
    startFollow: function(data, socketClient) {
        var uid = data.data.uid;
//        console.log('starting to follow for: ' + data.name);
//        sendTrackerEvent(data.name, data.index, socketClient);
//        sendEvents(data.name, data.index, socketClient);
        console.log('START FOLLOW: ' + uid);
        if (!subscriptions[uid]) {
            subscriptions[uid] = {};
        }
//        subscriptions[uid][data.name] = 1;
        subscriptions[uid].client = socketClient;
    },
    */
    event: function(data) {
        var json_event = JSON.stringify(data.data), obj;
//        rclient.rpush(data.uid + '_events', json_event);
        rclient.smembers(data.uid + '_followers', function(err, members) {
            members.forEach(function(follower) {
                sockets[follower].send({ event: 'events', data: [ json_event ], name: data.uid });
            });
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
            console.log(data);
        }
    });

    socketClient.on('disconnect', function() { console.log('DISCONNECT'); });
});

var PORT = 8081;
server.listen(PORT);
console.log('Tracker server listening on port ' + PORT);

