var urlparser = require('url'),
    fs = require('fs'),
    qs = require('querystring');

var authCheck = function(rclient, hostname) {
    return function(req, res, next) {
        var url = req.urlp = urlparser.parse(req.url, true);

        console.log('AUTH PATH:');
        console.log(url);

        // Auth callback
        if (url.pathname == "/fbCB" || url.pathname.match(/^\/auth\//)) {
            console.log('Auth CALLBACK continuing...');
            next();
            return;
        } else if (url.pathname == "/logout" ) {
            req.session.destroy();
            res.end('see ya later!');
            return;
        } if (req.session && req.session.user) {
            next(); // stop here and pass to the next onion ring of connect
            return;
        } else if (url.pathname == '/login') {
            var d = '';
            req.on('data', function(chunk) {
                d += chunk;
            });
            req.on('end', function() {
                var obj = qs.parse(d);
                console.log('posted to login');
                console.log(obj);
                rclient.hgetall(obj.user, function(error, user_obj) {
                    if (user_obj && user_obj.password === obj.pass) {
                        req.session.user = obj.user;
//                        req.session.auth = true;
                        res.end('thanks for signing in - go surf the web!');
                        return;
                    } else {
                        fail('username/password incorrect');
                    }
                });
            });
        } else if (url.pathname == '/register') {
            var d = '';
            req.on('data', function(chunk) {
                d += chunk;
            });
            req.on('end', function() {
                var obj = qs.parse(d);
                rclient.keys(obj.user, function(error, key) {
                    if (key.length) {
                        fail('username already exists');
                    } else {
                        rclient.hset(obj.user, 'password', obj.pass);
                        fail();
                    }

                });
            });
        }/* else if (url.pathname !== '/start/login.html' && (!req.session || !req.session.user)) {
            console.log(url.pathname);
            res.writeHead(200, { 'Content-type': 'application/javascript' });
            res.end('top.location.href="http://' + hostname + '/start/login.html";');
            return;
        }*/ else {
            console.log('FAIL: ' + url.pathame);
            fail('ya gotta log in...');
        }

        function fail(msg) {
            // ####
            // User needs to log in...
            res.writeHead(403);
            var login_page = fs.createReadStream('../static/start/login.html');
            login_page.resume();
            login_page.pipe(res, { end: false });
            res.end(msg || '');
            return;
        }
    };
}

exports.authCheck = authCheck;
