const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// Function to generate a random OTP
function generateOtp(length) {
    let otp = '';
    const characters = '0123456789';
    for (let i = 0; i < length; i++) {
        otp += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return otp;
}

// Function to send OTP via email
async function sendOtp(email) {
    const otp = generateOtp(6);
    
    const transporter = nodemailer.createTransport({
        service: 'gmail', // Use your email service
        auth: {
            user: process.env.SMTP_USER, // Your email address
            pass: process.env.SMTP_PASS  // Your email password or app password
        }
    });

    const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is: ${otp}`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${email}: ${otp}`);
        return otp; // Return the OTP for verification purposes
    } catch (error) {
        console.error('Error sending OTP:', error);
        throw error;
    }
}

module.exports = { sendOtp };