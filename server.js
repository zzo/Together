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

var Connect = require('connect'), server = Connect.createServer(
        Connect.logger() // Log responses to the terminal using Common Log Format.
        ,Connect.favicon()
        ,Connect.cookieParser()
        ,Connect.static('/home/trostler/server/static') // Serve all static files in the current dir.
        ,Connect.router(function(app){
            app.get('/login', function(req, res, next){
                var info = URL.parse(req.url, true);
                if (!info.query.code) {
                    var qs = querystring.stringify(
                        {
                            redirect_uri : 'http://' + hostname + '/login',
                            client_id    : fb_app_id
                        }
                    );
                    var dialog_url = "http://www.facebook.com/dialog/oauth?" + qs;
                    var body = "<script>top.location.href='" + dialog_url + "'</script>";
                    res.writeHead(200, {
                          'Content-Length': body.length,
                          'Content-Type': 'text/html'
                    });
                    res.end(body, 'utf8');
                } else {
                    var qs = querystring.stringify(
                        {
                            redirect_uri : 'http://' + hostname + '/login',
                            client_id    : fb_app_id,
                            client_secret: fb_app_secret,
                            code         : info.query.code
                        }
                    );
                    var token_url = "https://graph.facebook.com/oauth/access_token?" + qs;
                    http_request(function(qs) {
                        var qs_obj              = querystring.parse(qs);
                        fb_access_token         = qs_obj.access_token;
                        fb_access_token_expires = qs_obj.expires;
                        res.writeHead(200, {
                          'Content-Type': 'text/html'
                        });
                        res.end('yer ready to go: ' + fb_access_token, 'utf8');
                    } , token_url);
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

var map = {
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

