const express = require("express");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const app = express();
app.use(cors()); // Enable CORS for inter-service communication
app.use(express.json()); // Parse JSON requests

const upload = multer({ dest: "uploads/" }); // Configure multer for file uploads

// Set Nginx container hostname for forwarding requests
const NGINX_HOST = process.env.NGINX_HOST || "nginx-container";
const NGINX_PORT = process.env.NGINX_PORT || "80";

// POST route for English to Arabic Translation
app.post("/translate/en2ar", async (req, res) => {
  try {
    const { text } = req.body;
    const response = await axios.post(`http://${NGINX_HOST}:${NGINX_PORT}/translate/en2ar`, { text });
    const taskId = response.data.task_id;

    res.status(202).json({ task_id: taskId });
  } catch (error) {
    console.error("Error in /translate/en2ar:", error);
    res.status(500).json({ error: "Failed to process English to Arabic translation." });
  }
});

// POST route for Arabic to English Translation
app.post("/translate/ar2en", async (req, res) => {
  try {
    const { text } = req.body;
    const response = await axios.post(`http://${NGINX_HOST}:${NGINX_PORT}/translate/ar2en`, { text });
    const taskId = response.data.task_id;

    res.status(202).json({ task_id: taskId });
  } catch (error) {
    console.error("Error in /translate/ar2en:", error);
    res.status(500).json({ error: "Failed to process Arabic to English translation." });
  }
});

// POST route for Summarization
app.post("/summarize", async (req, res) => {
  try {
    const { text, style } = req.body;
    const response = await axios.post(`http://${NGINX_HOST}:${NGINX_PORT}/summary`, { text, style });
    const taskId = response.data.task_id;

    res.status(202).json({ task_id: taskId });
  } catch (error) {
    console.error("Error in /summarize:", error);
    res.status(500).json({ error: "Failed to process summarization." });
  }
});

// GET route to poll task status
app.get("/status/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const response = await axios.get(`http://${NGINX_HOST}:${NGINX_PORT}/response/${taskId}`);
    res.json(response.data);
  } catch (error) {
    console.error("Error in /status/:taskId:", error);
    res.status(500).json({ error: "Failed to fetch task status." });
  }
});

// POST route for text extraction from files
app.post("/upload", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;
  const fileType = req.file.mimetype;

  try {
    let extractedText = "";

    if (fileType === "application/pdf") {
      // Extract text from PDF
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      extractedText = pdfData.text;
    } else if (
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // Extract text from DOCX
      const dataBuffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer: dataBuffer });
      extractedText = result.value;
    } else if (fileType === "text/plain") {
      // Extract text from TXT
      extractedText = fs.readFileSync(filePath, "utf-8");
    } else {
      return res.status(400).json({ error: "Unsupported file format." });
    }

    res.json({ extractedText });
  } catch (error) {
    console.error("Error in /upload:", error);
    res.status(500).json({ error: "Failed to extract text from file." });
  } finally {
    // Clean up the uploaded file
    fs.unlinkSync(filePath);
  }
});

// Start the server
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});