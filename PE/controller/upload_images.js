const express = require("express");
const fileUpload = require('express-fileupload');
const path = require('path');
const port = process.env.PORT;

const router = express.Router();

// Initialize express-fileupload middleware
router.use(fileUpload());

// Creating upload function
router.use(express.static('./assets/images'));

router.post('/meals/upload', (req, res) => {
    if (!req.files || !req.files.meal) {
        return res.status(400).json({ success: 0, message: 'No file uploaded' });
    }

    const file = req.files.meal;
    const fileName = `meal_${Date.now()}${path.extname(file.name)}`;
    
    file.mv(`./assets/images/${fileName}`, (err) => {
        if (err) {
            return res.status(500).json({ success: 0, message: 'Error uploading file' });
        }
        res.json({ 
            success: 1,
            image_url: `/assets/images/${fileName}`
        });
    });
});

module.exports = router;