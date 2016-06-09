/**
 * admin 的登录测试
 * ---------------------
 * 规则:
 * 1. 用户状态 deleted true 无法登录
 * 2. 用户状态 status 无法登录
 */

import assert from 'assert';
import async from 'async';

import app from '../../../server/server';
import { json, getAccessTokenByUser } from '../../help.js';
import { admin, theone, foo, updateUser, deletedUser, statusFalseUser } from '../../fixtureData.js';
import '../../start-server';

const usersData = [admin, theone, foo, updateUser, deletedUser, statusFalseUser];

let adminAccessToken;
// var adminId = '';


describe('admin login', () => {
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


  before('获取 admin 账号的 access_token', (done) => {
    getAccessTokenByUser(admin, (err, tokenId) => {
      if (!err) {
        adminAccessToken = tokenId;
      }
      done(err);
    });
  });

  describe('管理员账号登录', () => {
    it('POST /api/admins/login use amdin account', (done) => {
      json('post', '/api/admins/login')
        .send({
          username: admin.username,
          password: admin.password,
        })
        .expect(200, (err, res) => {
          if (!err) {
            adminAccessToken = res.body.id;
            // adminId = res.body.userId;
          }
          done(err);
        });
    });

    it('GET /api/admins with access_token', (done) => {
      json('get', `/api/admins?access_token=${adminAccessToken}`)
        .expect(200, done);
    });
  });

  describe('用户状态 deleted  status 不符合条件无法登录', () => {
    it('POST /api/admins/login user delete is true', (done) => {
      json('post', '/api/admins/login')
        .send({
          username: deletedUser.username,
          password: deletedUser.password,
        })
        .expect(401, (err, res) => {
          assert.equal('LOGIN_FAILED', res.body.error.code);
          done(err);
        });
    });

    it('POST /api/admins/login user status is false', (done) => {
      json('post', '/api/admins/login')
        .send({
          username: statusFalseUser.username,
          password: statusFalseUser.password,
        })
        .expect(401, (err, res) => {
          assert.equal('LOGIN_FAILED', res.body.error.code);
          done(err);
        });
    });
  });

  describe('用户状态正常, 符合登录条件 登录成功', () => {
    it('POST /api/admins/login user status all true', (done) => {
      json('post', '/api/admins/login')
        .send({
          username: theone.username,
          password: theone.password,
        })
        .expect(200, (err, res) => {
          assert.equal(theone.id, res.body.userId);
          done(err);
        });
    });
  });
});
