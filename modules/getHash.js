'use strict'

const crypto = require('crypto');

const getHash = function(password) {
    let sha = crypto.createHmac('sha256', 'enilnocpttn');
    sha.update(password);
    return sha.digest('hex');
};

module.exports = getHash;
