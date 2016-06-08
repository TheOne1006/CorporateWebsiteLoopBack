const async = require('async');
const debug = require('debug')('app:server:boot');

module.exports = (app, next) => {
  /**
   * 初始化 Admin 数据, 用于搜索或者创建
   * @type {Array}
   */
  const initAdmins = [
    { id: 1,
      username: 'admin',
      password: '123123',
      email: 'admin@admin.com',
      description: 'admin',
      status: true,
      deleted: false },
    { id: 2,
    username: 'theone',
    password: '123456',
    email: 'wbj@theone.io',
    description: '普通管理员',
    status: true,
    deleted: false },
  ];

  const initRoles = [
    { id: 1, name: 'admin', description: '超级管理员' },
  ];

  const initRoleMap = { id: 1, principalId: 1, roleId: 1 };
  const Role = app.models.Role;
  const RoleMapping = app.models.RoleMapping;
  // const Admin = app.models.Admin;

  /**
   * 更新数据结构, 写入默认数据
   */
  function createAdmins(callback) {
    /**
     * Model to dbsource
     * 通过 Model json 文件修改数据结构
     */
    app.dataSources.mysqlDs.autoupdate('Admin', (err) => {
      debug('created Admin');

      if (err) {
        return callback(err);
      }

      /**
       * 创建、更新 默认 admin 账号
       */
      return app.dataSources.mysqlDs.autoupdate('Admin', (error) => {
        if (error) {
          return callback(error);
        }

        return async.eachSeries(initAdmins, (user, done) => {
          app.models.Admin.findOrCreate({
            where: { username: user.username },
          }, user, (e, userIn) => {
            if (!e) debug(userIn);
            done(err);
          });
        }, callback);
      });
    });
  }

  /**
   * Role 建表，更新字段, 更新,写入默认数据
   */
  function createRoles(callback) {
    app.dataSources.mysqlDs.autoupdate('Role', (err) => {
      if (err) {
        callback(err);
      } else {
        async.each(initRoles,
          (role, done) => {
            Role.findOrCreate({ id: role.id }, role, done);
          }, callback);
      }
    });
  }

  /**
   * Role Map 建表，更新字段
   */
  function createRoleMapTable(callback) {
    app.dataSources.mysqlDs.autoupdate('RoleMapping', (err) => {
      if (err) {
        callback(err);
      } else {
        initRoleMap.principalType = RoleMapping.USER;
        RoleMapping.findOrCreate({ id: 1 }, initRoleMap, callback);
      }
    });
  }

  async.auto({
    createAdmins,
    createRoles,
    createRoleMapTable,
  }, (err) => {
    if (err) {
      throw err;
    }
    next();
  });
};
