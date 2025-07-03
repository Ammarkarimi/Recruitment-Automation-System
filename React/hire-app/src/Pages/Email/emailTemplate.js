export const CONGRATULATION_EMAIL_TEMPLATE_BUYER = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to DealsDone!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #ff5d22, #ff6214); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Welcome to DealsDone!</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello {userName},</p>
    <p>Congratulations on joining DealsDone, your one-stop online marketplace!</p>
    <p>Start exploring amazing deals and discover a wide variety of products tailored just for you.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{appLink}" style="background: #ff5d22; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Start Shopping</a>
    </div>
    <p>If you have any questions or need assistance, our support team is here to help.</p>
    <p>Thank you for choosing DealsDone, and we look forward to serving you!</p>
    <p>Best regards,<br>The DealsDone Team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;