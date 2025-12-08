const { Resend } = require("resend");

/**
 * EMAIL SERVICE - MODULE RESPONSIBLE FOR SENDING EMAILS
 */
class EmailService {
  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.fromEmail = "onboarding@resend.dev"; // ✅ Działa od razu
  }

  /**
   * SEND ACTIVATION EMAIL
   * @param {string} email - User email address
   * @param {string} username - Username
   * @param {string} activationToken - Activation token
   * @returns {Promise<Object>} - Email send result
   */
  async sendActivationEmail(email, username, activationToken) {
    try {
      const activationUrl = `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/auth/activate/${activationToken}`;

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: "Activate Your Account",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome ${username}!</h2>
            <p>Thank you for registering. Please activate your account by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${activationUrl}" 
                 style="background-color: #4CAF50; color: white; padding: 14px 28px; 
                        text-decoration: none; border-radius: 4px; display: inline-block;">
                Activate Account
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${activationUrl}</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              This link will expire in 24 hours. If you didn't create an account, please ignore this email.
            </p>
          </div>
        `,
      });

      if (error) {
        throw new Error(`Failed to send email: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error sending activation email:", error);
      throw new Error(`Error sending activation email: ${error.message}`);
    }
  }

  /**
   * SEND PASSWORD RESET EMAIL (for future use)
   * @param {string} email - User email address
   * @param {string} resetToken - Password reset token
   * @returns {Promise<Object>} - Email send result
   */
  async sendPasswordResetEmail(email, resetToken) {
    try {
      const resetUrl = `${
        process.env.SERVER_URL || "http://localhost:3000"
      }/auth/reset-password/${resetToken}`;

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: "Reset Your Password",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>We received a request to reset your password. Click the button below to proceed:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #2196F3; color: white; padding: 14px 28px; 
                        text-decoration: none; border-radius: 4px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
            </p>
          </div>
        `,
      });

      if (error) {
        throw new Error(`Failed to send email: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error sending password reset email:", error);
      throw new Error(`Error sending password reset email: ${error.message}`);
    }
  }
}

module.exports = new EmailService();
