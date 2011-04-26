/*jslint plusplus: false */
var SERVER     = 'ps48174.dreamhostps.com',
    PORT       = 8081;

YUI({
    modules: {
        togetherLoader: { fullpath: 'http://' + SERVER + ':' + PORT + '/loader.js' }
    }
}).use('yui', function(Y) {

    var pipeline = YUI({
        win: window,
        doc: document
    });

    // JS pipeline into initial iframe
    Y.Get.script = function() {
        return pipeline.Get.script.apply(pipeline, arguments);
    };

    Y.use('node', 'togetherLoader', function(Y) {

        var keepAliveTimer,
            script = Y.config.doc.createElement('script');

        script.type = 'text/javascript';
        script.src  = 'http://' + SERVER + ':' + PORT + '/socket.io/socket.io.js';
        Y.config.doc.getElementsByTagName('head')[0].appendChild(script);

        Y.on("domready", function() {
            if (Y.config.win.top == Y.config.win.self) {
                new Y.TogetherLoader({ pipeline: pipeline, server: SERVER, port: PORT });
            }
        });

        Y.on('socketHere', function(socket) {
            Y.Global.on('sendMessage', function(message) {
                message.uid = FB_USER_ID;
                socket.send(message);
            });

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
