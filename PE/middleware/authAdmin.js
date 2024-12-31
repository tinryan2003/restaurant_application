const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const authAdmin = async (req, res, next) => {
  const authHeader = req.header("Authorization");
  
  if (!authHeader) {
    return res.status(401).send({ error: "Authorization header is missing." });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const data = jwt.verify(token, process.env.JWT_KEY);
    const admin = await Admin.findOne({ _id: data._id, "tokens.token": token });

    if (!admin) {
      return res.status(404).send({ error: "Admin not found or token is invalid." });
    }

    req.admin = admin;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // Attempt to remove the expired token from the database
      try {
        const decoded = jwt.decode(token); // Decode without verification
        await Admin.updateOne(
          { _id: decoded._id },
          { $pull: { tokens: { token: token } } } // Adjust the query to match your schema
        );
        return res.status(401).send({ error: "Token has expired and has been removed. Please re-authenticate." });
      } catch (dbError) {
        console.error(dbError);
        return res.status(500).send({ error: "An error occurred while processing your request." });
      }
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(400).send({ error: "Invalid token." });
    } else {
      // For other types of errors, log them for debugging purposes
      console.error(error);
      return res.status(500).send({ error: "An error occurred while processing your request." });
    }
  }
};
module.exports = authAdmin;