/*jslint plusplus: false */
var ydn_key    = 'dj0yJmk9RThaWnp2bU5yQThKJmQ9WVdrOWIySlpUVkZSTm1VbWNHbzlNVFF5TmpFd05UWXkmcz1jb25zdW1lcnNlY3JldCZ4PTZi';
    ydn_secret = '7fd54a9aeed99c98b699a8b326e51f034d8bd375',
    SERVER     = 'ps48174.dreamhostps.com',
    cookie     = 'fbs_166824393371670',
    PORT       = 8081;

function GGGetsize() {
    if(((thesize=document.getElementById('CCContent').offsetHeight) > 0)&&((footerheight=document.getElementById('FFFooter').offsetHeight) > 0)) {
            document.getElementsByTagName('body')[0].style.maxHeight = thesize+footerheight+'px';
            document.getElementById('CCContent').className='FFForcontent';

    } else {
        setTimeout("GGGetsize()",10);
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
        ], TRACKER_INDEX, TRACKER_NAME,
        script = Y.config.doc.createElement('script');

        script.type = 'text/javascript';
        script.src  = 'http://' + SERVER + ':' + PORT + '/socket.io/socket.io.js';
        Y.config.doc.getElementsByTagName('head')[0].appendChild(script);
        Y.on("domready", GGGetsize);
        Y.on("domready", function() {
            if (Y.config.win.top == Y.config.win.self) {
                Y.one('body').append('<div id="FFFooter"><p>&nbsp;</p></div>');
            }
        });

        var cookie_value = Y.Cookie.get(cookie);
        console.log(cookie_value);
/*
        Y.oAuth.ready(function() {
            Y.YQL('select * from social.contacts where guid=me;', function(r) {
                //Do something here.
                console.error(r);
                console.log('RESULT: ' + r.query); //The result
                console.error(r.error); //The error message
            }), 
            {
                key: ydn_key, //get key and secret from https://developer.apps.yahoo.com/projects
                secret: ydn_secret, //get key and secret from https://developer.apps.yahoo.com/projects
                base: '://query.yahooapis.com/v1/yql?'
            }
        });
*/
        
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

        function trackerUI() {
            setUpUI();
            var button = Y.one('#TRACKER_DIV_CAPTURE_BUTTON');

            if (Y.TrackStarted) {
                button.set('innerHTML', 'STOP tracking');
            } else {
                button.set('innerHTML', 'START tracking');
            }

            Y.TrackOverlay.show();
        }

        function fetchInfo() {
            var ds = Y.TrackerDatatable.get('recordset');
            Y.detach('delete|click');
            ds.empty();
            Y.TrackerDatatable.set('recordset', ds);
            socket.send({ event: 'getInfo' });
        }

        /*
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
',*/ 

        function setUpUI() {
            if (!Y.ChatOverlay) {
                Y.ChatOverlay = new Y.Overlay({
                    centered: true,
                    headerContent: '<center><div style="padding-top: 10px; border-top: 2px solid black; background-color: #EDF5FF">Chat</div></center>',
                    footerContent: '<center><div style="border-bottom: 2px solid black; background-color: #EDF5FF"><button type="button" id="TRACKER_CHAT_CANCEL">Close</button></div></center>',
                    bodyContent: '<textarea rows="10" cols="50" id="TRACKER_CHAT"></textarea>'
                });

                Y.ChatOverlay.after('render', function(e) {
                    //Get the bounding box node and plug
                    this.get('boundingBox').plug(Y.Plugin.Drag, {
                        //Set the handle to the header element.
                        handles: ['.yui3-widget-hd', '.yui3-widget-ft']
                    });

                    this.get('boundingBox').setStyle('zIndex', 9999);
                });

                Y.ChatOverlay.render();
                Y.ChatOverlay.hide();

                Y.one('#TRACKER_CHAT_CANCEL').on('click', function(e) { Y.ChatOverlay.hide(); } );
            }

            if (!Y.TrackOverlay) {
                tabView.render();
                Y.TrackOverlay = new Y.Overlay({
                    centered: true,
                    width: '50em',
                    headerContent: '<center><div style="padding-top: 10px; border-top: 2px solid black; background-color: #EDF5FF">Tracker</div></center>',
                    footerContent: '<center><div style="border-bottom: 2px solid black; background-color: #EDF5FF"><button type="button" id="TRACKER_DIV_CANCEL">Cancel</button></div></center>',
                    srcNode: Y.Node.one('#TRACKER_UI').get('parentNode')
                });

                Y.TrackOverlay.after('render', function(e) {
                    //Get the bounding box node and plug
                    this.get('boundingBox').plug(Y.Plugin.Drag, {
                        //Set the handle to the header element.
                        handles: ['.yui3-widget-hd', '.yui3-widget-ft']
                    });

                    this.get('boundingBox').setStyle('zIndex', 9999);
                });


                Y.TrackOverlay.render();

                Y.TrackerDatatable = new Y.DataTable.Base({
                    columnset: [ { key:  'Name', sortable: true }, { key: 'Events', sortable: true }, { key: 'URL', sortable: true }, 'View', 'Delete' ],
                    plugins: [ Y.Plugin.DataTableSort ],
                    caption: Y.Node.create('<button type="button" id="TRACKER_DIV_INFO_BUTTON">Refresh</button></div>')
                }).render('#TRACKER_DIV_DATATABLE');

                Y.TrackerEventView = new Y.DataTable.Base({
                    columnset: [ { key: 'timeStamp', sortable: true }, { key: 'type', sortable: true }, { key: 'target' } ],
                    plugins: [ Y.Plugin.DataTableSort ]
                }).render('#TRACKER_DIV_EVENT_DATATABLE');
                    Y.one('#TRACKER_DIV_EVENT_DATATABLE .yui3-datatable-data').setStyles({ height: '200px', overflow: 'scroll' });

                // Handle delete buttons
                Y.delegate('click', 
                        function(e) { 
                            var name = e.currentTarget.getAttribute("name"),
                                action = e.currentTarget.getAttribute("action"), ds;

                            if (action === 'capDelete') {
                                socket.send({ event: action, name: name });
                                fetchInfo();
                            } else if (action === 'startFollow') {
                                Y.TrackerViewOnly = true;
                                ds = Y.TrackerEventView.get('recordset');
                                ds.empty();
                                Y.TrackerEventView.set('recordset', ds);
                                Y.TrackerEventView.set('caption', '');

                                socket.send({ event: action, name: name, index: 0 });
                            }
                        },
                    '#TRACKER_DIV_DATATABLE', 'button');

                // Start the process on these monkeys
                socket.send({ event: 'getCaptures' });
                socket.send({ event: 'getInfo' });

                Y.one('#TRACKER_DIV_CANCEL').on('click', function(e) { Y.TrackOverlay.hide(); } );
                Y.one('#TRACKER_DIV_CAPTURE_NAME').on('focus', function(e) { e.currentTarget.set('value', ''); } );

                Y.one('#TRACKER_DIV_CAPTURE_BUTTON').on('click', function(e) {
                    Y.TrackOverlay.hide();
                    if (Y.TrackStarted) {
                        func = Y.config.win.removeEventListener;
                        if (!func) {
                            func = Y.config.win.removeEvent;
                        }
                        socket.send({ event: 'stopCapture', name: Y.TrackStarted.name  });
                        Y.Cookie.remove("TRACKER_COOKIE", cookie_extra);
                        Y.TrackStarted = null;
                    } else {
                        func = Y.config.win.addEventListener;
                        if (!func) {
                            func = Y.config.win.attachEvent;
                        }
                        name = Y.one('#TRACKER_DIV_CAPTURE_NAME').get('value');
                        if (!name) {
                            Y.one('#TRACKER_DIV_CAPTURE_NAME').set('value', 'You must specify a name!!');
                            Y.TrackOverlay.show();
                        } else {
                            Y.TrackStarted  = { startTime: new Date(), numEvents: 0, name: name };
                            Y.TrackOverlay.set('headerContent', '');
                            socket.send({ event: 'startCapture', name: name  });
                            TRACKER_NAME = name;
                            Y.Cookie.set("TRACKER_COOKIE", Y.JSON.stringify( { name: TRACKER_NAME, action: 'capture' } ), cookie_extra); 
                        }
                    }

                    setUpEvents(func);
                });

                Y.one('#TRACKER_DIV_INFO_BUTTON').on('click', function(e) {
                    fetchInfo();
                });
            }

            Y.TrackOverlay.hide();
        }

        function stripOfTrackerQS() {
            var search = Y.config.win.location.search.substring(1),
                pieces = search.split('&'), tdelay = 15, tindex = 0,
                tname = '', taction = '', pair, i, qs = '';

            for (i = 0; i < pieces.length; i++) {
                pair = pieces[i].split('=');
                if (pair[0] === 'tracker_name') {
                    tname = decodeURIComponent(pair[1]);
                } else if (pair[0] === 'tracker_action') {
                    taction = decodeURIComponent(pair[1]);
                } else if (pair[0] === 'tracker_delay') {
                    tdelay = decodeURIComponent(pair[1]);
                } else if (pair[0] === 'tracker_index') {
                    tindex = decodeURIComponent(pair[1]);
                } else {
                    qs += pair[0] + '=' + pair[1];
                }
            }

            return { name: tname, action: taction, delay: tdelay, index: tindex, cleanQS: qs };

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
            Y.Cookie.remove("TRACKER_COOKIE", cookie_extra);
        }

        function toggleFollow() {
            if (TRACKER_QUEUE) {
                if (TRACKER_QUEUE.isRunning()) {
                    TRACKER_QUEUE.pause();
                } else {
                    TRACKER_QUEUE.run();
                }
            }

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
//                    '-ms-filter' :  'progid:DXImageTransform.Microsoft.Alpha(Opacity=0)', // first!
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

            Y.Cookie.set("TRACKER_COOKIE", Y.JSON.stringify( { index: index, name: TRACKER_NAME, action: 'follow' } ), cookie_extra);
            socket.send({ event: 'startFollow', name: name, index: index  });
        }

        var keyFunc = function(e) {
            var name, func;
            var stop = false;

            /*
            Y.log('checking key event');
            Y.log(e);
            */

            // Bring up Tracker UI
            if ((e.keyCode === 197 || e.charCode === 197) && e.shiftKey && e.altKey) {  // Shift-Option-A on Mac...
                trackerUI();
                stop = true;
            }

            // Bring up chat UI
            if ((e.keyCode === 199 || e.charCode === 199) && e.shiftKey && e.altKey) {  // Shift-Option-C on Mac...
                setUpUI();
                Y.ChatOverlay.show();
                Y.one('#TRACKER_CHAT').focus();
                stop = true;
            }

            // Pause/unpause follow
            if ((e.keyCode === 8719 || e.charCode === 8719) && e.shiftKey && e.altKey) {  // Shift-Option-P on Mac...
                toggleFollow();
                stop = true;
            }

            // Stop follow
            if ((e.keyCode === 205 || e.charCode === 205) && e.shiftKey && e.altKey) {  // Shift-Option-S on Mac...
                stopFollow();
                stop = true;
            }

            if (stop) {
                if (e.stopPropagation) {
                    e.stopPropagation();
                } else {
                    e.cancelBubble = true;
                }
                return false;
            }

            return true;
        };

        function keepGoing(href, what) {
            var add = '?';
            if (href.match(/\?/)) {
                add = '&';
            }

            href += add + 'tracker_name=' + TRACKER_NAME + '&tracker_index=' + TRACKER_INDEX + '&tracker_action=' + what;

            return href;
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
            var obj, tname, taction, shim, bcolor,
                cookie = Y.Cookie.get('TRACKER_COOKIE'), cookie_obj, tindex;

            if (cookie) {
                cookie_obj = Y.JSON.parse(cookie);
            }

            //if (Y.config.win.location.search || cookie_obj) {
            if (Y.config.win.location.search) {
                obj = stripOfTrackerQS(); tname = obj.name; taction = obj.action; tindex = obj.index;

                // cookie wins?
                /*
                if (cookie_obj) {
                    tname   = cookie_obj.name;
                    taction = cookie_obj.action;
                    tindex  = cookie_obj.index;
                }
                */

                if (tname && taction) {
                    if (taction === 'capture') {
                        Y.later(obj.delay, Y, function() {
                            Y.TrackStarted  = { startTime: new Date(), numEvents: 0, name: tname };
                            socket.send({ event: 'startCapture', name: tname  });
                            TRACKER_NAME = tname;
                            Y.Cookie.set("TRACKER_COOKIE", Y.JSON.stringify( { name: TRACKER_NAME, action: 'capture' } ), cookie_extra);
                            var ff = Y.config.win.addEventListener;
                            if (!ff) {
                                ff = Y.config.win.attachEvent;
                            }
                            setUpEvents(Y.config.win.addEventListener);
                            Y.one('#TRACKER_DIV_CAPTURE_BUTTON').set('innerHTML', 'STOP tracking');
                            Y.one('#TRACKER_DIV_CAPTURE_NAME').set('value', tname);
                            Y.TrackOverlay.hide();

                            shim = Y.one('#TRACKER_SHIM');
                            if (shim) {
                                shim.setStyle('display', 'none');
                            }
                        });
                    } else if (taction === 'follow') {
                        Y.later(obj.delay, Y, function() {
                            Y.FollowStarted  = { name: tname, index: tindex };
                            startFollow(tname, tindex);
                        });
                    }
                }
            }

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
                }
            });

            Y.on('key', keyFunc, Y.one('document'));
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
