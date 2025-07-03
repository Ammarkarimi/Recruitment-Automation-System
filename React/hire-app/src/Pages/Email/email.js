import nodemailer from "nodemailer";
import { google } from "googleapis";
import{CONGRATULATION_EMAIL_TEMPLATE_BUYER} from "./emailTemplate.js"


export const sendMail = async(email)=> {
    try {
        // Get access token
        const accessToken = await oAuth2Client.getAccessToken();
        console.log("Access Token:", accessToken.token);

        // Configure nodemailer transport
        const transport = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "",
                user: "dealsdone7x24@gmail.com", // Sender's email address
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken.token,
            },
        });

        // Verify transporter connection
        await transport.verify();
        console.log("Transporter verified successfully.");

        // Email details
        const mailOptions = {
            from: "DealsDone <dealsdone7x24@gmail.com>", // Sender's name and email
            to: email, // Recipient's email
            subject: "Welcome To DealsDone",
            // text: "Hello from Gmail using API", // Plain text body
            html: CONGRATULATION_EMAIL_TEMPLATE_BUYER.replace("{userName}",email), // HTML body
        };

        // Send email
        const result = await transport.sendMail(mailOptions);
        console.log("Email sent successfully:", result);
        return result;
    } catch (error) {
        console.error("Error sending email:", error.message);
        return error;
    }
};