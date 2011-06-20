#!/usr/bin/perl

use LWP::UserAgent;
my $ua = LWP::UserAgent->new;

my $app_id = '166824393371670';
my $secret = 'accb35fd6f8c613931f6ab0df9295d37';
my $access_token = '166824393371670|T4WzhE7rFsjUUTOiWB5wYEJOJIg';

####
## Get App Access Token
####
#my $get_A_token = 'https://graph.facebook.com/oauth/access_token?client_id=' . $app_id . '&client_secret=' . $secret . '&grant_type=client_credentials';
#my $response = $ua->get($get_A_token);
#if ($response->is_success) {
#    print $response->content;  # or whatever
#}
#else {
#    die $response->status_line;
#}
# exit;


####
## Generate test user
####
#my $url = 'https://graph.facebook.com/' . $app_id . '/accounts/test-users?installed=false&method=post&access_token=' . $access_token;

#my $response = $ua->get($url);

#if ($response->is_success) {
#    print $response->content . "\n";  # or whatever
#}
#else {
#    die $response->status_line;
#}

{
    "id":"100002518852379",
    "login_url":"https:\/\/www.facebook.com\/platform\/test_account_login.php?user_id=100002518852379&n=13WJsS6lNGpz3lp",
    "email":"rejhulx_putnamstein@tfbnw.net",
    "password":"2128857435"
}
