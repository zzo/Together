var urlparser   = require('url'),
    auth        = require('connect-auth'),
    OAuth       = require('oauth').OAuth,
    twitter     = function(args) {
    return function(req, res, next) {
        var url = req.urlp = urlparser.parse(req.url, true);
        if (url.pathname == "/auth/twitter") {
            req.authenticate(['twitter'], function(error, authenticated) {
                if(authenticated) {
                    var oa = new OAuth(
                        "http://twitter.com/oauth/request_token",
                        "http://twitter.com/oauth/access_token",
                        args.key, // twitter consumer key
                        args.secret,  // twitter consumer secret
                        "1.0",
                        null,
                        "HMAC-SHA1"
                    );

                    args.rclient.hset(req.session.user, 'twitter.oath_token', req.getAuthDetails()["twitter_oauth_token"]);
                    args.rclient.hset(req.session.user, 'twitter.oath_token_secret', req.getAuthDetails()["twitter_oauth_token_secret"]);
                    res.end("<html><h1>Twitter authentication succeeded :) </h1></html>")
                } else {
                    res.end("<html><h1>Twitter authentication failed :( </h1></html>")
                    return;
                }
            });
        } else if (url.pathname == "/twitter" ) {
          res.end('<html>\
              <head>                                             \n\
                <title>Link With Twitter</title> \n\
              </head>                                            \n\
              <body>                                             \n\
                <div id="wrapper">                               \n\
              <div style="float:left;margin-left:5px">       \n\
                <a href="/auth/twitter" style="border:0px">  \n\
                  <img style="border:0px" src="http://apiwiki.twitter.com/f/1242697715/Sign-in-with-Twitter-darker.png"/>\n\
                </a>                                         \n\
              </div>\n\
                </div>                                           \n\
              </body>                                            \n\
            </html>');
        } else if (url.pathname == '/twitter/test') {
            args.rclient.hgetall(req.session.user, function(error, userHash) {

                    var token = userHash['twitter.oath_token'],
                        secret = userHash['twitter.oath_token_secret'],
                        oa = new OAuth(
                            "http://twitter.com/oauth/request_token",
                            "http://twitter.com/oauth/access_token",
                            args.key,     // twitter consumer key
                            args.secret,  // twitter consumer secret
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
                                res.writeHead(200, {'Content-Type': 'text/html'})
                                res.end("<html><h1>Hello! Twitter authenticated user ("+req.getAuthDetails().user.username+")</h1>"+data+ "</html>")
                            }
                    );
            });

        } else {
            next();
        }
    };
};

exports.local_twitter = twitter;
