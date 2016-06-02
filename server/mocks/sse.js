/*jshint node:true*/
module.exports = function(app) {
  var sse = require('express-server-sent-events');
  
  app.get('/sse', sse, function(req, res) {
    setInterval(function() {
      res.sse('data: ' + new Date().toISOString() + '\n\n');
    }, 900);
  });
};
