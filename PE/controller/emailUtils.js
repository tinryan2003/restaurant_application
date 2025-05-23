const nodemailer = require('nodemailer');

// Function to generate a verification code
const generateVerificationCode = () => {
  // Implementation depends on your requirements
  return Math.floor(100000 + Math.random() * 900000); // Example: 6-digit code
};

// Function to send an email
const sendEmail = async (email, code) => {
  // Setup nodemailer transport here
  let transporter = nodemailer.createTransport({
    
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'tinh7800033@gmail.com',
      pass: 'ztpb cjcg ntpd deue',
    },
  });

  // Sending email
  let info = await transporter.sendMail({
    from: 'Ngon Restaurant<non-reply@gmail.com>', // sender address
    to: email, // list of receivers
    subject: 'Verification Code', // Subject line
    text: `Your verification code is: ${code}`, // plain text body
    html: `<b>Your verification code is: ${code}</b>`, // html body
  });

};

module.exports = { generateVerificationCode, sendEmail };