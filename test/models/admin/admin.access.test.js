/**
 * 用户的访问控制
 * ---------------------
 * 规则:
 * 1. 列表等其他信息只能登录后访问
 *
 */


import assert from 'assert';
import async from 'async';

import app from '../../../server/server';
import { json, getAccessTokenByUser } from '../../help.js';
import { admin, theone, foo, updateUser, deletedUser, statusFalseUser } from '../../fixtureData.js';
import '../../start-server';

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
