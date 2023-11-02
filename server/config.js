module.exports = {
    PORT: process.env.PORT || 5000,
    DATABASE_URL: process.env.DATABASE_URL || 'mongodb://localhost:27017/myDatabase',
    SESSION_SECRET: process.env.SESSION_SECRET || 'mySecretKey'
    // list other configs here
  };
  