YUI().add('eventing-leader', function(Y) {
    var eventCapture = false,
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
        ], keys = [
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
                    ev.host         = Y.config.win.location.href;

                    if (ev.type === 'scroll') {
                        ev.scrollTop  = target.get('scrollTop');
                        ev.scrollLeft = target.get('scrollLeft');
                    }

                    if (ev.type === 'change') {
                        if (e.target.selectedIndex) {
                            ev.selectedIndex = e.target.selectedIndex;
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
                    Y.Global.throw('sendMessage', { event: 'event', data: ev });

                } catch(E) {
                    Y.log('STRINGIFY FAILED!');
                    Y.log(E);
                }
            };

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
            return 'body';
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

    function setUpEvents() {
        Y.Array.each(TRACKER_EVENTS, function(event) {
            if (Y.config.win.addEventListener) {
                Y.config.win.addEventListener(event, handleEvent, true);
            } else {
                Y.config.win.attachEvent('on' + event, handleEvent, true);
            }
        });

    }

    function tearDownEvents() {
        Y.Array.each(TRACKER_EVENTS, function(event) {
            if (Y.config.win.removeEventListener) {
                Y.config.win.removeEventListener(event, handleEvent, true);
            } else {
                Y.config.win.detachEvent('on' + event, handleEvent, true);
            }
        });
    }

    function startCapture() {
        if (!eventCapture) {
            eventCapture = true;
            setUpEvents();
        }
    }

    function stopCapture() {
        if (eventCapture) {
            eventCapture = false;
            tearDownEvents();
        }
    }

    Y.Global.on('follower', function(message) {
            Y.log('FOLLOWER');
            Y.log(message);
        startCapture();
    });

    Y.Global.on('stopCapture', function(message) {
        stopCapture();
    });

}, '1.0', { requires: [ 'json', 'selector-css3', 'event-delegate', 'event-custom-base' ] } );
