'use strict';

/**
 * admin 的注册
 * ---------------------
 * 规则:
 * 1. 注册人身份 只允许 admin 注册
 * 2. 注册信息验证
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


describe('admin register', function() {

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

  before(function (done) {
    app.models.Admin.destroyAll({description:'test'}, done);
  });

  after(function (done) {
    app.models.Admin.destroyAll({description:'test'}, done);
  });


  before('获取 admin 账号的 access_token', function (done) {
    help.getAccessTokenByUser(admin, function (err, tokenId) {
      if(!err) {
        adminAccessToken = tokenId;
      }
      done(err);
    });
  });




  describe('不允许非登录用户注册', function () {
    it('POST /api/admins without access_token', function (done) {
      json('post','/api/admins')
        .send({
          username: 'newUser',
          password: '123456',
          description: 'test',
          email: '291@qq.com',
        })
        .expect(401, function (err, res) {
          // assert.equal('Authorization Required', res.body.error.message);
          assert.equal('AUTHORIZATION_REQUIRED', res.body.error.code);
          done(err);
        });
    });
  });

  describe('不允许普通用户注册', function () {
    var fooAccessToken;

    it('POST /api/admins/login with account foo', function (done) {
      json('post','/api/admins/login')
        .send({
          username: foo.username,
          password: foo.password,
        })
        .expect(200, function (err, res) {
          if(!err) {
            fooAccessToken = res.body.id;
          }

          done(err);
        });
    });

    it('POST /api/admins with foo access_token', function (done) {
      json('post',`/api/admins?access_token=${fooAccessToken}`)
        .send({
          username: 'newUser',
          password: '123456',
          description: 'test',
          email: '291@qq.com',
        })
        .expect(401, function (err, res) {
          // console.log(res.body);
          assert.equal('AUTHORIZATION_REQUIRED', res.body.error.code);
          done(err);
        });
    });

  });

  describe('只允许 Role admin 注册', function () {

    it('POST /api/admins with admin access_token', function (done) {
      json('post',`/api/admins?access_token=${adminAccessToken}`)
        .send({
          username: 'newUser',
          password: '123456',
          description: 'test',
          email: '291@qq.com'
        })
        .expect(200, function (err, res) {
          // console.log(res.body);
          assert.equal(res.body.username, 'newUser');
          done(err);
        });
    });

    it('POST /api/admins with admin access_token with out password', function (done) {
      json('post',`/api/admins?access_token=${adminAccessToken}`)
        .send({
          username: 'myTest',
          description: 'test',
          email: '292@qq.com'
        })
        .expect(200, function (err, res) {
          // console.log(res.body);
          assert.equal('myTest', res.body.username);
          done(err);
        });
    });


    describe('注册用户信息 字段验证', function () {

      it('POST /api/admins with admin access_token fields too long', function (done) {
        json('post',`/api/admins?access_token=${adminAccessToken}`)
          .send({
            username: 'newUserlonglonglonglong',
            password: '1111111111111111111',
            description: 'test',
            email: 'longlonglong111111'
          })
          .expect(422, function (err, res) {
            // console.log(res.body.error.details);
            assert.equal(res.body.error.details.codes.email[0], 'format');
            assert.equal(res.body.error.details.codes.password[0], 'custom');
            assert.equal(res.body.error.details.codes.username[0], 'length.max');
            done(err);
          });
      });

      it('POST /api/admins with admin access_token fields to short', function (done) {
        json('post',`/api/admins?access_token=${adminAccessToken}`)
          .send({
            username: 'ne',
            password: '1',
            description: 'test',
            email: 'wbj@theone.io'
          })
          .expect(422, function (err, res) {
            // console.log(res.body.error.details);
            assert.equal(res.body.error.details.codes.email[0], 'uniqueness');
            assert.equal(res.body.error.details.codes.password[0], 'custom');
            assert.equal(res.body.error.details.codes.username[0], 'length.min');
            done(err);
          });
      });



    });

  });


});




// -
