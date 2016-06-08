/**
 * 测试 路由
 */

var app = require('../server/server');
var request = require('supertest');
// var assert = require('assert');
// var loopback = require('loopback');
//
// function json(verb, url) {
//   return request(app)[verb](url)
//     .set('Content-Type', 'application/json')
//     .set('Accept', 'application/json')
//     .expect('Content-Type', /json/);
// }


describe('REST API request', function() {
  before(function(done) {
    require('./start-server');
    done();
  });

  after(function(done) {
    app.removeAllListeners('started');
    app.removeAllListeners('loaded');
    done();
  });

  describe('GET /', function () {

    it('测试访问首页', function(done){
      request(app)
        .get('/')
        .expect(200, done);
    });

  });

});
