var FB_ID       = '166824393371670',
    FB_SECRET   = 'accb35fd6f8c613931f6ab0df9295d37',
    sys         = require('sys'),
    events      = require('events'),
    fs          = require('fs'),
    querystring = require('querystring'),
    hostname    = 'ps48174.dreamhostps.com:8081';
    Connect     = require('connect'),
    RedisStore  = require('connect-redis'),
    redis       = new RedisStore(),
    rclient     = redis.client;

rclient.keys('*', function(error, keys) {
        console.log(keys);
        rclient.del(keys);
        process.exit(0);
});
