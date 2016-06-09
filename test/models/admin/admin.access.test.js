/**
 * 用户的访问控制
 * ---------------------
 * 规则:
 * 1. 列表等其他信息只能登录后访问
 *
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
var adminAccessToken;
// var adminId;

describe('admin access', function() {

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
  });



  describe('无 token 访问', function () {
    it('GET /api/admins without access_token', function (done) {
      json('get','/api/admins')
        .expect(401, function (err, res) {
          assert.equal('AUTHORIZATION_REQUIRED', res.body.error.code);
          done(err);
        });
    });
  });

  describe('带 token 访问', function () {

    it('GET /api/admins with admin access_token', function (done) {
      json('get','/api/admins?access_token='+adminAccessToken)
        .expect(200, done);
    });

  });


});
