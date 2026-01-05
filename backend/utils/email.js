import dotenv from "dotenv";
dotenv.config();
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ email, subject, html }) => {
  await resend.emails.send({
    from: "Pixify <noreply@pixify.space>",
    to: email,
    subject,
    html,
  });
};

export default sendEmail;
