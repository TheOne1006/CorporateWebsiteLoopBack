'use strict';

const debug = require('debug')('app:models:admin');

module.exports = (Admin) => {
  /**
   * 修改默认 PersistedModel 方法
   * --------------------------------
   * 在 Model 附属到 datasource 之后修改 deleteById
   */
  Admin.on('attached', () => {
    Admin.deleteById = (id, cb) => {
      Admin.update({ id }, { deleted: true }, cb);
    };
  });

  /**
   * 自动更新 lastUpdated 字段
   */
  Admin.observe('before save', (ctx, next) => {
    debug('before save :更新 lastUpdated 字段');

    if (ctx.instance) {
      ctx.instance.lastUpdated = Date.now();
    } else {
      ctx.data.lastUpdated = Date.now();
    }
    next();
  });

  // 修改属性默认值
  Admin.definition.properties.created.default = Date.now;
  Admin.definition.properties.lastUpdated.default = Date.now;
  // 禁用 delete
  Admin.disableRemoteMethod('__delete__accessTokens', false);
  Admin.disableRemoteMethod('__destroyById__accessTokens', false);

  /**
   * self login logic
   * 自定义的 login 规则
   */
  Admin.beforeRemote('login', (ctx, user, next) => {
    debug('before login 自己写的规则, 缺点 sql 数据查询两次');

    const credentials = ctx.req.body;
    const query = Admin.normalizeCredentials(credentials);
    let loginError;

    Admin.findOne({ where: query }, (err, userInstance) => {
      if (err || !userInstance || userInstance.deleted || !userInstance.status) {
        loginError = new Error('login failed');
        loginError.statusCode = 401;
        loginError.code = 'LOGIN_FAILED';
      }

      next(loginError);
    });
  });

  /**
   * 字段验证
   * ---------------------------------------
   * 验证规则
   */
  Admin.validatesLengthOf('username', {
    min: 3,
    max: 15,
    message: { min: '用户名长度太短', max: '用户名长度太长' },
  });
  /**
   * hack 系统bug 无法验证 password 字段
   */
  Admin.beforeRemote('create', (ctx, user, next) => {
    const context = Admin.app.loopback.getCurrentContext();


    if (context && ctx.req.body.password) {
      context.set('currentPassword', ctx.req.body.password);
    }
    next();
  });

  Admin.validateAsync('password', (err, done) => {
    const context = Admin.app.loopback.getCurrentContext();
    const currentPassword = (context && context.get('currentPassword')) || '';

    if (currentPassword) {
      if (currentPassword.length < 3 || currentPassword.length > 15) {
        err();
      }
    }

    done();
  },
  { message: '密码长度错误' });


  /**
   * --------------------------
   * Extend function
   * --------------------------
   */

  /**
   * 实例方法
   */
  Admin.prototype.updatePassword = function updatePassword(newPassword, oldPassword, cb) {
    const user = this;
    let defaultError;

    user.hasPassword(oldPassword, (err, isMatch) => {
      // err 或者不匹配
      if (err || !isMatch) {
        defaultError = new Error('update passowrd failed');
        defaultError.statusCode = 401;
        defaultError.code = 'UPDATE_PASSOWRD_FAILED';

        debug('An error is reported from User.hasPassword: %j', err);
        cb(defaultError);
      } else {
        // Admin.update({id: user.}, {password: newPassword}, cb);
        // user.password = newPassword;
        user.updateAttribute('password', newPassword, cb);
      }
    });
  };

  Admin.beforeRemote('prototype.updatePassword', (ctx, data, next) => {
    const context = Admin.app.loopback.getCurrentContext();

    if (context && ctx.req.body.password) {
      context.set('currentPassword', ctx.req.body.password);
    }

    next();
  });

  /**
   * ---------------------------
   * remoteMethod
   * ---------------------------
   */
  Admin.remoteMethod(
    'updatePassword',
    {
      description: '修改自己的密码',
      isStatic: false,
      accessType: 'WRITE',
      accepts: [
        { arg: 'password', type: 'string', required: true, description: '新密码' },
        { arg: 'oldPassword', type: 'string', required: true, description: '原始密码' },
      ],
      returns: { arg: 'data', type: 'object', root: true },
      http: { verb: 'put', path: '/updatePassword' },
    }
  );
};
