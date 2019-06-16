'use strict'

const router = require('express').Router();
const config = require('config');
process.env["NODE_CONFIG_DIR"] = __dirname + '/../config/';
const MongoClient = require('mongodb').MongoClient;

// Database Config
const dbUrl = 'mongodb+srv://' + config.db.user + ':' + config.db.pass + '@' + config.db.host;

// List Org API
router.get('/', (req, res) => {

  // Common Settings
  res.set('Content-Type', 'application/json');

  // Initialize Response Message
  let msg = {};


  // Connect to Database
  const client = new MongoClient(dbUrl, {
    useNewUrlParser: true,
    reconnectTries: 3,
    reconnectInterval: 1000
  });

  client.connect(function(err, client) {

    console.log('connected to server');

    // Database and Collections
    const db = client.db(config.db.name);
    const orgs = db.collection(config.db.col.orgs);

    // Check if Org exists in 'orgs' Collection
    orgs.find({}).toArray( function(err, docs) {

      if (err) {

        res.status(500);
        msg = {title: 'error occurred querying database'};
        res.send(JSON.stringify(msg, null, 4));

      } else if (!docs) {

        res.status(404);
        msg = {title: 'orgName not found.'};
        res.send(JSON.stringify(msg, null, 4));

      } else {

        res.status(200);
        msg = docs;
        res.send(JSON.stringify(msg, null, 4));

      }

    });

  });

});


// Add Org User API
router.post('/:orgName/users', (req, res) => {

  // Request Parameter
  const data = req.body;
  const orgName = req.params.orgName;

  // Common Settings
  res.set('Content-Type', 'application/json');

  // Initialize Response Message
  let msg = {};

  // Checking Required Parameter
  if (orgName === undefined) {

    res.status(404);
    msg = {title: 'missing required parameter'};
    res.send(JSON.stringify(msg, null, 4));

  } else {

    // Connect to Database
    const client = new MongoClient(dbUrl, {
      useNewUrlParser: true,
      reconnectTries: 3,
      reconnectInterval: 1000
    });

    client.connect(function(err, client) {

      console.log('connected to server');

      // Database and Collections
      const db = client.db(config.db.name);
      const orgs = db.collection(config.db.col.orgs);

      // Check if Org exists in 'orgs' Collection
      orgs.findOne({orgName: orgName}, function(err, docs) {

        if (err) {

          console.log(err);
          res.status(500);
          msg = {title: 'error occurred querying database'};
          res.send(JSON.stringify(msg, null, 4));

        } else if (!docs) {

          res.status(404);
          msg = {title: 'orgName not found'};
          res.send(JSON.stringify(msg, null, 4));

        } else {

          let orgUsers = docs.orgUsers;
          orgUsers.push(data);
          const updateInfo = {
            orgUsers: orgUsers 
          };
          orgs.updateOne({orgName: orgName}, {$set: updateInfo}, function(err, docs) {

            if (err) {

              console.log(err);
              res.status(500);
              msg = {title: 'error occurred updating document'};
              res.send(JSON.stringify(msg, null, 4));

            } else {

              console.log('document updated in orgs collection');
              res.status(201);
              msg = docs;
              res.send(JSON.stringify(msg, null, 4));

            }

          })

        }

      });

    });

  }

});

module.exports = router;
