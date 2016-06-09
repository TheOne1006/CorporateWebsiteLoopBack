// import app from '../server/server';
// import request from 'supertest';

var app = require('../server/server');
var request = require('supertest');

function json(verb, url) {
  return request(app)[verb](url)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/);
}

function getAccessTokenByUser(user, callback) {
  app.models.Admin.findOne({where:{username : user.username}}, function (err, userInstance) {
    if(err || !userInstance) {
      console.log('user is undefined');
      callback(err || new Error('user is undefined'));
    }else {
      user.id = userInstance.id;
      getAccessTokenByUserId(user, callback);
    }
  });
}

function getAccessTokenByUserId(user, callback) {
  app.models.AccessToken.findOne({where:{userId: user.id}}, function (err, token) {
    if(err) {
      return callback(err);
    }

    if(token) {
      callback(err, token.id);
    }else {
      userLoginGetAccessToken(user, callback);
    }

  });
}

function userLoginGetAccessToken(user, callback) {
  app.models.Admin.login({username: user.username, password: user.password}, function (err, token) {
    callback(err, token.id);
  });
}


exports.json = json;
exports.getAccessTokenByUser = getAccessTokenByUser;
