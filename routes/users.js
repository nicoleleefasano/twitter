'use strict';

var express = require('express');
var router = express.Router();

var User = require('../lib/model/user');
var Tweet = require('../lib/model/tweet');

var async = require('async');
var moment = require('moment');
var util = require('util');

/**
 * Express middleware to check if given param name is same as the user name who
 * is currently logged in. If the name is same, then set res.locals.is_me to
 * true.
 */
function isMe() {
  return function(req, res, next) {
    res.locals.is_me = false;
    var me = res.locals.user;
    if (me && me.name === req.params.name) {
       res.locals.is_me = true;
    }
    next();
  }
}

router.get('/:name', isMe(), function(req, res, next) {
  var me = res.locals.user;
  var name = req.params.name;

  User.getByName(name, function(err, user) {
    if (err) {
      return next(err);
    }
    async.parallel({
      followerIds: function(fn) {
        User.getFollowerIds(user.id, fn);
      },
      followingIds: function(fn) {
        User.getFollowingIds(user.id, fn);
      },
      isFollowing: function(fn) {
        // Check if the user is followed by the user who is currently logged in.
        if (!me) {
          return fn(null, false);
        }
        User.isFollowing(user.id, me.id, fn);
      }
    }, function(err, results) {
      if (err) {
        return next(err);
      }

      var followerIds = results.followerIds;
      var followingIds = results.followingIds;
      var isFollowing = results.isFollowing;

      Tweet.filter(function filterByUsername(tweet) {
        if (!tweet.user) {
          return false;
        }
        return tweet.user.id === user.id;
      }, function(err, tweets) {
        if (err) {
          return next(err);
        }

        var formattedTweets = tweets.map(function timeCreatedAtFromNow(tweet) {
          // Pass true to get the value without the suffix.
          //
          // Examples:
          //   moment([2007, 0, 29]).fromNow();     // 4 years ago
          //   moment([2007, 0, 29]).fromNow(true); // 4 years
          tweet.created_at = moment(tweet.created_at).fromNow(true);
          return tweet;
        });

        res.render('users', {
          title: util.format('%s (@%s)', user.fullname, user.name),
          user: user,
          tweets: formattedTweets,
          tweets_count: tweets.length,
          followers_count: followerIds.length,
          followings_count: followingIds.length,
          is_following: isFollowing
        });
      });
    });
  });
});

router.get('/:name/followers', function(req, res, next) {
  var me = res.locals.user;
  var name = req.params.name;

  User.getByName(name, function(err, user) {
    if (err) {
      return next(err);
    }
    async.parallel({
      followers: function(fn) {
        User.getFollowers(user.id, fn);
      },
      followingIds: function(fn) {
        User.getFollowingIds(user.id, fn);
      },
      isFollowing: function(fn) {
        // Check if the user is followed by the user who is currently logged in.
        if (!me) {
          return fn(null, false);
        }
        User.isFollowing(user.id, me.id, fn);
      }
    }, function(err, results) {
      if (err) {
        return next(err);
      }

      var followers = results.followers;
      var followingIds = results.followingIds;
      var isFollowing = results.isFollowing;

      Tweet.filter(function filterByUsername(tweet) {
        if (!tweet.user) {
          return false;
        }
        return tweet.user.id === user.id;
      }, function(err, tweets) {
        if (err) {
          return next(err);
        }

        var formattedTweets = tweets.map(function timeCreatedAtFromNow(tweet) {
          // Pass true to get the value without the suffix.
          //
          // Examples:
          //   moment([2007, 0, 29]).fromNow();     // 4 years ago
          //   moment([2007, 0, 29]).fromNow(true); // 4 years
          tweet.created_at = moment(tweet.created_at).fromNow(true);
          return tweet;
        });

        res.render('followers', {
          title: util.format('People following %s', user.fullname),
          user: user,
          tweets: formattedTweets,
          tweets_count: tweets.length,
          followers: followers,
          followers_count: followers.length,
          followings_count: followingIds.length,
          is_following: isFollowing
        });
      });
    });
  });
});

router.get('/:name/followings', function(req, res, next) {
  var me = res.locals.user;
  var name = req.params.name;

  User.getByName(name, function(err, user) {
    if (err) {
      return next(err);
    }
    async.parallel({
      followerIds: function(fn) {
        User.getFollowerIds(user.id, fn);
      },
      followings: function(fn) {
        User.getFollowings(user.id, fn);
      },
      isFollowing: function(fn) {
        // Check if the user is followed by the user who is currently logged in.
        if (!me) {
          return fn(null, false);
        }
        User.isFollowing(user.id, me.id, fn);
      }
    }, function(err, results) {
      if (err) {
        return next(err);
      }

      var followerIds = results.followerIds;
      var followings = results.followings;
      var isFollowing = results.isFollowing;

      Tweet.filter(function filterByUsername(tweet) {
        if (!tweet.user) {
          return false;
        }
        return tweet.user.id === user.id;
      }, function(err, tweets) {
        if (err) {
          return next(err);
        }

        var formattedTweets = tweets.map(function timeCreatedAtFromNow(tweet) {
          // Pass true to get the value without the suffix.
          //
          // Examples:
          //   moment([2007, 0, 29]).fromNow();     // 4 years ago
          //   moment([2007, 0, 29]).fromNow(true); // 4 years
          tweet.created_at = moment(tweet.created_at).fromNow(true);
          return tweet;
        });

        res.render('followings', {
          title: util.format('People followed by %s', user.fullname),
          user: user,
          followers_count: followerIds.length,
          followings: followings,
          followings_count: followings.length,
          is_following: isFollowing,
          tweets: formattedTweets,
          tweets_count: tweets.length
        });
      });
    });
  });
});

module.exports = router;