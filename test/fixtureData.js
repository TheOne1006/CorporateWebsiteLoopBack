const admin = { id: 1,
  username: 'admin',
  password: '123123',
  email: 'admin@admin.com',
  description: 'admin' };

const theone = {id: 2,
  username: 'theone',
  password: '123456',
  email:'wbj@theone.io',
  description:'普通管理员' };
const foo = {id:3, username:'foo',password:'123456', email:'foo@foo.com', description:'普通用户'};
const updateUser = {id:4, username:'updateUser',password:'123456', email:'email@update.com', description:'普通用户'};
const deletedUser = {id: 5, username:'deletedUser', password:'123456', email:'email@deleted.com',description:'普通用户', deleted:true};
const statusFalseUser = {id: 6, username:'statusUser', password:'123456', email:'email@status.com',description:'普通用户', status:false};

module.exports = {
  admin,
  theone,
  foo,
  updateUser,
  deletedUser,
  statusFalseUser,
};
