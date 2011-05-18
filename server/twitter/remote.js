var URL = require('url'),
    http = require('http'),
    OAuth = require('oauth').OAuth,
    cacheTimeout = 0 * 1000; // DISABLE cache for now.... check every minute for new tweets

var remote_twitter = function(args) {
    var _this      = this;
    this.messenger = args.messenger;
    this.redis     = args.redis;
    this.secret    = args.secret;
    this.key       = args.key;

    /*
     * list of FB friends
     */
    this.messenger.on('twitter.getHomeTimeline', function(message) {
        var from = message.uid,
            now = new Date().getTime();
        _this.redis.hgetall('twitter.' + from, function(error, twitterHash) {
            if (!twitterHash || !twitterHash.timestamp || ((parseInt(twitterHash.timestamp, 10) + cacheTimeout) < now)) {
                _this.redis.hgetall(from, function(error, userHash) {
                    var token = userHash['twitter.oath_token'],
                        secret = userHash['twitter.oath_token_secret'],
                        oa = new OAuth(
                            "http://twitter.com/oauth/request_token",
                            "http://twitter.com/oauth/access_token",
                            _this.key,     // twitter consumer key
                            _this.secret,  // twitter consumer secret
                            "1.0",
                            null,
                            "HMAC-SHA1"
                        );

                    oa.getProtectedResource(
                        "http://twitter.com/statuses/home_timeline.json",
                        "GET",
                        token,
                        secret,
                        function (error, data) {
                            _this.redis.hset('twitter.' + from, 'timestamp', now);
                            if (data) {
                                var tweets = JSON.parse(data);
                                if (tweets && tweets[0]) {
                                    _this.redis.hset('twitter.' + from, 'homeTimeline', data);
                                    _this.messenger.sendMessage(from, { event: 'twitter.homeTimeline', tweets: tweets });
                                }
                            }
                        }
                    );
                });
            } else {
                // returned cache'd copy
                _this.messenger.sendMessage(from, { event: 'twitter.homeTimeline', tweets: JSON.parse(twitterHash.homeTimeline) });
            }
        });
    });
};

remote_twitter.prototype = { };

exports.remote_twitter = remote_twitter;
