const app = require('../server/server');
const request = require('supertest');

function json(verb, url) {
  return request(app)[verb](url)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/);
}

function userLoginGetAccessToken(user, callback) {
  app.models.Admin.login({ username: user.username, password: user.password },
    (err, token) => {
      callback(err, token.id);
    });
}

function getAccessTokenByUserId(user, callback) {
  app.models.AccessToken.findOne({ where: { userId: user.id } },
    (err, token) => {
      if (err) {
        callback(err);
      } else {
        if (token) {
          callback(err, token.id);
        } else {
          userLoginGetAccessToken(user, callback);
        }
      }
    });
}

function getAccessTokenByUser(user, callback) {
  app.models.Admin.findOne({ where: { username: user.username } },
    (err, userInstance) => {
      if (err || !userInstance) {
        // console.log('user is undefined');
        callback(err || new Error('user is undefined'));
      } else {
        user.id = userInstance.id;
        getAccessTokenByUserId(user, callback);
      }
    });
}

exports.json = json;
exports.getAccessTokenByUser = getAccessTokenByUser;
