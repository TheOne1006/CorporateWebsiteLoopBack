'use strict';

/**
 * admin 的属性更新
 * ---------------------
 * 规则:
 * 1.
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



describe('admin update',function () {

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

  before('获取 foo 账号的 access_token', function (done) {
    help.getAccessTokenByUser(foo, function (err, tokenId) {
      if(!err) {
        fooAccessToken = tokenId;
      }
      done(err);
    });
  });

  before('更新测试目标的数据', function (done) {
    app.models.Admin.upsert(foo, done);
  });

  after('恢复测试目标的数据', function (done) {
    app.models.Admin.upsert(foo, done);
  });

  describe('user update 数据更新', function () {

    after('清除 foo 的 mobile', function (done) {
      app.models.Admin.update({username: foo.username},{mobile: null}, done);
    });

    it('PUT /api/admins with foo', function (done) {
      json('put', `/api/admins/${foo.id}?access_token=${fooAccessToken}`)
        .send({
          mobile: '13822556776'
        })
        .expect(401, function (err, res) {
          assert.equal('AUTHORIZATION_REQUIRED', res.body.error.code);
          done(err);
        });
    });

    it('PUT /api/admins with admin', function (done) {
      json('put', `/api/admins/${foo.id}?access_token=${adminAccessToken}`)
        .send({
          mobile: '13822556776'
        })
        .expect(200, function (err, res) {
          assert.equal('13822556776', res.body.mobile);
          done(err);
        });
    });

  });

  describe('user updatePassword', function () {

    describe('无登陆状态无法修改自己密码', function () {
      it('PUT /api/admins/{id}/updatePassword without access_token', function (done) {
        json('put', `/api/admins/${foo.id}/updatePassword`)
          .send({
            password: '123123',
            oldPassword: foo.password
          })
          .expect(401, function (err, res) {
            assert.equal('AUTHORIZATION_REQUIRED', res.body.error.code);
            done(err);
          });
      });
    });

    describe('普通账号无法修改别人的密码', function () {
      it('PUT /api/admins/{id}/updatePassword try modify other user', function (done) {
        json('put', `/api/admins/${theone.id}/updatePassword?access_token=${fooAccessToken}`)
          .send({
            password: '123123',
            oldPassword: theone.password
          })
          .expect(401, function (err, res) {
            // console.log(res.body);
            assert.equal('AUTHORIZATION_REQUIRED', res.body.error.code);
            done(err);
          });
      });
    });

    describe('原始密码错误无法修改', function () {
      it('PUT /api/admins/{id}/updatePassword', function (done) {
        json('put', `/api/admins/${foo.id}/updatePassword?access_token=${fooAccessToken}`)
          .send({
            password: '123123',
            oldPassword: 'failpassword'
          })
          .expect(401, function (err, res) {
            // console.log(res.body);
            assert.equal('UPDATE_PASSOWRD_FAILED', res.body.error.code);
            done(err);
          });
      });
    });

    describe('普通账号可以修改自己的密码', function () {
      it('PUT /api/admins/{id}/updatePassword', function (done) {
        json('put', `/api/admins/${foo.id}/updatePassword?access_token=${fooAccessToken}`)
          .send({
            password: '123123',
            oldPassword: foo.password
          })
          .expect(200, function (err, res) {
            // console.log(res.body);
            assert.equal(foo.username, res.body.username);
            done(err);
          });
      });

      it('POST /api/admins/login login use new password', function (done) {
        json('post','/api/admins/login')
          .send({
            username: foo.username,
            password: '123123'
          })
          .expect(200, function (err, res) {
            // console.log(res.body);
            assert.equal(foo.id, res.body.userId);
            done();
          });
      });

      it('PUT /api/admins/{id}/updatePassword with out password', function (done) {
        json('put', `/api/admins/${foo.id}/updatePassword?access_token=${fooAccessToken}`)
          .send({
            oldPassword: '123123'
          })
          .expect(400, function (err, res) {
            // console.log(res.body);
            assert.equal('password is a required arg', res.body.error.message);
            done(err);
          });
      });

      it('PUT /api/admins/{id}/updatePassword with out oldPassword', function (done) {
        json('put', `/api/admins/${foo.id}/updatePassword?access_token=${fooAccessToken}`)
          .send({
            password: '123123'
          })
          .expect(400, function (err, res) {
            // console.log(res.body);
            assert.equal('oldPassword is a required arg', res.body.error.message);
            done(err);
          });
      });


    });

    describe('Role admin 账号可以任意账号密码',function () {
      it('PUT /api/admins modify foo password', function(done){

        json('put', `/api/admins/${foo.id}?access_token=${adminAccessToken}`)
          .send({
            password: '111111'
          })
          .expect(200, function (err, res) {
            // console.log(res.body);
            assert.equal(foo.id, res.body.id);
            done(err);
          });
      });

      it('POST /api/admins/login login use new password(admin modify)', function (done) {
        json('post','/api/admins/login')
          .send({
            username: foo.username,
            password: '111111'
          })
          .expect(200, function (err, res) {
            // console.log(res.body);
            assert.equal(foo.id, res.body.userId);
            done(err);
          });
      });

    });

  });
});
