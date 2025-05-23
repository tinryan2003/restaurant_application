const express = require("express");
const path = require('path');
const port = process.env.PORT;
const cors = require('cors');
const userRouter = require('./routers/user');
const adminRouter = require('./routers/admin');
const uploadImage = require('./controller/upload_images');
const connectDB = require("./db/db");

const app = express();

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());

app.use(userRouter);
app.use(uploadImage);
app.use(adminRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});