/*jshint node:true*/
module.exports = function(app) {
  var express = require('express');
  var personRouter = express.Router();

  personRouter.get('/:id', function(req, res) {
    if (Math.floor(Math.random()*2) === 1) {
      res.send({
        'person': {
          id: req.params.id,
          name: 'Lisbeth Salander'
        }
      });
    } else {
      res.status(500);
      res.send('Some random error');
    }
  });
  
  app.use('/api/person', personRouter);
};
