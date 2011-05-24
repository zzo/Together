YUI().add('facebookTable', function(Y) {
    function ft(parentDiv) {
        var _this = this;

        this.height = 300;
        this.width  = 500;

        this.recordset = new Y.Recordset();
        this.recordset.plug(Y.Plugin.RecordsetIndexer);
        this.uidTable = this.recordset.indexer.createTable('uid');
        this.parentDiv = parentDiv;

        this.sizeParent();

        function name(o) {
            var from = o.record.getValue('from').name,
                to   = o.record.getValue('to');
            if (to) {
                from = to.data[0].name;
            }

            return from;
        }

        function status(o) {
            var message = o.record.getValue('message'),
                from    = o.record.getValue('from'),
                to      = o.record.getValue('to'),
                actions = o.record.getValue('actions'),
                action_line = '';

            if (to) {
                from = to.data[0].name;
            }


            for (var i = 0; i < actions.length; i++) {
                var action = actions[i];
                action_line += '<a onclick="window.open(' + "'" + action.link + "'" + ", '" + action.name + "'" + ', ' + "'scrollbars=yes,width=500,height=300,top=200,left=200,width=500,height=300'" + '); return false;" href="javascript:void(0)">' + action.name + '</a>';
                action_line += '&nbsp;&nbsp;';
            }
            return '<div><div>' + message + '</div>' + '<div font="-1">' + action_line + '</div></div>';
        }

        var cols = [
            {
                key: "name",
                label: "Friend",
                sortable: true,
                abbr: "Name",
                formatter: name
            },
            {
                key: "status",
                label: "Status",
                sortable: true,
                abbr: "Status",
                formatter: status
            }
        ];

        this.friendTable = new Y.DataTable.Base({
            columnset: cols,
            caption: 'Friends Status',
            width: this.width
        }).plug(Y.Plugin.DataTableSort);

        // body in the iframe
        this.hide();
        _this.friendTable.render(Y.one('body'));

        /*
        Y.delegate('click', function(e) {
            var uid     = e.target.getAttribute('uid'),
                action  = e.target.getAttribute('action'),
                name    = e.target.getAttribute('fullname');

            Y.Global.fire(action, { them: uid, name: name });
        }, '.yui3-datatable', 'button');
        */

        Y.Global.on('facebook.allStatus', function(message) {
            for (var i = 0; i < message.statuses.length; i++) {
                var status = message.statuses[i],
                    uid    = status.id.split('_', 1),
                    added = false;

                var record = _this.uidTable[uid];
                if (!record) {
                    _this.recordset.add(status);
                    added = true;
                } else {
                    record.set('data', status);
                }
            }

            _this.friendTable.set('recordset', _this.recordset);
            if (added) {
                Y.Global.fire('updateFriendCount', _this.recordset.getLength());
            }
        });

        /*
        Y.Global.on('facebook.status', function(message) {
            var record = _this.uidTable[message.uid];
            if (!record) {
                _this.recordset.add(message);
                _this.friendTable.set('recordset', _this.recordset);
                Y.Global.fire('updateFriendCount', _this.recordset.getLength());
            } else {
                record.set('data', message);
                _this.friendTable.set('recordset', _this.recordset);
            }
        });
        */

        Y.Global.on('toggleFriendsPanel', function(message) {
            if (_this.hidden) {
                _this.show();
            } else {
                _this.hide();
            }
        });
    };

    ft.prototype = {
        show : function() {
            this.parentDiv.show();
            this.hidden = false;
        },
        hide : function () {
            this.parentDiv.hide();
            this.hidden = true;
        },
        sizeParent: function() {
            var height  = this.height, 
                width   = this.width,
                foot    = this.parentDiv,
                bottom  = foot.get('winHeight') - 35,  // 35 is height of Tfootpanel
                right   = foot.get('winWidth') * .84,  // Tfootpanel is 94% of width
                top     = bottom - height,
                left    = right - width;

            this.parentDiv.setStyles({
                position:   'fixed',
                height:     height,
                width:      width,
                bottom:     bottom,
                right:      right,
                top:        top,
                left:       left,
                zIndex:     9999
            });
        }
    };

    Y.FriendTable = ft;
}, '1.0', { requires: ['node', 'recordset-base', 'datatable', 'recordset-indexer', 'event-custom-base', 'event-delegate' ]});

YUI().add('facebook', function(Y) {

    var fb = function(parentDiv) {
        var _this = this, statusTime = 60;
        this.table = new Y.FriendTable(parentDiv);
        this.friends = {};
        this.getFriends();

        Y.Global.on('facebook.friends', function(message) {
            Y.each(message.friends.data, function(friend) {
                _this.friends[friend.id] = friend;
                _this.friends[friend.id].profile_messages = [];
            });
            _this.getAllStatus(true);
        });

        Y.Global.on('facebook.allStatus', function(message) {
            if (message.first) {
                // Check status every statusTime seconds after we got the initial set
                if (!_this.statusLoop) {
                    _this.statusLoop = Y.later(statusTime * 1000, _this, _this.getAllStatus, false, true);
                }
            }
        });
    };

    fb.prototype = {
        getAllStatus: function(first) {
            first = first || false;
            Y.Global.fire('sendMessage', { event: 'facebook.getAllStatus', first: first });
        },
        getFriends: function() {
            Y.Global.fire('sendMessage', { event: 'facebook.getFriends' });
        }
    };

    Y.Facebook = fb;
}, '1.0', { requires: ['json', 'event-custom-base', 'node', 'facebookTable']});

