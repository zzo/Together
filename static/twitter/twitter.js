YUI().add('twitterTable', function(Y) {
    function ft(parentDiv) {
        var _this = this;

        this.height = 300;
        this.width  = 500;
        this.followers = {};

        this.recordset = new Y.Recordset();
        this.recordset.plug(Y.Plugin.RecordsetIndexer);
        this.idTable = this.recordset.indexer.createTable('id');
        this.parentDiv = parentDiv;

        this.sizeParent();

        function tweet(o) {
            return o.record.getValue("message");
        }

        function from(o) {
            var user = o.record.getValue('user');
            return user.name + '<br /> @' + user.screen_name;
        }

        var cols = [
            {
                key: "from",
                label: "From",
                sortable: true,
                abbr: "Tweeter",
                formatter: from
            },
            {
                key: "text",
                label: "Tweet",
                sortable: true,
                abbr: "Tweet"
            },
            {
                key: "created_at",
                label: "Date",
                sortable: true,
                abbr: "Date"
            }
        ];

        this.twitterTable = new Y.DataTable.Base({
            columnset: cols,
            caption: 'Twitter Feed',
            width: this.width
        }).plug(Y.Plugin.DataTableSort);

        // body in the iframe
        this.hide();
        _this.twitterTable.render(Y.one('body'));

        Y.Global.on('twitter.homeTimeline', function(message) {
            var i = 0, countChanged = false;
                Y.log(message);
            for (var i = 0; i < message.tweets.length; i++) {
                var tweet = message.tweets[i],
                    record = _this.idTable[tweet.uid];

                if (!record) {
                    _this.recordset.add(tweet);
                    countChanged = true;
                } else {
                    record.set('data', tweet);
                }
            }
            if (countChanged) {
                Y.Global.fire('updateTweetCount', _this.recordset.getLength());
            }
            _this.twitterTable.set('recordset', _this.recordset);
        });

        Y.Global.on('toggleTwitterPanel', function(message) {
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

    Y.TwitterTable = ft;
}, '1.0', { requires: ['node', 'recordset-base', 'datatable', 'recordset-indexer', 'event-custom-base', 'event-delegate' ]});

YUI().add('twitter', function(Y) {

    var fb = function(parentDiv) {
        var _this = this, statusTime = 60;
        this.table = new Y.TwitterTable(parentDiv);
        this.homeTimeline = {};
        this.getHomeTimeline();

        Y.Global.on('twitter.homeTimeline', function(message) {
            Y.log('TWITTER: ');
            Y.log(message);
        });
    };

    fb.prototype = {
        getHomeTimeline: function(first) {
            first = first || false;
            Y.Global.fire('sendMessage', { event: 'twitter.getHomeTimeline', first: first });
        }
    };

    Y.Twitter = fb;
}, '1.0', { requires: ['json', 'event-custom-base', 'node', 'twitterTable']});
