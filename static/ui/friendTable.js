YUI().add('friendTable', function(Y) {
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

        function status(o) {
            var uid =  o.record.getValue("uid"),
                name =  o.record.getValue("name"),
                following =  o.record.getValue("following"),
                followingName =  o.record.getValue("followingName"),
                wantToJoinName =  o.record.getValue("want_to_join_name"),
                wantsToJoinName =  o.record.getValue("wants_to_join_name");

            if (_this.followers[uid]) {
                return '<button action="stopFollow" fullname="' + name + '" uid="' + uid + '">Kick To Curb</button>';
            } else if (following) {
                return 'Following ' + followingName;
            } else if (wantToJoinName) {
                return 'Hoping to join ' + wantsToJoinName;
            } else if (wantsToJoinName) {
                return wantsToJoinName + ' wants to join';
            } else {
                return 'Browsing';
            }
        }

        var cols = [
            {
                key: "name",
                label: "Name",
                sortable: true,
                abbr: "Name"
            },
            {
                key: "location",
                label: "Location",
                sortable: true,
                abbr: "Location",
                formatter: location
            },
            {
                key: "status",
                label: "Status",
                sortable: true,
                abbr: "Status",
                formatter: status
            },
            {
                key: "join",
                label: "Join",
                abbr: "Join",
                formatter: join
            },
            {
                key: "invite",
                label: "Invite",
                abbr: "Invite",
                formatter: invite
            }
        ];

        this.friendTable = new Y.DataTable.Base({
            columnset: cols,
            caption: 'Online Friends',
            width: this.width,
            height: this.height
        }).plug(Y.Plugin.DataTableSort);

        // body in the iframe
        this.hide();
        this.friendTable.render(Y.one('body'));

        Y.delegate('click', function(e) {
            var uid     = e.target.getAttribute('uid'),
                action  = e.target.getAttribute('action'),
                name    = e.target.getAttribute('fullname');

            Y.Global.fire(action, { them: uid, name: name });
        }, '.yui3-datatable', 'button');

        Y.Global.on('follower', function(message) {
            _this.followers[message.uid] = 1;
        });

        Y.Global.on('stopFollow', function(message) {
            delete _this.followers[message.uid];
        });

        Y.Global.on('friend', function(message) {
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

        Y.Global.on('join', function(message) {
            _this.hide();
        });

        Y.Global.on('invite', function(message) {
            _this.hide();
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
