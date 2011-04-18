/*jslint plusplus: false */
var ydn_key    = 'dj0yJmk9RThaWnp2bU5yQThKJmQ9WVdrOWIySlpUVkZSTm1VbWNHbzlNVFF5TmpFd05UWXkmcz1jb25zdW1lcnNlY3JldCZ4PTZi';
    ydn_secret = '7fd54a9aeed99c98b699a8b326e51f034d8bd375',
    SERVER     = 'ps48174.dreamhostps.com',
    PORT       = 8081;

function GGGetsize() {
    var cccontent = document.getElementById('CCContent');
    var fffooter  = document.getElementById('FFFooter');
    if (cccontent && fffooter) {
        var thesize      = cccontent.offsetHeight
        var footerheight = fffooter.offsetHeight;
        console.log('footer height: ' + footerheight);
        console.log('thesize height: ' + thesize);
        if(thesize > 0 && footerheight > 0) {
            document.getElementsByTagName('body')[0].style.maxHeight = thesize + footerheight + 'px';
            cccontent.className = 'FFForcontent';
        } else {
            setTimeout("GGGetsize()", 10);
        }
    }
}

YUI({ filter: '' }).use('yui', function (Y) {

    var pipeline = YUI({
        win: window,
        doc: document
    });

    Y.Get.script = function() {
        return pipeline.Get.script.apply(pipeline, arguments);
    };

    Y.use('tabview', 
        'dd-plugin', 
        'datatable', 
        'json', 
        'selector-css3', 
        'node-event-simulate', 
        'overlay', 
        'async-queue', 
        'cookie',
        'yql',
        'gallery-oauth',
        function(Y) {

        var body = Y.one('body'), socket, TRACKER_QUEUE, TRACKER_CURSOR,
            cookie_extra = { domain: 'yahoo.com', path: '/' },
            TRACKER_EVENTS = [
            'click',
            'dblclick',
            'mousedown',
            'mouseup',
            'mouseover',
            'mousemove',
            'mouseout',
            'keyup',
            'keydown',
            'keypress',
            'blur',
            'change',
            'focus',
            'resize',
            'scroll',
            'select'
        ], TRACKER_INDEX, TRACKER_NAME, keepAliveTimer,
        script = Y.config.doc.createElement('script');

        script.type = 'text/javascript';
        script.src  = 'http://' + SERVER + ':' + PORT + '/socket.io/socket.io.js';
        Y.config.doc.getElementsByTagName('head')[0].appendChild(script);
        Y.on("domready", GGGetsize);
        Y.on("domready", function() {
            if (Y.config.win.top == Y.config.win.self) {
                Y.one('body').append('<div id="FFFooter"><div id="footpanel"><ul id="mainpanel"></ul></div></div>');
                Y.one('#mainpanel').append('<li><a href="http://' + SERVER + ':' + PORT + '" class="home">Together</a></li>');
            }
        });

        // Wait for socket.io to show up
        (function getSocket() {
            var timer;
            function checkForSocket() {
                if (typeof(Y.config.win.io) === 'object') {
                    timer.cancel();
                    socket = new Y.config.win.io.Socket(SERVER, { port: PORT });
                    socket.connect();
                    Y.fire('socketHere');
                }
            }
            // bah not here yet - wait around I guess
            timer = Y.later(100, Y, checkForSocket, [], true);
        })();

        function getCSSTo(element) {
            var count = 0, siblings, sibling, i;

            if (!element) {
                return null;
            }

            if (element === Y.config.win) {
                return 'window';
            }

            if (element === Y.config.doc) {
                return 'document';
            }

            if (element === Y.config.doc.body) {
                return '';
            }

            try {
                if (!element.parentNode) {
                    return null;
                }
            } catch(e) {
                return null;
            }

            if (element.id && !element.id.match(/^yui_/)) {
                return ' #' + element.id;
            }

            siblings = element.parentNode.childNodes;
            for (i = 0; i < siblings.length; i++) {
                sibling = siblings[i];
                if (sibling.tagName) { count++; }
                if (sibling === element) {
                    return getCSSTo(element.parentNode) + ' ' + element.tagName+':'+'nth-child(' + count + ')';
                }
            }

            return null;
        }

        function makeURL() {
            var str = Y.config.win.location.protocol + '//' + Y.config.win.location.hostname;
            if (Y.config.win.location.port) {
                str += ':' + Y.config.win.location.port;
            }
            str += Y.config.win.location.pathname;
            return str;
        }

        var URL = makeURL(),
            keys = [
            // Mouse Events
            { key: 'altKey' },
            { key: 'bubbles' },
            { key: 'button' },
            { key: 'cancelable'},
            { key: 'clientX'},
            { key: 'clientY'},
            { key: 'ctrlKey'},
            { key: 'detail'},
            { key: 'eventPhase'},
            { key: 'isChar' },
            { key: 'isTrusted' },
            { key: 'layerX' },
            { key: 'layerY' },
            { key: 'metaKey' },
            { key: 'originalTarget', func: getCSSTo  },
            { key: 'pageX' },
            { key: 'pageY'},
            { key: 'rangeParent', func: getCSSTo },
            { key: 'relatedTarget', func: getCSSTo },
            { key: 'screenX'},
            { key: 'screenY'},
            { key: 'shiftKey' },
            { key: 'target', func: getCSSTo },
            { key: 'timeStamp', func: function() { return new Date().getTime(); } },
            { key: 'type'},
            { key: 'view', func: getCSSTo },
            { key: 'which'},

            // Key Events
            { key: 'keyCode'},
            { key: 'charCode'}
        ], def_func = function(val) { return val; },
            handleEvent = function(e) {
                var ev = {}, i, key, func, target, msg, cfg, request, html, iframe;
                try {
                    for (i = 0; i < keys.length; i++) {
                        key = keys[i].key;
                        func = keys[i].func || def_func;
                        ev[key] = func(e[key]);
                    }

                    target = new Y.Node(e.target);
                    ev.winHeight    = target.get('winHeight');
                    ev.winWidth     = target.get('winWidth');
                    ev.host         = URL;

                    if (ev.type === 'scroll') {
                        ev.scrollTop  = target.get('scrollTop');
                        ev.scrollLeft = target.get('scrollLeft');
                    }

                    if (ev.type === 'change') {
                        if (e.target.selectedIndex) {
                            ev.selectedIndex = e.target.selectedIndex;
                        }
                    }

                    if (ev.type === 'click') {
                        if (target.get('href')) {
                            target.set('href', keepGoing(target.get('href'), 'capture'));
                            Y.log('TARGET NOW: ' + target.get('href'));
                       }
                    }

                    /*
                    if (ev.type.match(/^key/)) {
                        Y.log(ev.type);
                        Y.log(ev);
                        Y.log(e);
                        Y.log('-----');
                    }

                    Y.log('sending:');
                    Y.log(ev);
                    */
                    socket.send({ event: 'event', data: ev, name: Y.TrackStarted.name });

                } catch(E) {
                    Y.log('STRINGIFY FAILED!');
                    Y.log(E);
                }
            };

        function setUpEvents(func) {
            var prefix = '';
            if (Y.config.win.attachEvent) {
                prefix = 'on';
            }
            Y.Array.each(TRACKER_EVENTS, function(event) {
                func.call(Y.config.win, prefix + event, handleEvent, true);
            });
        }

        function sizeShim() {
            var h = body.get('docHeight'), w = body.get('docWidth'), shim = Y.one('#TRACKER_SHIM');
            shim.setStyles({
                height: h + 'px',
                width: w + 'px'
            });
        }

        function stopFollow() {
            Y.one('#TRACKER_SHIM').setStyle('display', 'none');
        }

        function startFollow(name, index) {
            if (!Y.one('#TRACKER_SHIM')) {
                shim = Y.Node.create('<div id="TRACKER_SHIM"><img style="opacity: 1; z-index: 999009; position: absolute" id="TRACKER_CURSOR" src="http://' + SERVER + ':' + PORT + '/pointer_cursor.png"></img></div>');

                // IE < 9 doesn't like 'transparent' shim bg color...
                //  'red' is just a dummy since opacity is 0
                bcolor = 'transparent';
                if (Y.UA.ie > 0 && Y.UA.ie < 9) {
                    bcolor = 'red';
                }

                shim.setStyles({
                    opacity:         '1',
                    filter:         'alpha(opacity=0)',                  // second!
                    position:        'absolute',
                    zIndex:          '20',
                    overflow:        'hidden',
                    backgroundColor: bcolor,
                    display:         'none',
                    height:          '5px',
                    width:           '5px',
                    top:             '0px',
                    left:            '0px',
                    borderWidth:     '0 0 0 2px !important'
                });
                Y.on('window:resize', sizeShim);
                body.append(shim);
                TRACKER_CURSOR = Y.one('#TRACKER_CURSOR');
            }

            if (!TRACKER_QUEUE) {
                TRACKER_QUEUE = new Y.AsyncQueue();
                TRACKER_QUEUE.on('complete', stopFollow);
            } else {
                TRACKER_QUEUE.stop();
            }

            sizeShim();
            shim.setStyle('display', 'block');

            TRACKER_NAME = name;

            socket.send({ event: 'startFollow', name: name, index: index  });
        }

       function doEvent(event) {
            var val, target = Y.Node.one(event.target);

            try {
            if (event.target === 'window') {
                target = Y.config.win;
            }

            if (!target) {
                Y.log('Cannot find target: ' + event.target);
                return;
            }

            event.target = target;
            if (Y.Array.indexOf(TRACKER_EVENTS, event.type) >= 0) {
                if (event.relatedTarget) {
                    event.relatedTarget = Y.Node.getDOMNode(Y.Node.one(event.relatedTarget));
                } else {
                    event.relatedTarget = null;
                }
                if (event.originalTarget) {
                    event.originalTarget = Y.Node.getDOMNode(Y.Node.one(event.originalTarget));
                } else {
                    event.originalTarget = null;
                }
                if (event.type === 'mousemove') {
                    TRACKER_CURSOR.setStyles({
                        left: event.clientX + 'px',
                        top:  event.clientY + 'px'
                    });
                }
                if (event.type === 'keypress') {

                    if (!Y.UA.gecko) {
                        val = target.get('value');
                        if (!val) {
                            val = '';
                        }

                        val += String.fromCharCode(event.keyCode || event.charCode);
                        target.set('value', val);
                    } 

                    if (!keyFunc(event)) {
                        return;
                    }
                }
                if (event.type === 'scroll') {
                    target.set('scrollTop', event.scrollTop);
                    target.set('scrollLeft', event.scrollLeft);
                }
                if (event.type === 'blur') {
                    target.blur();
                }
                if (event.type === 'focus') {
                    target.focus();
                }
                if (event.type === 'select') {
                    target.select();
                }
                if (event.type === 'change' && event.selectedIndex) {
                    Y.log('seeting selected index to: ' + event.selectedIndex);
                    Y.log(target);
                    target.set('selectedIndex', event.selectedIndex);
                }
                if (event.type === 'click') {
                    if (target.get('href')) {
                        target.set('href', keepGoing(target.get('href'), 'follow'));
                        Y.log('TARGET NOW: ' + target.get('href'));
                    }
                }
                /*
                Y.config.doc.body.clientHeight= event.winHeight;
                Y.config.doc.body.clientWidth =event.winWidth;
                Y.config.win.resizeTo(event.winWidth, event.winHeight);

                Y.log(event.type);
                Y.log(event);
                */

                if (target === Y.config.win) {
                    target = Y.one('document');//Y.config.doc.body;
                }
                target.simulate(event.type, event);
            } else {
                Y.error('I do not know this event: ' + event.type);
            }

            } catch(e) {
                Y.log('something wrong simulating: ' + e);
            }

        }

        Y.on('socketHere', function() {
            var obj, tname, taction, shim, bcolor, cookie_obj, tindex;

            socket.on('message', function(message) {
                var event = message.data, i = 0, timeout = 0, event_obj, url, ds;
                if (message.event === 'events') {
                    if (Y.TrackerViewOnly) {
                        ds = Y.TrackerEventView.get('recordset');
                        // Can't add them all at once cuz we gotta de-JSON them - bummer
                        for (; i < event.length; i++) {
                            event_obj  = Y.JSON.parse(event[i]);
                            url = event_obj.host;
                            ds.add(event_obj);
                        }
                        Y.TrackerEventView.set('recordset', ds);
                        Y.TrackerEventView.set('caption', message.name + ': ' + url);
                    } else {
                        Y.log('adding ' + event.length + ' events to queue!');
                        for (; i < event.length; i++) {
                            event_obj       = Y.JSON.parse(event[i]);
                            event_obj.INDEX = message.start + i;
                            TRACKER_INDEX   = event_obj.INDEX;
                            url             = event_obj.host;
                            Y.Cookie.set("TRACKER_COOKIE", Y.JSON.stringify( { index: event_obj.INDEX, name: TRACKER_NAME, action: 'follow' } ), cookie_extra);

                            if (url !== URL) {
                                Y.log('moving to: ' + url + '?tracker_name=' + message.name + '&tracker_action=follow&tracker_index=' + event_obj.INDEX);
                                Y.config.win.location = url + '?tracker_name=' + encodeURIComponent(message.name) + '&tracker_action=follow&tracker_index=' + event_obj.INDEX;
                            }
                            if (i > 0) {
                                timeout = event_obj.timeStamp - Y.JSON.parse(event[i-1]).timeStamp;
                            }
                            if (event.length === 1) {
                                doEvent(event_obj);
                            } else {
                                TRACKER_QUEUE.add({ fn: doEvent, args: [ event_obj ], timeout: timeout });
                            }
                        }
                        TRACKER_QUEUE.run();
                    }
                } else if (message.event === 'info') {
                    ds = Y.TrackerDatatable.get('recordset');
                    ds.add(
                            { 
                                Name:   message.name, 
                                Events: message.length, 
                                URL:    '<a href="' + message.url + '?tracker_name=' + message.name + '&tracker_action=follow">' + message.url + '</a>', 
                                View:   '<button name="' + message.name + '" action="startFollow">View</button>',
                                Delete: '<button name="' + message.name + '" action="capDelete">Delete</button>'
                            }
                    );
                    Y.TrackerDatatable.set('recordset', ds);
                } else if (message.event === 'friend') {
                    console.log('FRIEND: ');
                    console.log(message);
                }
            });
        });

        // Deal with UI
        Y.on('socketHere', function() {
            // Send alive messages
            var LOOP = 30;  // check in every X  seconds

            // Only send keepAlives for very top window
            if (Y.config.win.top == Y.config.win.self) {
                socket.send({ event: 'iamHere', uid: FB_USER_ID, href: Y.config.win.location.href, title: Y.config.doc.title}); 
//                Y.on('window:resize', );
                /*
                keepAliveTimer = Y.later(LOOP * 1000, this, 
                    function () { 
                        socket.send({ event: 'keepAlive', uid: FB_USER_ID, href: Y.config.win.location.href, title: Y.config.doc.title}); 
                    }, {}, true
                );
                */
            }
        });

        var UI = '\
<div id="TRACKER_UI" class="yui3-skin-sam" style="background-color: #EDF5FF"> \
    <ul> \
        <li ><a href="#TRACKER_DIV_CAPTURE">Capture</a></li> \
        <li><a href="#TRACKER_DIV_DATATABLE">Follow</a></li> \
        <li><a href="#TRACKER_DIV_EVENT_DATATABLE">Events View</a></li> \
    </ul> \
    <div> \
        <div id="TRACKER_DIV_CAPTURE"><label for="TRACKER_DIV_CAPTURE_NAME">Name</label><input type="textbox" id="TRACKER_DIV_CAPTURE_NAME" name="TRACKER_DIV_CAPTURE_NAME">&nbsp;<button type="button" id="TRACKER_DIV_CAPTURE_BUTTON"></button></div> \
        <div id="TRACKER_DIV_DATATABLE"       style="height: 200px; overflow: scroll"></div> \
        <div id="TRACKER_DIV_EVENT_DATATABLE" style="height: 200px; overflow: scroll"></div> \
    </div> \
</div> \
', tabView = new Y.TabView({ srcNode: Y.Node.create(UI) });

    });
});
