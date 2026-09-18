module.exports = (req, res) => {
  const log = [];
  try {
    log.push('1. require express');
    const express = require('express');

    log.push('2. require dotenv');
    require('dotenv').config();

    log.push('3. require routes/adminUsers');
    const adminUsers = require('../routes/adminUsers');

    log.push('4. require routes/authResolver');
    const authResolver = require('../routes/authResolver');

    log.push('5. require server.js');
    const server = require('../server.js');

    log.push('6. Success!');
    res.json({ success: true, log });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, stack: err.stack, log });
  }
};
