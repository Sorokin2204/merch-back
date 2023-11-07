const nodemailer = require('nodemailer');

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  createTransport(user, pass) {
    return nodemailer.createTransport({
      host: 'smtp.yandex.ru',
      port: '465',
      secure: true,
      auth: {
        user,
        pass,
      },
    });
  }
  async sendMailPassword(to, link) {
    await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: 'Активация аккаунта на ' + process.env.SITE_URL,
      text: '',
      html: `
                    <div>
                        <h1>Перейдите по ссылке для входа в аккаунт</h1>
                        <a href="${link}">${link}</a>
                        <p><b>Donat.Store</b> - ваш выгодный донат в мобильные игры</p>
                    </div>
                `,
    });
  }
}

module.exports = new MailService();
