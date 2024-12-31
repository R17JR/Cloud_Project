const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    user: process.env.DB_USER || "root",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "user_service",
    password: process.env.DB_PASSWORD || "root",
    port: process.env.DB_PORT || 5432,
});

module.exports = pool;
