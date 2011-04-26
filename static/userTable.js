YUI().add('friendTable', function(Y) {
    function ft() {
        var _this = this;

        this.node = Y.one('body');
        this.recordset = new Y.Recordset();
        this.recordset.plug(Y.Plugin.RecordsetIndexer);
        this.uidTable = this.recordset.indexer.createTable('uid');

        function location(o) {
            return o.record.getValue("title");
        }

        function join(o) {
            var uid =  o.record.getValue("uid");
            return '<button uid="' + uid + '">JOIN</button>';
        }

        function invite(o) {
            var uid =  o.record.getValue("uid");
            return '<button uid="' + uid + '">INVITE</button>';
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
                abbr: "Status"
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
            recordset: this.recordset,
            summary: "Online Friends",
            caption: "Table with nested column headers"
        }).plug(Y.Plugin.DataTableSort);

        /*
        this.friendTable.plug(Y.Plugin.DataTableScroll, {
            width: "400px",
            height: "300px"
        });
        */

        this.friendTable.render(this.node);

//        this.friendTable.hide();

        Y.Global.on('friend', function(message) {
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
    };

    ft.prototype = {
        show : function() {
            this.friendTable.show();
        },
        hide : function () {
            this.friendTable.hide();
        },
    };

    Y.FriendTable = ft;
}, '1.0', { requires: ['node', 'recordset-base', 'datatable', 'recordset-indexer', 'event-custom-base' ]});
