const express = require("express");
const multer = require('multer');
const path = require('path');
const port = process.env.PORT;

const router = express.Router();

const storage = multer.diskStorage({
    destination: './assets/images',
    filename: (req, file, cb) => {
       return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });

// Creating upload function
router.use (express.static('./assets/images'));

router.post('/meals/upload', upload.single('meal'), (req, res) => {
    res.json({ 
        success: 1,
        image_url: `/assets/images/${req.file.filename}`
     });
});

module.exports = router;