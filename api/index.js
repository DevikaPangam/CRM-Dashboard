const app = require('../server.js');

module.exports = (req, res) => {
  try {
    return app(req, res);
  } catch (err) {
    console.error('Vercel serverless function error:', err);
    res.status(500).json({
      error: 'SERVERLESS_FUNCTION_ERROR',
      message: err.message,
      stack: err.stack
    });
  }
};
