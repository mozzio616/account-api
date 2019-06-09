'use strict'

const router = require('express').Router();
const config = require('config');
process.env["NODE_CONFIG_DIR"] = __dirname + '/../config/';
const MongoClient = require('mongodb').MongoClient;

// Password Hash Generator
const getHash = require(__dirname + '/../modules/getHash');

// Database Config
const dbUrl = 'mongodb+srv://' + config.db.user + ':' + config.db.pass + '@' + config.db.host;

// Health Check API
router.get('/', (req, res) => {

  res.set('Content-Type', 'application/json');
  res.status(200);
  let msg = {
    app: config.app.name,
    version: config.app.version
  };
  res.send(JSON.stringify(msg, null, 4));

});

// Get Account API
router.get('/accounts/:username', (req, res) => {

  // Request Parameter
  const username = req.params.username;

  // Common Settings
  res.set('Content-Type', 'application/json');

  // Initialize Response Message
  let msg = {};

  // Check Required Parameter
  if (username === undefined) {

    res.status(404);
    msg = 'missing required parameter';
    res.send(JSON.stringify({message: msg}, null, 4));

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

      // Check if User exists in 'user' Collection
      users.findOne({username: username}, function(err, docs) {

        if (err) {

          res.status(500);
          msg = {title: 'error occurred querying database'};
          res.send(JSON.stringify(msg, null, 4));

        } else if (!docs) {

          res.status(404);
          msg = {title: 'username not found.'};
          res.send(JSON.stringify(msg, null, 4));

        } else {

          res.status(200);
          msg = {
            username: username,
            email: docs.email,
            created: new Date(docs.created * 1000),
            id: docs._id
          };
          res.send(JSON.stringify(msg, null, 4));

        }

      });

    });

  }

});

// List Payment Methods API
router.get('/accounts/:username/paymentmethods', (req, res) => {

  // Request Parameter
  const username = req.params.username;

  // Common Setting
  res.set('Content-Type', 'application/json');

  // Initialize Response Message
  let msg = {};

  // Check Required Parameter
  if (username === undefined) {

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
      const users = db.collection(config.db.col.users);

      // Check if User exists in 'users' Collection
      users.findOne({username: username}, function(err, docs) {

        if (err) {

          res.status(500);
          msg = {title: 'error occurred querying database'};
          res.send(JSON.stringify(msg, null, 4));

        } else if (!docs) {

          res.status(404);
          msg = {title: 'username not found'};
          res.send(JSON.stringify(msg, null, 4));

        } else {

          res.status(200);
          msg = { paymentMethods: docs.paymentMethods };
          res.send(JSON.stringify(msg, null, 4));

        }

      });

    });

  }

});

// Create Payment Method API
router.post('/accounts/:username/paymentmethods', (req, res) => {

  // Request Parameter
  const username = req.params.username;
  const data = req.body;

  // Common Settings
  res.set('Content-Type', 'application/json');

  // Initialize Response Message
  let msg = {};

  // Checking Required Parameter
  if (username === undefined) {

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
      const users = db.collection(config.db.col.users);

      // Check if User exists in 'users' Collection
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

          let paymentMethods = docs.paymentMethods;
          paymentMethods.push(data);
          const updateInfo = {
            paymentMethods: paymentMethods
          };
          users.updateOne({username: username}, {$set: updateInfo }, function(err, docs) {

            if (err) {

              console.log(err);
              res.status(500);
              msg = {title: 'error occurred updating document'};
              res.send(JSON.stringify(msg, null, 4));

            } else {

              console.log('document updated in users collection');
              res.status(201);
              msg = { paymentMethods: paymentMethods };
              res.send(JSON.stringify(msg, null, 4));

            }

          })

        }

      });

    });

  }

});

module.exports = router;
