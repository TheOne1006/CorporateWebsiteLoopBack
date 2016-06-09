'use strict';

/**
 * admin 的登录测试
 * ---------------------
 * 规则:
 * 1. 用户状态 deleted true 无法登录
 * 2. 用户状态 status 无法登录
 */

var assert = require('assert');
var async = require('async');

var app = require('../../../server/server');
var help = require('../../help.js');
var fixtureData = require('../../fixtureData.js');
var json = help.json;


var admin = fixtureData.admin;
var theone = fixtureData.theone;
var foo = fixtureData.foo;
var updateUser = fixtureData.updateUser;
var deletedUser = fixtureData.deletedUser;
var statusFalseUser = fixtureData.statusFalseUser;

var usersData = [admin, theone, foo, updateUser, deletedUser, statusFalseUser];

var adminAccessToken = '';
// var adminId = '';


describe('admin login', function() {

  before(function(done) {
    require('../../start-server');
    done();
  });

  after(function(done) {
    app.removeAllListeners('started');
    app.removeAllListeners('loaded');
    done();
  });

  before('初始化移除所有测试数据库数据', function (done) {
    app.dataSources.mysqlDs.autoupdate('Admin',function (err) {
      if(err) return done(err);

      async.eachSeries(usersData, function (user, callback) {
        app.models.Admin.upsert(user, callback);
      }, done);
    });
  });


  before('获取 admin 账号的 access_token', function (done) {
    help.getAccessTokenByUser(admin, function (err, tokenId) {
      if(!err) {
        adminAccessToken = tokenId;
      }
      done(err);
    });
    // json('post','/api/admins/login')
    //   .send({
    //     username: admin.username,
    //     password: admin.password
    //   })
    //   .expect(200, function (err, res) {
    //     if(!err) {
    //       adminAccessToken = res.body.id;
    //     }
    //     done(err);
    //   });
  });



  describe('管理员账号登录', function () {

    it('POST /api/admins/login use amdin account', function (done) {
      json('post','/api/admins/login')
        .send({
          username: admin.username,
          password: admin.password
        })
        .expect(200, function (err, res) {
          if(!err) {
            adminAccessToken = res.body.id;
            // adminId = res.body.userId;
          }
          done(err);
        });
    });

    it('GET /api/admins with access_token', function (done) {
      json('get','/api/admins?access_token='+adminAccessToken)
        .expect(200, done);
    });

  });

  describe('用户状态 deleted  status 不符合条件无法登录', function () {

    it('POST /api/admins/login user delete is true', function (done) {
      json('post','/api/admins/login')
        .send({
          username: deletedUser.username,
          password: deletedUser.password
        })
        .expect(401, function (err, res) {
          assert.equal('LOGIN_FAILED', res.body.error.code);
          done(err);
        });
    });

    it('POST /api/admins/login user status is false', function (done) {
      json('post','/api/admins/login')
        .send({
          username: statusFalseUser.username,
          password: statusFalseUser.password
        })
        .expect(401, function (err, res) {
          assert.equal('LOGIN_FAILED', res.body.error.code);
          done(err);
        });
    });

  });

  describe('用户状态正常, 符合登录条件 登录成功', function () {

    it('POST /api/admins/login user status all true', function (done) {
      json('post','/api/admins/login')
        .send({
          username: theone.username,
          password: theone.password
        })
        .expect(200, function (err, res) {
          assert.equal(theone.id, res.body.userId);
          done(err);
        });
    });

  });

});







//
