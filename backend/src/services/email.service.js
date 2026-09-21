import nodemailer from "nodemailer";

let transporter;

const requiredEnvironment = () => {
  const values = {
    user: process.env.SMTP_USER,
    password: process.env.SMTP_APP_PASSWORD,
    from: process.env.EMAIL_FROM,
    frontendUrl: process.env.FRONTEND_URL,
  };

  if (Object.values(values).some((value) => !value)) {
    const error = new Error("Email service is not configured");
    error.code = "EMAIL_NOT_CONFIGURED";
    throw error;
  }

  return values;
};

const getTransporter = () => {
  if (!transporter) {
    const { user, password } = requiredEnvironment();
    const port = Number(process.env.SMTP_PORT || 465);

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: { user, pass: password },
      tls: {
        minVersion: "TLSv1.2",
        rejectUnauthorized: true,
      },
    });
  }

  return transporter;
};

export const sendStudentVerificationEmail = async ({ to, token }) => {
  const { from, frontendUrl } = requiredEnvironment();
  const verificationUrl = new URL("/verify-email", frontendUrl);
  verificationUrl.hash = `token=${encodeURIComponent(token)}`;

  await getTransporter().sendMail({
    from,
    to,
    subject: "Verify your StudentJob student email",
    text: `Verify your student email by opening this link: ${verificationUrl.toString()}`,
    html: `<p>Welcome to StudentJob.</p><p><a href="${verificationUrl.toString()}">Verify your student email</a></p><p>This link expires in 30 minutes.</p>`,
  });
};

export const resetEmailTransportForTests = () => {
  transporter = undefined;
};
