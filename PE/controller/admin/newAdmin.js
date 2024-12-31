const Admin = require('../../models/Admin');

module.exports = async (req, res) => {
    // Create a new user
    try {
      const admin = new Admin(req.body);
      await admin.save();
      const token = await admin.generateAuthToken();
      res.status(201).send({ admin, token });
    } catch (error) {
      res.status(400).send(error);
    }
  }