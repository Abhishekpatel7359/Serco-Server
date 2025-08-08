const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// Function to send a custom email with a custom HTML template
async function sendCustomMail(email, subject, htmlContent) {
    const transporter = nodemailer.createTransport({
        service: 'gmail', // You can change this to your email service provider
        auth: {
            user: process.env.SMTP_USER, // Your email address
            pass: process.env.SMTP_PASS  // Your email password or app password
        }
    });

    const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: subject,
        html: htmlContent
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${email}`);
        return { success: true, message: `Email sent to ${email}` };
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

module.exports = { sendCustomMail };
