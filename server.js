const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Destination folder for uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});

// Multer upload instance
const upload = multer({ storage });

// POST endpoint for file upload
app.post('/api/upload', upload.single('image'), (req, res) => {
    try {
        // Handle uploaded file
        const file = req.file;
        console.log('File uploaded:', file);

        // Respond with success message
        res.status(200).json({ message: 'File uploaded successfully' });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
