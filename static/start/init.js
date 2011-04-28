/*jslint plusplus: false */
var SERVER     = 'ps48174.dreamhostps.com',
    PORT       = 8081,
    yconfig = { 
        gallery: 'gallery-2011.03.11-23-49',
/*
        groups: {
            'notify' : {
                base : './lib/yui3-gallery/src/gallery-notify/',
                modules : {
                    'gallery-notify' : {
                        path : 'js/notify.js',
                        requires : ['growl-skin','anim','substitute','widget','widget-parent','widget-child','gallery-timer','event-mouseenter'],
                        skinable : true
                    },
                    'growl-skin' : {
                        path : 'assets/skins/growl/notify.css',
                        type : 'css'
                    }
                }
            },
            'timer' : {
                base : './lib/yui3-gallery/src/gallery-timer/',
                modules : {
                    'gallery-timer' : {
                        path : 'js/timer.js',
                        requires : ['base','event-custom']
                    }
                }
            }
    },
*/
    modules: {
        togetherLoader: { fullpath: 'http://' + SERVER + ':' + PORT + '/start/loader.js' },
        togetherNotify: { fullpath: 'http://' + SERVER + ':' + PORT + '/ui/notify.js', requires: [ 'event-custom-base', 'gallery-notify', 'gallery-dialog' ] }
    }
};

YUI(yconfig).use('yui', function(Y) {

    var pipeline = YUI({
        win: window,
        doc: document
    });

    // JS pipeline into initial iframe
    Y.Get.script = function() {
        return pipeline.Get.script.apply(pipeline, arguments);
    };

    Y.use('node', 'togetherLoader', 'togetherNotify', function(Y) {

        var keepAliveTimer,
            script = Y.config.doc.createElement('script');

        script.type = 'text/javascript';
        script.src  = 'http://' + SERVER + ':' + PORT + '/socket.io/socket.io.js';
        Y.config.doc.getElementsByTagName('head')[0].appendChild(script);

        Y.on("domready", function() {
            if (Y.config.win.top == Y.config.win.self) {
                new Y.TogetherLoader({ pipeline: pipeline, server: SERVER, port: PORT });
                new Y.TogetherNotify();
            }
        });

        Y.on('socketHere', function(socket) {
            Y.Global.on('sendMessage', function(message) {
                message.uid = FB_USER_ID;
                socket.send(message);
            });

            Y.Global.on('join', function(message) {
                message.event = 'join';
                Y.Global.fire('sendMessage', message);
            })

            Y.Global.on('invite', function(message) {
                message.event = 'invite';
                Y.Global.fire('sendMessage', message);
            })

            socket.on('message', function(message) {
                Y.Global.fire(message.event, message);
            });
        });

        // Wait for socket.io to show up
        (function getSocket() {
            var timer, socket;
            function checkForSocket() {
                if (typeof(Y.config.win.io) === 'object') {
                    timer.cancel();
                    socket = new Y.config.win.io.Socket(SERVER, { port: PORT });
                    socket.connect();
                    socket.on('connect', function() {
                        Y.fire('socketHere', socket);
                    });
                }
            }
                // bah not here yet - wait around I guess
            timer = Y.later(100, Y, checkForSocket, [], true);
        })();
    });
});
