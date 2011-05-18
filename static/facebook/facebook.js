YUI().add('facebookTable', function(Y) {
    function ft(parentDiv) {
        var _this = this;

        this.height = 300;
        this.width  = 500;
        this.followers = {};

        this.recordset = new Y.Recordset();
        this.recordset.plug(Y.Plugin.RecordsetIndexer);
        this.uidTable = this.recordset.indexer.createTable('uid');
        this.parentDiv = parentDiv;

        this.sizeParent();

        function location(o) {
            return o.record.getValue("title");
        }

        function join(o) {
            var uid =  o.record.getValue("uid"),
                name =  o.record.getValue("name");
            return '<button action="join" fullname="' + name + '" uid="' + uid + '">JOIN</button>';
        }

        function invite(o) {
            var uid =  o.record.getValue("uid"),
                name =  o.record.getValue("name");
            return '<button action="invite" fullname="' + name + '" uid="' + uid + '">INVITE</button>';
        }

        function name(o) {
            var status = o.record.getValue('status'),
                from = status.from.name;
            if (status.to) {
                from = status.to.data[0].name;
            }

            return from;
        }

        function status(o) {
            var status = o.record.getValue('status'),
                message = status.message, action_line = '',
                from = status.from.name;

            if (status.to) {
                from = status.to.data[0].name;
            }


            for (var i = 0; i < status.actions.length; i++) {
                var action = status.actions[i];
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

        Y.Global.on('facebook.status', function(message) {
                Y.log(message);
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
                right   = foot.get('winWidth') * .94,  // Tfootpanel is 94% of width
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
            Y.log('FB FRIENDS: ');
            Y.log(message);
            Y.each(message.friends.data, function(friend) {
                _this.friends[friend.id] = friend;
                _this.friends[friend.id].profile_messages = [];
            });
//            _this.getAllStatus(true);
        });

        Y.Global.on('facebook.status', function(message) {
//               Y.Global.fire('facebook.gotStatus', message);
            if (!message.first) {
            /*
                var from = message.status.from.name;
                if (message.status.to) {
                    from = message.status.to.data[0].name;
                }
                */
//                Y.Global.fire('notify', { message: 'Facebook Status Update from ' + from  + "<br />" + (message.status.message || message.status.name) });
//                Y.Global.fire('facebook.newStatusMessage', { message: status });
            } else {
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
        getStatus: function(friend, first) {
            first = first || false;
            Y.Global.fire('sendMessage', { event: 'facebook.getStatus', id: friend.id, first: first });
        },
        getFriends: function() {
            Y.Global.fire('sendMessage', { event: 'facebook.getFriends' });
        }
    };

    Y.Facebook = fb;
}, '1.0', { requires: ['json', 'event-custom-base', 'node', 'facebookTable']});

