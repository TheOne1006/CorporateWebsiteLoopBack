/**
 * 测试 路由
 */

import app from '../server/server';
import request from 'supertest';
import './start-server';

describe('REST API request', () => {
  // before((done) => {
  //   import './start-server';
  //   done();
  // });

  after((done) => {
    app.removeAllListeners('started');
    app.removeAllListeners('loaded');
    done();
  });

  describe('GET /', () => {
    it('测试访问首页', (done) => {
      request(app)
        .get('/')
        .expect(200, done);
    });
  });
});
