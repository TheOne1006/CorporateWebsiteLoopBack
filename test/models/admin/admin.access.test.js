'use strict';

/**
 * 用户的访问控制
 * ---------------------
 * 规则:
 * 1. 列表等其他信息只能登录后访问
 *
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
// var adminId;

describe('admin access', () => {
  // before((done) => {
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

  before('获取 admin 账号的 access_token', (done) => {
    getAccessTokenByUser(admin, (err, tokenId) => {
      if (!err) {
        adminAccessToken = tokenId;
      }
      done(err);
    });
  });

  describe('无 token 访问', () => {
    it('GET /api/admins without access_token', (done) => {
      json('get', '/api/admins')
        .expect(401, (err, res) => {
          assert.equal('AUTHORIZATION_REQUIRED', res.body.error.code);
          done(err);
        });
    });
  });

  describe('带 token 访问', () => {
    it('GET /api/admins with admin access_token', (done) => {
      json('get', `/api/admins?access_token=${adminAccessToken}`)
        .expect(200, done);
    });
  });
});
