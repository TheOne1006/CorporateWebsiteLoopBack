'use strict';

/**
 * admin 移除禁用
 * ---------------------
 * 规则:
 * 1. 删除只做逻辑删除
 * 2. 普通用户无权 执行删除
 * 3. Role admin 可以删除普通用户
 * 4. Role admin 是否有权删除自己 ??
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

var fooAccessToken;
var adminAccessToken;
// var adminId = '';


describe('admin delete', function() {

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

  before('更新测试目标的数据 account foo', function (done) {
    app.models.Admin.update({username:foo.username},{deleted:false, status:true}, done);
  });

  after('修正测试目标的数据 account foo', function (done) {
    app.models.Admin.update({username:foo.username},{deleted:false, status:true}, done);
  });

  before('获取 admin 账号的 access_token', function (done) {
    help.getAccessTokenByUser(admin, function (err, tokenId) {
      if(!err) {
        adminAccessToken = tokenId;
      }
      done(err);
    });
  });

  before('获取 foo 账号的 access_token', function (done) {
    help.getAccessTokenByUser(foo, function (err, tokenId) {
      if(!err) {
        fooAccessToken = tokenId;
      }
      done(err);
    });
  });

  describe('普通用户无权 执行删除', function () {
    it('DELETE /api/admins delete account admin', function (done) {
      json('delete',`/api/admins/${admin.id}?access_token=${fooAccessToken}`)
        .expect(401, function (err, res) {
          // console.log(res.body);
          assert.equal('AUTHORIZATION_REQUIRED', res.body.error.code);
          done(err);
        });
    });

    it('DELETE /api/admins delete account theone', function (done) {
      json('delete',`/api/admins/${theone.id}?access_token=${fooAccessToken}`)
        .expect(401, function (err, res) {
          // console.log(res.body);
          assert.equal('AUTHORIZATION_REQUIRED', res.body.error.code);
          done(err);
        });
    });

    it('DELETE /api/admins delete account self', function (done) {
      json('delete',`/api/admins/${foo.id}?access_token=${fooAccessToken}`)
        .expect(401, function (err, res) {
          // console.log(res.body);
          assert.equal('AUTHORIZATION_REQUIRED', res.body.error.code);
          done(err);
        });
    });

  });

  describe('Role admin 执行删除', function () {
    it('DELETE /api/admins admin delete foo', function (done) {
      json('delete',`/api/admins/${foo.id}?access_token=${adminAccessToken}`)
        .expect(200, function (err, res) {
          // console.log(res.body);
          assert.equal(res.body.count, 1);
          done(err);
        });
    });

    it.skip('DELETE /api/admins : 超级管理员无法删除自己', function () {});

    describe('删除只做逻辑删除', function () {
      it('GET /api/admins/{id} get foo', function (done) {
        json('get',`/api/admins/${foo.id}?access_token=${adminAccessToken}`)
          .expect(200, function (err, res) {
            assert.equal(true, res.body.deleted);
            done(err);
          });
      });
    });
  });


});







// -
