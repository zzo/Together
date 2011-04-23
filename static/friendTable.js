YUI({ filter: '' }).use('yui', function (Y) {

    var pipeline = YUI({
        win: window,
        doc: document
    });

    Y.Get.script = function() {
        return pipeline.Get.script.apply(pipeline, arguments);
    };

    Y.Get.css = function() {
        return pipeline.Get.script.apply(pipeline, arguments);
    };

    Y.use(
        'datatable',
        'recordset-indexer', 
        'dd-drag'
    ,function(Y) {
 
        var socket = YUI.Env.socket,
            fb_id  = YUI.Env.FB_USER_ID,
            recordset = new Y.Recordset();

        recordset.plug(Y.Plugin.RecordsetIndexer);
        var uidTable = this.recordset.indexer.createTable('uid');

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
                abbr: "Location"
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
                formatter: '<button id="join_${data.uid}">Join</button'
            },
            {
                key: "invite",
                label: "Invite",
                abbr: "Invite",
                formatter: '<button id="invite_${data.uid}">Invite</button'
            }
        ];

        new Y.DD.Drag({ node: node });

        var friendTable = new Y.DataTable.Base({
            columnset: cols,
            recordset: recordset,
            summary: "Online Friends",
            caption: "Table with nested column headers"
        }).plug(Y.Plugin.DataTableSort).plug(Y.Plugin.DataTableScroll, {
            width: "400px",
            height: "300px"
        }).render(node);


        socket.on('message', function(message) {
            if (message.event === 'friend') {
                var record = uidTable[message.uid];
                if (!record) {
                    recordset.add(message);
                    var fc = Y.one('#friendCount').set('innerHTML', recordset.getLength());
                } else {
                    record.set('data', message);
                }
            }
        });
    });
});
