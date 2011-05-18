var URL = require('url'),
    http = require('http'),
    https = require('https'),
    cacheTimeout = 600 * 1000; // 600 seconds in milliseconds (FB only allows 600 requests in 600 seconds)

var remote_facebook = function(args) {
    var _this      = this;
    this.messenger = args.messenger;
    this.redis     = args.redis;

    /*
     * list of FB friends
     */
    this.messenger.on('facebook.getFriends', function(message) {
        var from = message.uid;
        _this.messenger.get(from, 'facebook.access_token', function(token) {
            _this.getFB('friends', function(json_friends) {
                var friends = JSON.parse(json_friends), key = 'facebook.friends.' + from;
                _this.messenger.sendMessage(from, { event: 'facebook.friends', friends: friends });
                friends.data.forEach(function(friend) {
                    _this.redis.sadd(key, JSON.stringify(friend));
                });
            }, token);
        });
    });

    this.messenger.on('facebook.getAllStatus', function(message) {
        var from = message.uid;
        _this.redis.smembers('facebook.friends.' + from, function(error, friends) {
            friends.forEach(function(friend) {
                var fobj = JSON.parse(friend);
                _this.messenger.emit('facebook.getStatus', { uid: from, id: fobj.id, first: message.first });
            });
        });
    });

    /*
     * check cache - if not there hit FB
     */
    this.messenger.on('facebook.getStatus', function(message) {
        var from = message.uid, now = new Date().getTime(),
            statusKey = 'facebook.status.' + message.id;
            console.log('statusKey: ' + statusKey);
        // First check cache
        _this.redis.hgetall(statusKey, function(error, statusObj) {
            try {
                statusObj = JSON.parse(statusObj);
            } catch(e) {
                statusObj = false;
            }
            if (!statusObj || !statusObj.timestamp || ((parseInt(statusObj.timestamp, 10) + cacheTimeout) < now)) {
                _this.redis.hset(statusKey, 'timestamp', now);
                _this.messenger.get(from, 'facebook.access_token', function(token) {
                    _this.getFB('feed', function(json_status) {
                        var status = JSON.parse(json_status);
                        if (status.data) {
                            for (var i = 0; i < status.data.length; i++) {
                                var stat = status.data[i];
                                if (stat.type === 'status') {
                                    if ((statusObj.status && (statusObj.status.id != stat.id)) || message.first) {
                                        // cache & send updated status
                                        console.log('STATUS UPDATE ' + message.id);
                                        _this.redis.hset(statusKey, 'status', JSON.stringify(stat));
                                        _this.messenger.sendMessage(from, { event: 'facebook.status', status: stat, uid: message.id, first: message.first });
                                    }
                                    break;
                                }
                            }
                        }
                    }, token, message.id);
                });
            } else {
                if (message.first) {
                    // return cached version for first time only
                    if (statusObj.status) {
                        _this.messenger.sendMessage(from, { event: 'facebook.status', status: JSON.parse(statusObj.status), uid: message.id, first: message.first });
                    }
                }
            }
        });

    });
};

remote_facebook.prototype = {
    http_request: function(cb, url, method, postData) {

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
    },

    getFB: function(what, cb, token, who) {
        if (!who) {
            who = 'me';
        }
        var url = 'https://graph.facebook.com/' + who + '/' + what + '?access_token=' + token;
        this.http_request(cb, url);
    }
};

exports.remote_facebook = remote_facebook;
