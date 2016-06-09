'use strict';

/**
 * admin 的属性更新
 * ---------------------
 * 规则:
 * 1.
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

describe('admin update', () => {
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

  before('获取 foo 账号的 access_token', (done) => {
    getAccessTokenByUser(foo, (err, tokenId) => {
      if (!err) {
        fooAccessToken = tokenId;
      }
      done(err);
    });
  });

  before('更新测试目标的数据', (done) => {
    app.models.Admin.upsert(foo, done);
  });

  after('恢复测试目标的数据', (done) => {
    app.models.Admin.upsert(foo, done);
  });

  describe('user update 数据更新', () => {
    after('清除 foo 的 mobile', (done) => {
      app.models.Admin.update({ username: foo.username }, { mobile: null }, done);
    });

    it('PUT /api/admins with foo', (done) => {
      json('put', `/api/admins/${foo.id}?access_token=${fooAccessToken}`)
        .send({
          mobile: '13822556776',
        })
        .expect(401, (err, res) => {
          assert.equal('AUTHORIZATION_REQUIRED', res.body.error.code);
          done(err);
        });
    });

    it('PUT /api/admins with admin', (done) => {
      json('put', `/api/admins/${foo.id}?access_token=${adminAccessToken}`)
        .send({
          mobile: '13822556776',
        })
        .expect(200, (err, res) => {
          assert.equal('13822556776', res.body.mobile);
          done(err);
        });
    });
  });

  describe('user updatePassword', () => {
    describe('无登陆状态无法修改自己密码', () => {
      it('PUT /api/admins/{id}/updatePassword without access_token', (done) => {
        json('put', `/api/admins/${foo.id}/updatePassword`)
          .send({
            password: '123123',
            oldPassword: foo.password,
          })
          .expect(401, (err, res) => {
            assert.equal('AUTHORIZATION_REQUIRED', res.body.error.code);
            done(err);
          });
      });
    });

    describe('普通账号无法修改别人的密码', () => {
      it('PUT /api/admins/{id}/updatePassword try modify other user', (done) => {
        json('put', `/api/admins/${theone.id}/updatePassword?access_token=${fooAccessToken}`)
          .send({
            password: '123123',
            oldPassword: theone.password,
          })
          .expect(401, (err, res) => {
            // console.log(res.body);
            assert.equal('AUTHORIZATION_REQUIRED', res.body.error.code);
            done(err);
          });
      });
    });

    describe('原始密码错误无法修改', () => {
      it('PUT /api/admins/{id}/updatePassword', (done) => {
        json('put', `/api/admins/${foo.id}/updatePassword?access_token=${fooAccessToken}`)
          .send({
            password: '123123',
            oldPassword: 'failpassword',
          })
          .expect(401, (err, res) => {
            // console.log(res.body);
            assert.equal('UPDATE_PASSOWRD_FAILED', res.body.error.code);
            done(err);
          });
      });
    });

    describe('普通账号可以修改自己的密码', () => {
      it('PUT /api/admins/{id}/updatePassword', (done) => {
        json('put', `/api/admins/${foo.id}/updatePassword?access_token=${fooAccessToken}`)
          .send({
            password: '123123',
            oldPassword: foo.password,
          })
          .expect(200, (err, res) => {
            // console.log(res.body);
            assert.equal(foo.username, res.body.username);
            done(err);
          });
      });

      it('POST /api/admins/login login use new password', (done) => {
        json('post', '/api/admins/login')
          .send({
            username: foo.username,
            password: '123123',
          })
          .expect(200, (err, res) => {
            // console.log(res.body);
            assert.equal(foo.id, res.body.userId);
            done();
          });
      });

      it('PUT /api/admins/{id}/updatePassword with out password', (done) => {
        json('put', `/api/admins/${foo.id}/updatePassword?access_token=${fooAccessToken}`)
          .send({
            oldPassword: '123123',
          })
          .expect(400, (err, res) => {
            // console.log(res.body);
            assert.equal('password is a required arg', res.body.error.message);
            done(err);
          });
      });

      it('PUT /api/admins/{id}/updatePassword with out oldPassword', (done) => {
        json('put', `/api/admins/${foo.id}/updatePassword?access_token=${fooAccessToken}`)
          .send({
            password: '123123',
          })
          .expect(400, (err, res) => {
            // console.log(res.body);
            assert.equal('oldPassword is a required arg', res.body.error.message);
            done(err);
          });
      });
    });

    describe('Role admin 账号可以任意账号密码', () => {
      it('PUT /api/admins modify foo password', (done) => {
        json('put', `/api/admins/${foo.id}?access_token=${adminAccessToken}`)
          .send({
            password: '111111',
          })
          .expect(200, (err, res) => {
            // console.log(res.body);
            assert.equal(foo.id, res.body.id);
            done(err);
          });
      });

      it('POST /api/admins/login login use new password(admin modify)', (done) => {
        json('post', '/api/admins/login')
          .send({
            username: foo.username,
            password: '111111',
          })
          .expect(200, (err, res) => {
            // console.log(res.body);
            assert.equal(foo.id, res.body.userId);
            done(err);
          });
      });
    });
  });
});
