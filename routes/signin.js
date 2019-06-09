'use strict'

const router = require('express').Router();
const config = require('config');
process.env["NODE_CONFIG_DIR"] = __dirname + '/../config/';
const MongoClient = require('mongodb').MongoClient;

// Password Hash Generator
const getHash = require(__dirname + '/../modules/getHash');

// Database Config
const dbUrl = 'mongodb+srv://' + config.db.user + ':' + config.db.pass + '@' + config.db.host;

// Sing In API
router.post('/', (req, res) => {

  // Request Parameters
  const username = req.body.username;
  const password = req.body.password;

  // Common Setting
  let options = { method: 'POST' };
  res.set('Content-Type', 'application/json');

  // Initialize Response Message
  let msg = {};

  // Check Required Parameters
  if (username === undefined || password === undefined) {

    res.status(400);
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
      const users = db.collection(config.db.col.users);

      // Check if User exists in 'users' collection
      users.findOne({username: username}, function(err, docs) {

        if (err) {

          console.log(err);
          res.status(500);
          msg = {title: 'error occurred querying database'};
          res.send(JSON.stringify(msg, null, 4));

        } else if (!docs) {

          res.status(404);
          msg = {title: 'username not found'};
          res.send(JSON.stringify(msg, null, 4));

        } else {

          // Validate Password
          if (docs.password === getHash(password)) {

            res.status(201);
            //msg = { user: docs };
            msg = {
              username: username,
              email: docs.email,
              created: new Date(docs.created * 1000),
              id: docs._id
            };
            res.send(JSON.stringify(msg, null, 4));

          } else {

            res.status(401);
            msg = {title: 'incorrect password.'};
            res.send(JSON.stringify(msg, null, 4));

          }

        }

      });

    });

  }

});

module.exports = router;
