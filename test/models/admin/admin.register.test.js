'use strict';

/**
 * admin 的注册
 * ---------------------
 * 规则:
 * 1. 注册人身份 只允许 admin 注册
 * 2. 注册信息验证
 */

const assert = require('assert');
const async = require('async');

const app = require('../../../server/server');
const help = require('../../help.js');
const fixtureData = require('../../fixtureData.js');
const json = help.json;
const getAccessTokenByUser = help.getAccessTokenByUser;


const admin = fixtureData.admin;
const theone = fixtureData.theone;
const foo = fixtureData.foo;
const updateUser = fixtureData.updateUser;
const deletedUser = fixtureData.deletedUser;
const statusFalseUser = fixtureData.statusFalseUser;

const usersData = [admin, theone, foo, updateUser, deletedUser, statusFalseUser];
let adminAccessToken;
let fooAccessToken;
// var adminId = '';


describe('admin register', () => {
  // before(function(done) {
  //   require('../../start-server');
  //   done();
  // });

  after((done) => {
    app.removeAllListeners('started');
    app.removeAllListeners('loaded');
    done();
  });

  before('初始化移除所有测试数据库数据', (done) => {
    app.dataSources.mysqlDs.autoupdate('Admin', (err) => {
      if (err) {
        done(err);
      } else {
        async.eachSeries(usersData, (user, callback) => {
          app.models.Admin.upsert(user, callback);
        }, done);
      }
    });
  });

  before((done) => {
    app.models.Admin.destroyAll({ description: 'test' }, done);
  });

  after((done) => {
    app.models.Admin.destroyAll({ description: 'test' }, done);
  });


  before('获取 admin 账号的 access_token', (done) => {
    getAccessTokenByUser(admin, (err, tokenId) => {
      if (!err) {
        adminAccessToken = tokenId;
      }
      done(err);
    });
  });

  before('获取 foo 账号的 access_token', (done) => {
    getAccessTokenByUser(foo, (err, tokenId) => {
      if (!err) {
        fooAccessToken = tokenId;
      }
      done(err);
    });
  });


  describe('不允许非登录用户注册', () => {
    it('POST /api/admins without access_token', (done) => {
      json('post', '/api/admins')
        .send({
          username: 'newUser',
          password: '123456',
          description: 'test',
          email: '291@qq.com',
        })
        .expect(401, (err, res) => {
          // assert.equal('Authorization Required', res.body.error.message);
          assert.equal('AUTHORIZATION_REQUIRED', res.body.error.code);
          done(err);
        });
    });
  });

  describe('不允许普通用户注册', () => {
    it('POST /api/admins with foo access_token', (done) => {
      json('post', `/api/admins?access_token=${fooAccessToken}`)
        .send({
          username: 'newUser',
          password: '123456',
          description: 'test',
          email: '291@qq.com',
        })
        .expect(401, (err, res) => {
          // console.log(res.body);
          assert.equal('AUTHORIZATION_REQUIRED', res.body.error.code);
          done(err);
        });
    });
  });

  describe('只允许 Role admin 注册', () => {
    it('POST /api/admins with admin access_token', (done) => {
      json('post', `/api/admins?access_token=${adminAccessToken}`)
        .send({
          username: 'newUser',
          password: '123456',
          description: 'test',
          email: '291@qq.com',
        })
        .expect(200, (err, res) => {
          // console.log(res.body);
          assert.equal(res.body.username, 'newUser');
          done(err);
        });
    });

    it('POST /api/admins with admin access_token with out password', (done) => {
      json('post', `/api/admins?access_token=${adminAccessToken}`)
        .send({
          username: 'myTest',
          description: 'test',
          email: '292@qq.com',
        })
        .expect(200, (err, res) => {
          // console.log(res.body);
          assert.equal('myTest', res.body.username);
          done(err);
        });
    });


    describe('注册用户信息 字段验证', () => {
      it('POST /api/admins with admin access_token fields too long', (done) => {
        json('post', `/api/admins?access_token=${adminAccessToken}`)
          .send({
            username: 'newUserlonglonglonglong',
            password: '1111111111111111111',
            description: 'test',
            email: 'longlonglong111111',
          })
          .expect(422, (err, res) => {
            // console.log(res.body.error.details);
            assert.equal(res.body.error.details.codes.email[0], 'format');
            assert.equal(res.body.error.details.codes.password[0], 'custom');
            assert.equal(res.body.error.details.codes.username[0], 'length.max');
            done(err);
          });
      });

      it('POST /api/admins with admin access_token fields to short', (done) => {
        json('post', `/api/admins?access_token=${adminAccessToken}`)
          .send({
            username: 'ne',
            password: '1',
            description: 'test',
            email: 'wbj@theone.io',
          })
          .expect(422, (err, res) => {
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
