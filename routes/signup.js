'use strict';

var express = require('express');
var router = express.Router();

var validate = require('../lib/middleware/validate');
var User = require('../lib/model/user');

router.get('/', function(req, res) {
  req.flash();
  res.render('signup', { title: 'Sign up for Twitter' });
});

router.post('/',
  // Validate username
  validate.required('user[name]'),
  validate.lengthLessThanOrEqualTo('user[name]', 15),
  validate.username('user[name]'),
  // Validate password
  validate.required('user[pass]'),
  validate.lengthMoreThanOrEqualTo('user[pass]', 6),
  validate.lengthLessThanOrEqualTo('user[pass]', 1024),
  // Validate fullname
  validate.required('user[fullname]'),
  validate.lengthLessThanOrEqualTo('user[fullname]', 20),
  function(req, res, next) {
    var data = req.body.user;
    User.getByName(data.name, function(err, user) {
      if (err) {
        return next(err);
      }

      if (user.id) {
        req.flash('error', 'Username already taken!');
        // A back redirection redirects the request back to the referer,
        // defaulting to / when the referer is missing.
        return res.redirect('back');
      }

      user = new User({
        name: data.name,
        pass: data.pass,
        fullname: data.fullname
      });

      user.save(function(err) {
        if (err) {
          return next(err);
        }
        req.session.uid = user.id;
        res.redirect('/');
      });
    });
  }
);

module.exports = router;