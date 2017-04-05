const Datastore = require('nedb');
const bcrypt = require('bcrypt');
const adminUsage = require('../../lib/adminUsage');

module.exports = function(app, db) {
  app.get('//admin_users', function (req, res) {
    db.admins.find({}, function(err, docs) {
      if (err !== null) {
        res.status(500).send({
          error: 'Internal server error'
        });
      }

      let adminList = [];
      for (let i = 0; i < docs.length; i++) {
        adminList.push({
          id: docs[i]._id,
          name: docs[i].name
        });
      }

      res.send(adminList);
    });
  });

  app.post('//admin_users/validate', function (req, res) {
    let id, password;
    try {
      id = req.body.id;
      password = req.body.password;
    } catch(e) {
      res.status(400).send({
        error: 'Bad request'
      });
      return;
    }

    db.admins.findOne({ _id: id }, function(err, docs) {
      if (err !== null) {
        console.log(err);
        res.status(500).send({
          error: 'Server error'
        });
      } else {
        if (docs === null) {
          res.status(404).send({
            error: 'Not found'
          });
        } else {
          bcrypt.compare(password, docs.password, function(err, result) {
            if (err !== undefined) {
              res.status(500).send({
                error: 'Server error'
              });
            } else {
              res.send({
                valid: result
              });
            }
          });
        }
      }
    });
  });

  app.post('//admin_users', function (req, res) {
    let name, password;
    try {
      name = req.body.name;
      password = req.body.password;
    } catch(e) {
      res.status(400).send({
        error: 'Bad request'
      });
      return;
    }

    db.admins.find({ name: name }, function(err, docs) {
      if (err !== null) {
        res.status(500).send({
          error: 'Internal server error'
        });
      }

      if (docs.length === 0) {
        bcrypt.hash(password, 10, function(err, hash) {
          db.admins.insert({
            name: name,
            password: hash
          }, function (err, newDoc) {
            if (err !== null) {
              console.log(err);
              res.status(500).send({
                error: 'Server error'
              });
            } else {
              adminUsage.log(req.adminRequest.user, req.adminRequest.time, 'Created new admin: ' + name);
              res.send({
                document: newDoc
              });
            }
          });
        });
      } else {
        res.status(400).send({
          duplicate: true,
          error: 'User already exists'
        });
      }
    });
  });

  app.patch('//admin_users', function (req, res) {
    let id, password;
    try {
      id = req.body.id;
      password = req.body.password;
    } catch(e) {
      res.status(400).send({
        error: 'Bad request'
      });
      return;
    }

    bcrypt.hash(password, 10, function(err, hash) {
      db.admins.update({ _id: id }, { $set: {password: hash} }, {}, function(err, numReplaced) {
        if (err !== null) {
          res.status(500).send({
            error: 'Server error'
          });
        } else {
          adminUsage.log(req.adminRequest.user, req.adminRequest.time, 'Changed password for admin: ' + id);
          res.send({
            updated: numReplaced
          });
        }
      });
    });
  });

  app.delete('//admin_users/:id', function (req, res) {
    let id;
    try {
      id = req.params.id;
    } catch(e) {
      res.status(400).send({
        error: 'Bad request'
      });
      return;
    }

    db.admins.remove({ _id: id }, {}, function (err, numRemoved) {
      if (err !== null) {
        res.status(500).send({
          error: 'Could not remove'
        });
        return;
      }

      adminUsage.log(req.adminRequest.user, req.adminRequest.time, 'Deleted admin: ' + id);
      res.send({
        removed: numRemoved
      });
    });
  });
};