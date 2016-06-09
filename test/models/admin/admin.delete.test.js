/**
 * admin 移除禁用
 * ---------------------
 * 规则:
 * 1. 删除只做逻辑删除
 * 2. 普通用户无权 执行删除
 * 3. Role admin 可以删除普通用户
 * 4. Role admin 是否有权删除自己 ??
 */


import assert from 'assert';
import async from 'async';

import app from '../../../server/server';
import { json, getAccessTokenByUser } from '../../help.js';
import { admin, theone, foo, updateUser, deletedUser, statusFalseUser } from '../../fixtureData.js';
import '../../start-server';

const usersData = [admin, theone, foo, updateUser, deletedUser, statusFalseUser];

let fooAccessToken;
let adminAccessToken;
// var adminId = '';


describe('admin delete', () => {
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

  before('更新测试目标的数据 account foo', (done) => {
    app.models.Admin.update({ username: foo.username }, { deleted: false, status: true }, done);
  });

  after('修正测试目标的数据 account foo', (done) => {
    app.models.Admin.update({ username: foo.username }, { deleted: false, status: true }, done);
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

  describe('普通用户无权 执行删除', () => {
    it('DELETE /api/admins delete account admin', (done) => {
      json('delete', `/api/admins/${admin.id}?access_token=${fooAccessToken}`)
        .expect(401, (err, res) => {
          // console.log(res.body);
          assert.equal('AUTHORIZATION_REQUIRED', res.body.error.code);
          done(err);
        });
    });

    it('DELETE /api/admins delete account theone', (done) => {
      json('delete', `/api/admins/${theone.id}?access_token=${fooAccessToken}`)
        .expect(401, (err, res) => {
          // console.log(res.body);
          assert.equal('AUTHORIZATION_REQUIRED', res.body.error.code);
          done(err);
        });
    });

    it('DELETE /api/admins delete account self', (done) => {
      json('delete', `/api/admins/${foo.id}?access_token=${fooAccessToken}`)
        .expect(401, (err, res) => {
          // console.log(res.body);
          assert.equal('AUTHORIZATION_REQUIRED', res.body.error.code);
          done(err);
        });
    });
  });

  describe('Role admin 执行删除', () => {
    it('DELETE /api/admins admin delete foo', (done) => {
      json('delete', `/api/admins/${foo.id}?access_token=${adminAccessToken}`)
        .expect(200, (err, res) => {
          // console.log(res.body);
          assert.equal(res.body.count, 1);
          done(err);
        });
    });

    it.skip('DELETE /api/admins : 超级管理员无法删除自己', () => {});

    describe('删除只做逻辑删除', () => {
      it('GET /api/admins/{id} get foo', (done) => {
        json('get', `/api/admins/${foo.id}?access_token=${adminAccessToken}`)
          .expect(200, (err, res) => {
            assert.equal(true, res.body.deleted);
            done(err);
          });
      });
    });
  });
});







// -
