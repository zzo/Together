var checkServices = function(rclient) {
    this.rclient = rclient;
};

checkServices.prototype = {
    checkServices: function(user, cb) {
        this.rclient.hgetall(user, function(error, user_obj) {
            if (!user_obj.fb_access_token) {
                cb('facebook');
            }
        });
    }
};

exports.checkServices = checkServices;
