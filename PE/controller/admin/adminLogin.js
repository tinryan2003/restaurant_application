const Admin = require('../../models/Admin');

module.exports = async(req, res) => {
    //Login a registered user
    try {
        const { email, password } = req.body;
        if (!email || !password) {
        //   console.log('Missing email or password');
          return res.status(400).send({error: 'Missing email or password'});
        }
        const admin = await Admin.findByCredentials(email, password);
        
        if (!admin) {
            return res.status(401).send({error: 'Login failed! Check authentication credentials'});
        }
        const token = await admin.generateAuthToken();
        res.status(200).send({ admin, token });
    } catch (error) {
        res.status(400).send(error);
    }
}
