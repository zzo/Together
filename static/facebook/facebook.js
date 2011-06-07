YUI().add('facebookTable', function(Y) {
    function ft(parentDiv) {
        var _this = this;

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
                message = '@' + from.name + ': ' + message;
                from = to.data[0].name;
            }


            if (actions) {
                for (var i = 0; i < actions.length; i++) {
                    var action = actions[i];
                    action_line += '<a onclick="window.open(' + "'" + action.link + "'" + ", '" + action.name + "'" + ', ' + "'scrollbars=yes,width=500,height=300,top=200,left=200,width=500,height=300'" + '); return false;" href="javascript:void(0)">' + action.name + '</a>';
                    action_line += '&nbsp;&nbsp;';
                }
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

        Y.Global.on('facebook.allStatus', function(message) {
                Y.log(message);
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

            _this.table.set('recordset', _this.recordset);
            if (added) {
                Y.Global.fire('updateFriendCount', _this.recordset.getLength());
            }
        });

        ft.superclass.constructor.call(this, { parentDiv: parentDiv, toggleEvent: 'toggleFacebookPanel', buttonOffset: .84, cols: cols });
        this.recordset.plug(Y.Plugin.RecordsetIndexer);
        this.uidTable = this.recordset.indexer.createTable('uid');
    };

    Y.FriendTable = ft;
    Y.extend(Y.FriendTable, Y.BaseTable);

}, '1.0', { requires: [ 'baseTable' ]});

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
}, '1.0', { requires: ['facebookTable']});

