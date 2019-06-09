'use strict'

const router = require('express').Router();
const config = require('config');
process.env["NODE_CONFIG_DIR"] = __dirname + '/../config/';
const MongoClient = require('mongodb').MongoClient;

// Password Hash Generator
const getHash = require(__dirname + '/../modules/getHash');

// Database Config
const dbUrl = 'mongodb+srv://' + config.db.user + ':' + config.db.pass + '@' + config.db.host;

// Verify API
router.post("/", (req, res) => {

  // Request Parameters
  const email = req.body.email;
  const token = req.body.token;

  // Common Setting
  res.set('Content-Type', 'application/json');

  // Initialize Response Message
  let msg = {};

  // Check Required Parameters
  if (email === undefined || token === undefined) {

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
      const signup = db.collection(config.db.col.signup);
      const users = db.collection(config.db.col.users);

      // Check if Email exists in 'signup' Collection
      signup.findOne({email: email}, function(err, docs) {

        if (err) {

          console.log(err);
          res.status(500);
          msg = {title: 'error occurred querying database'};
          res.send(JSON.stringify(msg, null, 4));

        } else if (!docs) {

          res.status(404);
          msg = {title: 'email not found'};
          res.send(JSON.stringify(msg, null, 4));

        } else {

          // Check if Token Expired
          const currentTime = Math.floor(Date.now()/1000);
          const expiresAt = docs.created + config.signup.timeoutInSec;

          if (currentTime > expiresAt) {

            signup.deleteOne({email: email}, function(err, docs) {

              res.status(404);
              msg = {title: 'token expired.'};
              res.send(JSON.stringify(msg, null, 4));

            });

          // Validate Token
          } else if (token !== docs.token) {

            // Check if Retry Limit Over
            let retry = docs.retry;
            if (retry >= config.retryLimit - 1) {

              signup.deleteOne({email: email}, function(err, docs) {

                res.status(400);
                msg = {title: 'exceeded retry limit'};
                res.send(JSON.stringify(msg, null, 4));

              });

            } else {

              // Count up Retry Counts and Update Document
              retry++;
              const updateInfo = {retry: retry};

              signup.updateOne({email: email}, {$set: updateInfo}, function(err, docs) {

                res.status(401);
                msg = {title: 'incorrect token'};
                res.send(JSON.stringify(msg, null, 4));

              });

            }

          } else {

            // Insert Document into 'user' Collection
            const createdAt = Math.floor(Date.now()/1000);
            const newUser = {
              username: docs.email,
              email: docs.email,
              password: docs.password,
              created: createdAt,
              paymentMethods: []
            }

            users.insertOne(newUser, function(err, docs) {

              if (err) {

                console.log(err);
                res.status(500);
                msg = {title: 'error occurred inserting document'};
                res.send(JSON.stringify(msg, null, 4));

              } else {
console.log(docs);
                res.status(201);
                msg = {
                  message: 'verified',
                  username: email,
                  email: email,
                  created: new Date(createdAt * 1000),
                  id: docs.ops[0]._id
                };
                res.send(JSON.stringify(msg, null, 4));

              }

            });

          }

        }

        client.close()

      });

    });

  }

});

module.exports = router;
