const express = require("express");
const supertokens = require("./config/Supertokens");
const { middleware, errorHandler } = require("supertokens-node/framework/express");
const pool = require("./db");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(middleware());

// Route for testing database
app.get("/test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({ success: true, timestamp: result.rows[0].now });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// SuperTokens error handler
app.use(errorHandler());

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
