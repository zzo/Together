/*jslint plusplus: false */
var SERVER     = 'ps48174.dreamhostps.com',
    PORT       = 8081;

YUI({ filter: '' }).use('yui', function (Y) {

    var pipeline = YUI({
        win: window,
        doc: document
    });

    Y.Get.script = function() {
        return pipeline.Get.script.apply(pipeline, arguments);
    };

    Y.use('json',
        'selector-css3',
        'node-event-simulate',
        'event-delegate',
        'event-mouseenter',
        'overlay',
        'node-menunav',
        'async-queue',
        function(Y) {

        var body = Y.one('body'), socket, TRACKER_QUEUE, TRACKER_CURSOR, friends = [],
            startedTogether = false, friendTable,
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
        ], TRACKER_INDEX, TRACKER_NAME, keepAliveTimer, join_invite_overlay,
        script = Y.config.doc.createElement('script');
        script.type = 'text/javascript';
        script.src  = 'http://' + SERVER + ':' + PORT + '/socket.io/socket.io.js';
        Y.config.doc.getElementsByTagName('head')[0].appendChild(script);

        /*
        Y.Get.css(
                'http://' + SERVER + ':' + PORT + '/footer.css', 
                { 
                    win: Y.config.win,
                    onSuccess: function() {
                        join_invite_overlay = new Y.Overlay( { zIndex: 9999 });
                        join_invite_overlay.render(body);
                        hideFriendMenu();
                    }
                }
        );
        */

                        join_invite_overlay = new Y.Overlay( { zIndex: 9999 });
                        /*
                        join_invite_overlay.render(body);
                        */
                        hideFriendMenu();

        function hideFriendMenu() {
            var cp = Y.all('a.chat');
            if (cp) {
                cp.each(function(cc) {
                 //   cc.next(".subpanel").hide(); //hide subpanel
                  //  cc.removeClass('active'); //remove active class on subpanel trigger
                });
            }
 //           join_invite_overlay.hide();
        }

        function showFriendMenu() {
//            Y.one('#friendpanel').one(".subpanel").show(); //show subpanel
//            join_invite_overlay.show();
        }

        function showDialog(msg) {
            hideFriendMenu();

            join_invite_overlay.set('headerContent', '<center><b>Waiting...</b></center>');
            join_invite_overlay.set('bodyContent',   '<h3><b><center>' + msg + '</b></center></h3>');
            join_invite_overlay.set('footerContent', '<h3><b><center><button id="cancel_wait">Cancel</button></b></center></h3>');
            join_invite_overlay.set('centered', true);
            showFriendMenu();

            var cancelHandler = Y.one('#cancel_wait').on('click', function(e) {
                socket.send({ event: 'cancel', me: FB_USER_ID });
                cancelHandler.detach();
                hideFriendMenu();
            });
        }

        function addFriend(message) {
            var node = Y.config.doc.getElementById(message.uid);
            if (!node) {
                var li = '<li id="' + message.uid + '" class="yui3-menuitem"><a class="yui3-menuitem-content">' + message.name + '</a></li>';
                Y.one('#friend_menu').append(li);

                var fc = Y.one('#friendCount').get('innerHTML');
                var nc = parseInt(fc, 10) + 1;
                Y.one('#friendCount').set('innerHTML', nc);

                size_friend_menu();
            }
        }

        function size_friend_menu() {
            var size = 0,
                friend_menu = Y.one('#friend_menu'),
                ch = friend_menu.all('li');

            if (ch.size()) {
                size = (ch.size() + 1) * ch.item(0).get('offsetHeight');
            }

            size -= 4;
            friend_menu.setStyle('marginTop', -size);
        }

        Y.on("domready", function() {
            if (Y.config.win.top == Y.config.win.self) {
                //Y.one('body').append('<div id="footpanel"><ul id="mainpanel"></ul></div>');
                body.append('<div id="footpanel"><ul id="mainpanel"></ul></div>');
                body.append('<div id="fpanel"></div>');

                Y.one('#mainpanel').append('<li><a href="http://' + SERVER + ':' + PORT + '" class="home" style="padding-right: 30px">Together</a></li>');

                Y.on("contentready", function() {
                    this.plug(Y.Plugin.NodeMenuNav);
                    }, "#menu-1");

                var zob = '<li style="margin-left: 0px; float: left"><div id="menu-1" class="yui3-menu yui3-menu-horizontal"><!-- Bounding box --> <div class="yui3-menu-content"><!-- Content box --> <ul id="zob"> <!-- Menu items --> </ul> </div> </div></li>';
                Y.one('#mainpanel').append(zob);
                Y.one('#zob').append('\
                              <li id="friendpanel">\
                                    <span id="forgood-label" class="yui3-menu-label">\
                                        <a class="chat" style="color: white" href="#friends-menu">Friends (<span id="friendCount">0</span>)</a>\
                                    </span>\
                                    <div id="friends-menu" class="yui3-menu">\
                                        <div class="yui3-menu-content">\
                                            <ul style="border: 1p solid white; z-index: 9999; background-color: #333232;" id="friend_menu">\
                                            </ul>\
                                        </div>\
                                    </div>\
                                </li>');

                var followpanel = '<li id="followpanel"><a href="#" class="chat">Followers (<strong id="followCount" style="color: white">0</strong>)</a><div class="subpanel"><h3 id="followers_dash"><span> &ndash; </span>Followers</h3><ul id="followerList"></ul></div></li>';
//                Y.one('#mainpanel').append(followpanel);

                var friendpanel = '<li id="friendpanel"><a href="#" class="chat">Friends (<strong id="friendCount" style="color: white">0</strong>)</a><div class="subpanel"><h3 id="friends_dash"><span> &ndash; </span>Friends Online</h3><ul id="friendList"></ul></div></li>';
//                Y.one('#mainpanel').append(friendpanel);

                /*
                Y.on('window:resize', function(e) {
                    adjustPanel(Y.one('#friendpanel'));
                });
                adjustPanel(Y.one('#friendpanel'));
                */

                //Click event on Chat Panel
                /*
                Y.all("a.chat").on('click', function(e) {
                    var tthis = e.target;
                    if (tthis.hasClass('active')) { //If subpanel is already active...
                        tthis.removeClass('active');
                        tthis.next('.subpanel').hide();
                        hideFriendMenu();
                    }
                    else { //if subpanel is not active...
                        tthis.addClass('active');
                        showFriendMenu();
                        Y.log('SHOW FRIEND MENU!!');
                    }
                    return false;
                });
                */

                //Click event outside of subpanel
                /*
                Y.one('#friends_dash').on('click', function(e) { //Click anywhere and...
                    hideFriendMenu();
                });
                */

                /*
                Y.one('#friendpanel').one('.subpanel ul').on('click', function(e) { 
                    e.stopPropagation(); //Prevents the subpanel ul from closing on click
                });
                */

                Y.delegate('mouseenter', function(e) {
                    var uid = e.currentTarget.get('id');
                    join_invite_overlay.set('headerContent', '<center><b>' + friends[uid].name + '</b></center>');
                    join_invite_overlay.set('bodyContent', '<h3><b><center>' + friends[uid].title + '</b></center></h3>');
                    join_invite_overlay.set('footerContent', '<p><h1 align="center"><p><button id="join">JOIN</button>&nbsp;&nbsp;&nbsp;<button id="invite">INVITE</button></p></h1></p>');
                    join_invite_overlay.set('align', { node: e.currentTarget, points:[Y.WidgetPositionAlign.RC, Y.WidgetPositionAlign.LC] });
                    join_invite_overlay.set('centered', false);
                    showFriendMenu();
                    Y.one('#join').setData(uid);
                    Y.one('#invite').setData(uid);

                    Y.one('#join').on('click', function(e) {
                        socket.send({ event: 'join', me: FB_USER_ID, them: e.target.getData() });
                        showDialog('Waiting for join request');
                    });

                    Y.one('#invite').on('click', function(e) {
                        socket.send({ event: 'invite', me: FB_USER_ID, them: e.target.getData() });
                        showDialog('Waiting for invite request');
                    });
                }, '#friendList', 'li');

                /*
                Y.delegate('mouseleave', function(e) {
                    if (!e.relatedTarget || !e.relatedTarget.hasClass('yui3-overlay') && !e.relatedTarget.hasClass('subpanel')) {
                        join_invite_overlay.hide();
                    }
                }, '#friendList', 'li');

                join_invite_overlay.get('boundingBox').on('mouseleave', function(e) {
                    hideFriendMenu();
                    //join_invite_overlay.hide();
                });
                */
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
                    socket.send({ event: 'event', data: ev, uid: FB_USER_ID });

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

        function startFollow() {
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

        function startTogether() {
            if (!startedTogether) {
                startedTogether = true;
                func = Y.config.win.addEventListener;
                if (!func) {
                    func = Y.config.win.attachEvent;
                }
                setUpEvents(func);
            }
        }

        Y.on('socketHere', function() {
            if (Y.config.win.top == Y.config.win.self) {
                YUI.Env.socket = socket;
                YUI.Env.FB_USER_ID = FB_USER_ID;

                createSandbox(Y.one('#fpanel'), 'http://' + SERVER + ':' + PORT + '/friendTable.js');

                /*
                var loader = Y.Env._loader;
                var b = loader.addModule({
                    name: 'friendTable',
                    type: 'js', 
                    fullpath: 'http://' + SERVER + ':' + PORT + '/userTable.js',
                    requires: [ 'dd-drag', 'datatable', 'recordset-indexer' ]
                }, 'friendTable');

                Y.use('friendTable', function(Y) 
                    { 
                        friendTable = new Y.FriendTable(socket, FB_USER_ID, Y.one('#fpanel'));
                        Y.log('loaded friend table');
                        friendTable.show(); 
                    }
                );
                */
            }
        });

        Y.on('socketHere', function() {
            var obj, tname, taction, shim, bcolor, cookie_obj, tindex;

            socket.on('message', function(message) {
                var event = message.data, i = 0, timeout = 0, event_obj, url, ds;
                if (message.event === 'events') {
                    if (!TRACKER_QUEUE) {
                        startFollow();
                    }
                    Y.log('adding ' + event.length + ' events to queue!');
                    for (; i < event.length; i++) {
                        event_obj       = Y.JSON.parse(event[i]);
                        event_obj.INDEX = message.start + i;
                        TRACKER_INDEX   = event_obj.INDEX;
                        url             = event_obj.host;

                            Y.log('AM AT: ' + Y.config.win.location);
                            Y.log('URL AT: ' + url);
                        if (Y.config.win.top == Y.config.win.self) {
                            Y.log('AM AT: ' + Y.config.win.location);
                            Y.log('URL AT: ' + url);
                            if (url != Y.config.win.location) {
                                Y.log('MOVING TO: ' + url);
                                Y.config.win.location = url;
                            }
                        }

                        if (event.length === 1) {
                            doEvent(event_obj);
                        } else {
                            if (i > 0) {
                                timeout = event_obj.timeStamp - Y.JSON.parse(event[i-1]).timeStamp;
                            }
                            TRACKER_QUEUE.add({ fn: doEvent, args: [ event_obj ], timeout: timeout });
                        }
                    }
                    TRACKER_QUEUE.run();
                } else if (message.event === 'friend') {
                    var uid = message.uid;
                    friends[uid] = message;
                    //addFriend(message);
                    /*
                    if (!Y.config.doc.getElementById(uid)) {
                        Y.one('#friendList').append('<li id="' + uid + '"><a href="#"><img src="' + message.pic_url + '" alt="" />' + message.name + '</a></li>');
                        var fc = Y.one('#friendCount').get('innerHTML');
                        var nc = parseInt(fc, 10) + 1;
                        Y.one('#friendCount').set('innerHTML', nc);
                        //adjustPanel(Y.one('#friendpanel'));
                    } 
                    */
                } else if (message.event === 'join_request') {
                    hideFriendMenu();

                    join_invite_overlay.set('headerContent', '<center>Join Request</center>');
                    join_invite_overlay.set('bodyContent',   '<center><b>' + message.name + ' wants to join you!</b></center>');
                    join_invite_overlay.set('footerContent', '<p><h1 align="center"><p><button id="allow">ALLOW</button>&nbsp;&nbsp;&nbsp;<button id="deny">DENY</button></p></h1></p>');
                    join_invite_overlay.set('centered', true);
                    showFriendMenu();

                    Y.one('#allow').on('click', function(e) {
                        socket.send({ event: 'join_response', me: FB_USER_ID, them: message.from, response: true }); 
                        hideFriendMenu();
                       // startTogether();
                    });

                    Y.one('#deny').on('click', function(e) {
                        socket.send({ event: 'join_response', me: FB_USER_ID, them: message.from, response: false });
                        hideFriendMenu();
                    });
                } else if (message.event === 'join_response') {
                    hideFriendMenu();
                    if (!message.response) {
                        join_invite_overlay.set('headerContent', '<center>Join Response</center>');
                        join_invite_overlay.set('bodyContent',   '<center><b>' + message.name + ' denied your join request</b></center>');
                        join_invite_overlay.set('footerContent', '<p><h1 align="center"><p><button id="ttt_close">Close</button></p></h1></p>');
                        join_invite_overlay.set('centered', true);
                        showFriendMenu();

                        Y.one('#ttt_close').on('click', function(e) {
                            hideFriendMenu();
                        });
                    } 
                } else if (message.event === 'follower') {
                    startTogether();
                    // message.uid = follower
                }
            });
        });

        // Deal with UI
        Y.on('socketHere', function() {
            // Send alive messages
            var LOOP = 10;  // check in every X seconds

            // Only send keepAlives for very top window
            if (Y.config.win.top == Y.config.win.self) {
                socket.send({ event: 'iamHere', uid: FB_USER_ID, href: Y.config.win.location.href, title: Y.config.doc.title}); 
                keepAliveTimer = Y.later(LOOP * 1000, this, 
                    function () { 
                        socket.send({ event: 'iamHere', uid: FB_USER_ID, href: Y.config.win.location.href, title: Y.config.doc.title}); 
                    }, {}, true
                );
            }
        });
    });

    //Adjust panel height
    function adjustPanel(node) {
        node.all("ul, .subpanel").setStyles({ 'height' : 'auto'}); //Reset subpanel and ul height
        
        var windowHeight = node.get('winHeight');
        var panelsub = node.one(".subpanel").get('height'); //Get the height of subpanel 
        var panelAdjust = windowHeight - 100; //Viewport height - 100px (Sets max height of subpanel)
        var ulAdjust =  panelAdjust - 25; //Calculate ul size after adjusting sub-panel (27px is the height of the base panel)
        
        if ( panelsub >= panelAdjust ) {     //If subpanel is taller than max height...
            node.one(".subpanel").setStyles({ 'height' : panelAdjust }); //Adjust subpanel to max height
            node.one("ul").setStyles({ 'height' : ulAdjust}); //Adjust subpanel ul to new size
        }
        else if ( panelsub < panelAdjust ) { //If subpanel is smaller than max height...
            node.one("ul").setStyles({ 'height' : 'auto'}); //Set subpanel ul to auto (default size)
        }
    };

     function createSandbox(node, js) {
         var iframe = Y.Node.create('<iframe border="0" frameBorder="0" marginWidth="0" marginHeight="0" leftMargin="0" topMargin="0" allowTransparency="true" title="Online Friends">Online Friends</iframe>'),
             DEFAULT_CSS = 'http://yui.yahooapis.com/combo?3.3.0/build/cssreset/reset-min.css&3.3.0/build/cssfonts/fonts-min.css',
             BODY= [
                 "<body onload='", 
                     'var d=document;d.getElementsByTagName("head")[0].appendChild(d.createElement("script")).src="',
                         js,
                     '";',
                 "'><div></body>"
             ].join(''),
             // other static variables
             META = '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>',
             STYLE = 'html{overflow:hidden;border:0;margin:0;padding:0;}',
             html = '<!doctype html><html><head>' + META + '<link rel="stylesheet" type="text/css" href="' + DEFAULT_CSS + '"><style>' + STYLE + '</style></head>' + BODY + '</html>',
             doc;
 
         iframe.set('src', 'javascript' + ((Y.UA.ie) ? ':false' : ':') + ';');
         // injecting the structure into the node wrapper
         node.append( iframe );
         // setting the content of the iframe
         doc = iframe._node.contentWindow.document;
         doc.open().write(html);
         doc.close();
     }
});
