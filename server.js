/*jslint plusplus: false */

var Connect = require('connect'), server = Connect.createServer(
        Connect.logger() // Log responses to the terminal using Common Log Format.
        ,Connect.static('/home/trostler/server/static') // Serve all static files in the current dir.
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

/*
function sendTrackerEvent(name, index, socketClient) {
    rclient.lindex(name, index, function(error, event) {
        var event_obj = JSON.parse(event);
        if (!event_obj) {
            console.log('BAD EVENT!');
            console.log(event);
            return;
        }
        event_obj.INDEX = index;
        console.log('sending event: ' + event_obj.type + ' : ' + index);
        socketClient.send({ event: 'event', data: event_obj });
        rclient.lindex(name, ++index, function(error, next) {
            var next_event_obj = JSON.parse(next);

            if (next) {
//                console.log('is next in: ' + (next_event_obj.timeStamp - event_obj.timeStamp));
                setTimeout(sendTrackerEvent, next_event_obj.timeStamp - event_obj.timeStamp, name, index, socketClient);
            }
        });
    });
}
*/

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

