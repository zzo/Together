
var tweet = 'Will White House ignore the War Powers Resolution? 60-day limit on war in #Libya this Friday - http://bit.ly/kf2mxf';

                urlRegex = /https?:\/\/.+?(\s|$)/g, // matches \s OR $ at the end...
                matches = tweet.match(urlRegex);

            if (matches) {
                for (var i = 0, len = matches.length; i < len; i++) {
                    console.log('MATCH: ' + matches[i]);
                    //matches[i].replace(/^\s+|\s+$/g, '');
                    console.log('NOW MATCH: ' + matches[i]);
                    var rr = new RegExp('(' + matches[i] + ')');
                    tweet = tweet.replace(rr, '<a href="$1">$1</a>');
                    console.log(tweet);
                }
            }
            return tweet;

