'use strict'

const router = require('express').Router();
const config = require('config');
process.env["NODE_CONFIG_DIR"] = __dirname + '/../config/';
const MongoClient = require('mongodb').MongoClient;
const rp = require('request-promise');

// Password Hash Generator
const getHash = require(__dirname + '/../modules/getHash');

// Database Config 
const dbUrl = 'mongodb+srv://' + config.db.user + ':' + config.db.pass + '@' + config.db.host;

// Sendgrid Config
const sgUrl = 'https://api.sendgrid.com/v3/mail/send';
const sgApiKey = process.env.SG_API_KEY;

// Slack Config
const webhookUrl = process.env.WEBHOOK_URL;

// One-Time Token Config 
const char = '0123456789';
const digit = 6;

// Sign Up API
router.post('/', (req, res) => {

  // Request Parameters
  const email = req.body.email;
  const password = req.body.password;
  const channel = req.body.channel;

  // Common Settings
  let options = { method: 'POST' };
  res.set('Content-Type', 'application/json');

  // Initialize Response Message
  let msg = {};

  // Check Required Parameters
  if (email === undefined || password === undefined) {

    res.status(400);
    msg = {title: 'missing required parameter'};
    res.send(JSON.stringify(msg, null, 4));

  } else {

    // Connect to Database
    const client = new MongoClient(dbUrl, {
      useNewUrlParser: true,
      reconnectTries: 3,
      reconnectInterval: 1000,
    });

    client.connect(function(err, client) {

      console.log('connected to server');

      // Database and Collections
      const db = client.db(config.db.name);
      const signup = db.collection(config.db.col.signup);
      const users = db.collection(config.db.col.users);

      // Check if Email exists in 'users' Collection
      users.findOne({email: email}, function(err, docs) {

        if (err) {

          console.log(err);
          res.status(500);
          msg = {title: 'error occurred querying database'};
          res.send(JSON.stringify({title: msg}, null, 4));

        } else if (docs) {

          res.status(409);
          msg = {title: 'you already signed up'};
          res.send(JSON.stringify(msg, null, 4));

        } else {

          // Generate One-Time Token
          const cl = char.length;
          let token = "";
          for (let i=0; i<digit; i++) {
            token += char[Math.floor(Math.random()*cl)];
          }
          console.log(token); // for debugging

          // Set Creation and Expiration Time (Unix timestamp)
          const createdAt = Math.floor(Date.now()/1000);
          const expiresAt = createdAt + config.signup.timeoutInSec;

          // Check if Email exists in 'signup' collection
          signup.findOne({email: email}, function(err, docs) {

            if (err) {

              console.log(err);
              res.status(500);
              msg = {title: 'error occurred querying database'};
              res.send(JSON.stringify({title: msg}, null, 4));

            } else if (!docs) {

              // Insert Document into 'signup' Collection
              const newUser = {
                email: email,
                password: getHash(password),
                token: token,
                created: createdAt,
                retry: 0
              };

              signup.insertOne(newUser, function(err, docs) {

                if (err) {

                  console.log('error occurred inserting document');
                  console.log(err);

                } else {

                  console.log('document inserted in signup collection');
                }

              });

            } else {

              // Update Document
              const updateInfo = {
                password: getHash(password),
                token: token,
                created: createdAt,
                retry: 0
              };

              signup.updateOne({email: email}, {$set: updateInfo}, function(err, docs) {

                if (err) {

                  console.log('error occurred updating document');
                  console.log(err);

                } else {

                  console.log('document updated in signup collection');
                }

              });

            }

            client.close();

          });

          // Settings to Send One-Time Token by Email
          let media = 'email'
          let sendTo = email;

          if (channel === undefined) {

            let content = require(__dirname + '/../templates/email.json');
            content.personalizations[0].to[0].email = email;
            content.content[0].value = token;
            options.json = content;
            options.url = sgUrl;
            options.headers = { Authorization: 'Bearer ' + sgApiKey };

          // Settings to Send Ont-Time Token by Slack
          } else  {

            media = 'slack';
            sendTo = channel;
            options.json = {
              channel: channel,
              text: token,
              link_names: 1
            };
            options.url = webhookUrl;

          }

          // Send One-Time Token to User
          rp(options)

            .then(function(body) {

              res.status(201);
              msg = {
                message: 'authentication code has been sent',
                media: media,
                sendTo: sendTo,
                expiresAt: new Date(expiresAt * 1000)
              };
              res.send(JSON.stringify(msg, null, 4));

            })

            .catch(function(err) {

              console.log(err.message);
              res.status(500);
              msg = {title: 'error occurred on notification'};
              res.send(JSON.stringify({title: msg}, null, 4));

            });

        }

      });

    });

  }

});

module.exports = router;
