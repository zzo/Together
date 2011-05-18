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

function http_request(cb, url, method, postData) {

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

    if (postData) {
        options.headers = { 'Content-Length': postData.length };
    }

    if (url_data.search) {
        options.path += url_data.search;
    }

    console.log(options);

    var base = secure ? https : http;

    var req = base.request(options, function(res) {
        res.on('data', function(d) {
            data += d;
        });
        res.on('end', function() {
            cb(data);
        });
    });
    if (method === 'POST') {
        req.write(postData, 'utf8');
    }
    req.end();
}

function getFB(what, cb, token, who) {
    if (!who) {
        who = 'me';
    }
    var url = 'https://graph.facebook.com/' + who + '/' + what + '?access_token=' + token;
    http_request(cb, url);
}

function dealWithFBFeed(r) {
    var feed = JSON.parse(r); 
    console.log('deal with feed: ' + feed);
    if (typeof feed == 'object' && feed.data && feed.data.length) {
        var info = feed.data[0].id.split('_'),
            uid  = info[0], message_id = info[1];

        rclient.hgetall(uid + '_fb', function(error, fb_hash) {
//            if (!fb_hash || fb_hash.id !== message_id) {
                rclient.hset(uid + '_fb', 'id', message_id);
                rclient.hset(uid + '_fb', 'status', JSON.stringify(feed.data[0]));

                // Tell all friends
                console.log('looking intersection of users and ' + uid + '_friends');
                rclient.sinter('users', uid + '_friends', function(error, set) {
                    set.forEach(function(friend) {
                console.log('FOUND: ' + friend);
                        if (sockets[friend]) {
                console.log('SENDING fbstatus_change message to ' + friend);
                            feed.data[0].event = 'fbstatus_change';
                            sockets[friend].send(feed.data[0]);
                        }
                    });
                });
            //}
        });
    }
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
                        getFB(
                            'friends'
                            ,function(r) { 
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

function makeFriendMessage(hash, socket) {
    var msg = { event: 'friend', name: hash.name, href: hash.href, title: hash.title, uid: hash.uid };
    if (hash.want_to_join) {
        msg.want_to_join      = hash.want_to_join;
        msg.want_to_join_name = hash.want_to_join_name;
    }

    if (hash.wants_to_join) {
        msg.wants_to_join      = hash.wants_to_join;
        msg.wants_to_join_name = hash.wants_to_join_name;
    }

    if (hash.followers) {
        msg.followers = hash.followers;
    }

    if (hash.followingName) {
        msg.followingName = hash.followingName;
    }

    socket.send(msg);
}

var map = {
    join: function(data, socketClient) {
        var me = data.uid, them = data.them;

        if (sockets[them]) {
            rclient.hgetall(me, function(error, me_hash) {
                rclient.hgetall(them, function(error, them_hash) {
                    console.log('sending join_request to ' + them);
                    sockets[them].send({ event: 'join_request', from: me, name: me_hash.name });
                    rclient.hset(me,   'want_to_join', them);
                    rclient.hset(me,   'want_to_join_name', them_hash.name);
                    rclient.hset(them, 'wants_to_join', me);
                    rclient.hset(them, 'wants_to_join_name', me_hash.name);
                });
            });
        }
    },
    join_response: function(data, socketClient) {
        var me = data.uid, them = data.them, response = data.response;
        rclient.hgetall(me, function(error, me_hash) {
            rclient.hgetall(them, function(error, them_hash) {
                if (them_hash.want_to_join == me && me_hash.wants_to_join == them) {
                    rclient.hdel(me,   'wants_to_join');
                    rclient.hdel(me,   'wants_to_join_name');
                    rclient.hdel(them, 'want_to_join');
                    rclient.hdel(them, 'want_to_join_name');
                    console.log('SENDING JOIN RESPONSE TO: ' + them);
                    sockets[them].send({ event: 'join_response', from: me, name: me_hash.name, response: response });
                    if (response) {
                        socketClient.send({ event: 'follower', uid: them });
                        rclient.sadd(me + '_followers', them);
                        rclient.hset(them, 'following', me);
                    }
                } else {
                    console.log('NO MATCH');
                }
            });
        });
    },
    stop_follow: function(data, socketClient) {
        // Stop following regardless of me breaking it off or them breaking it off
        // so do both cases
        var me = data.uid, them = data.them;
        rclient.hgetall(me, function(error, me_hash) {
            rclient.hgetall(them, function(error, them_hash) {
                var message_me, message_them;
                if (rclient.srem(me + '_followers', them)) {
                    // The leader kicked out the follower
                    rclient.hdel(them, 'following', me);
                    message_me = them.name + ' is no longer following you';
                    message_them = 'You are no longer following ' + me.name;
                } else {
                    // The follower quit following the leader
                    rclient.srem(them + '_followers', me);
                    rclient.hdel(me, 'following', them);
                    message_me = 'You are no longer following ' + them.name;
                    message_them = me.name + ' is no longer following you';
                }
                socketClient.send({event: 'stopFollow', them: them, message: message_me });
                sockets[them].send({event: 'stopFollow', them: me, message: message_them });
            });
        });
    },
    invite: function(data, socketClient) {
    },
    iamHere: function(data, socketClient) {
        var uid = data.uid;
        rclient.hset(uid, 'title',     data.title);
        rclient.hset(uid, 'href',      data.href);
        rclient.hset(uid, 'uid',       data.uid);
        rclient.hset(uid, 'timestamp', Math.round(Date.now()/1000));
        rclient.sadd('users', uid);

        sockets[uid] = socketClient;


        // Check if token is expired
        //  Am I following or leading anyone?
        //
        // find online friends - intersection of this user's friends & 'users'
        rclient.hgetall(uid, function(error, me) {

            // Get FB status of all my friends
            rclient.smembers(uid + '_friends', function(error, set) {
                var j = 0, jump = 20;
                while (j < set.length) {
                    var request = [];
                    for (var i = j; i < j+jump && i < set.length; i++) {
                        request.push({ method: 'GET', relative_url: set[i] + '/feed'});
                    }
                    http_request(function(data) { console.log('BATCH RESPONSE'); console.log(JSON.parse(data)); }, 'https://graph.facebook.com', 'POST', 'batch=' + JSON.stringify(request) + "&access_token=" + me.token);
                    j += jump;
                }
            });

            rclient.sinter('users', uid + '_friends', function(error, set) {
                set.forEach(function(friend) {
                    rclient.hgetall(friend, function(err, friend_hash) {
                        // back out to me - my friend's status
                        if (friend_hash.following) {
                            rclient.hgetall(friend_hash.following, function(error, following) {
                                friend_hash.followingName = following.name;
                                makeFriendMessage(friend_hash, socketClient);
                            });
                        } else {
                            // even if this guy doesn't have any followers 
                            rclient.smembers(uid + '_followers', function(err, members) {
                                if (members && members.length) {
                                    friend_hash.followers = members;
                                }
                                makeFriendMessage(friend_hash, socketClient);
                            });
                        }

                        // send my status out to my friends
                        if (sockets[friend]) {
                            if (me.following) {
                                rclient.hgetall(me.following, function(error, following) {
                                    me.followingName = following.name;
                                    makeFriendMessage(me, sockets[friend]);
                                });
                            } else {
                                rclient.smembers(friend + '_followers', function(err, members) {
                                    if (members && members.length) {
                                        me.followers = members
                                    }
                                    makeFriendMessage(me, sockets[friend]);
                                });
                            }
                        }
                    });
                });
            });
        });
    },
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

rclient.del('users');   // Clear this out
socket.on('connection', function(socketClient) {
    socketClient.on('message', function(data) { 
        var ev = data.event;
        if (data.uid) {
            socketClient.uid = data.uid;
        }
        if (map[ev]) {
            map[ev](data, socketClient);
        } else {
            console.log('I do not know event: ' + ev);
            console.log(data);
        }
    });

    socketClient.on('disconnect', function() { rclient.srem('users', this.uid); delete sockets[this.uid]; console.log('Bye Bye ' + this.uid);  });
});

var PORT = 8081;
server.listen(PORT);
console.log('Tracker server listening on port ' + PORT);

