YUI().add('twitterTable', function(Y) {
    function tw(parentDiv) {
        var _this = this;

        function tweet(o) {
            var tweet     = o.record.getValue("text"),
                urlRegex  = /https?:\/\/.+?(\s|$)/g, // matches \s OR $ at the end...
                userRegex = /@[a-zA-Z0-9]+/g,
                matches   = tweet.match(urlRegex),
                umatches  = tweet.match(userRegex);

            if (matches) {
                for (var i = 0, len = matches.length; i < len; i++) {
                    matches[i].replace(/\)/g, '\\)');
                    var rr = new RegExp('(' + matches[i] + ')');
                    var handler = "window.open('" + matches[i] + "', 'Twitter Link', 'scrollbars=yes,width=500,height=300,top=200,left=200'); return false;";
                    tweet = tweet.replace(rr, '<a onclick="' + handler + '" href="javascript:void(0)">$1</a>');
                }
            }

            if (umatches) {
                for (var i = 0, len = umatches.length; i < len; i++) {
                    umatches[i] = umatches[i].substring(1); // Get rid of the '@'
                    var rr = new RegExp('@(' + umatches[i] + ')');
                    var handler = "window.open('http://twitter.com/#!/" + umatches[i] + "', 'Twitter User', 'scrollbars=yes,width=500,height=300,top=200,left=200'); return false;";
                    tweet = tweet.replace(rr, '<a onclick="' + handler + '" href="javascript:void(0)">@$1</a>');
                }
            }

            return tweet;
        }

        function from(o) {
            var user = o.record.getValue('user'),
                handler = "window.open('http://twitter.com/#!/" + user.screen_name + "', '" + user.name + "', 'scrollbars=yes,width=500,height=300,top=200,left=200'); return false;";
            //return user.name + '<br /><a href="javascript:void(0)" onclick="' + handler + '">@' + user.screen_name + '</a>';
            return '<img width="75" height="75" src="' + user.profile_image_url + '" /><br /><a href="javascript:void(0)" onclick="' + handler + '">@' + user.screen_name + '</a>';
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
                abbr: "Tweet",
                formatter: tweet
            },
            {
                key: "created_at",
                label: "Date",
                sortable: true,
                abbr: "Date"
            }
        ];

        Y.Global.on('twitter.homeTimeline', function(message) {
            var i = 0, countChanged = false;
            for (var i = 0; i < message.tweets.length; i++) {
                _this.recordset.add(message.tweets[i]);
                countChanged = true;
            }
            if (countChanged) {
                Y.Global.fire('updateTweetCount', _this.recordset.getLength());
            }
            _this.table.set('recordset', _this.recordset);
        });

        tw.superclass.constructor.call(this, { parentDiv: parentDiv, toggleEvent: 'toggleTwitterPanel', buttonOffset: .94, cols: cols });
    };

    Y.TwitterTable = tw;
    Y.extend(Y.TwitterTable, Y.BaseTable);

}, '1.0', { requires: ['baseTable' ]});

YUI().add('twitter', function(Y) {

    var tw = function(parentDiv) {
        var _this = this, statusTime = 60;
        this.table = new Y.TwitterTable(parentDiv);
        this.homeTimeline = {};
        this.getHomeTimeline();

        Y.Global.on('twitter.homeTimeline', function(message) {
            if (message.first) {
                // Check status every statusTime seconds after we got the initial set
                if (!_this.statusLoop) {
                    _this.statusLoop = Y.later(statusTime * 1000, _this, _this.getHomeTimeline, false, true);
                }
            }
        });
    };

    tw.prototype.getHomeTimeline = function(first) {
        first = first || false;
        Y.Global.fire('sendMessage', { event: 'twitter.getHomeTimeline', first: first });
    };

    Y.Twitter = tw;
}, '1.0', { requires: ['twitterTable']});
