// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: strong-gateway
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

import app from '../server/server';

module.exports = function start(done) {
  if (app.loaded) {
    app.once('started', done);
    app.start();
  } else {
    app.once('loaded', () => {
      app.once('started', done);
      app.start();
    });
  }
};
