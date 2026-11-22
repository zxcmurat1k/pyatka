const nodemailer = require('nodemailer');

function isSmtpConfigured() {
    return Boolean(
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
    );
}

function createTransporter() {
    const port = Number(process.env.SMTP_PORT || 465);
    const secure = process.env.SMTP_SECURE
        ? process.env.SMTP_SECURE === 'true'
        : port === 465;

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000
    });
}

async function sendCodeEmail(to, code, purpose) {
    const isReset = purpose === 'reset';
    const subject = isReset
        ? 'HornyHo — Код для сброса пароля'
        : 'HornyHo — Подтверждение регистрации';

    const title = isReset ? 'Сброс пароля' : 'Подтверждение регистрации';
    const actionText = isReset
        ? 'Вы запросили восстановление пароля в HornyHo.'
        : 'Спасибо за регистрацию на портале HornyHo.';

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#14161D;color:#F8FAFC;border-radius:12px;border:1px solid #2A2F3D;">
        <h2 style="margin:0 0 12px;color:#38BDF8;">${title}</h2>
        <p style="margin:0 0 18px;color:#CBD5E1;line-height:1.5;">${actionText} Введите этот 6-значный код на сайте (действителен 10 минут):</p>
        <div style="font-size:32px;font-weight:800;letter-spacing:8px;text-align:center;padding:16px;background:#0B0C10;border-radius:8px;color:#FFFFFF;border:1px solid #38BDF8;">
          ${code}
        </div>
        <p style="margin:18px 0 0;font-size:12px;color:#94A3B8;">Если вы не запрашивали этот код, просто проигнорируйте письмо.</p>
      </div>
    `;

    const text = `${title}\n\n${actionText}\nВаш 6-значный код: ${code}\nКод действителен 10 минут.`;

    // Режим скелета: SMTP ещё не задан в .env
    if (!isSmtpConfigured()) {
        console.log(`\n========== [HORNYHO MAIL SKELETON] ==========\nTo: ${to}\nPurpose: ${purpose}\nCode: ${code}\n=============================================\n`);
        return {
            ok: true,
            mode: 'skeleton',
            devCode: process.env.MAIL_DEV_PREVIEW === 'true' ? code : null
        };
    }

    try {
        const transporter = createTransporter();
        await transporter.sendMail({
            from: process.env.SMTP_FROM || `HornyHo <${process.env.SMTP_USER}>`,
            to,
            subject,
            text,
            html
        });
        return { ok: true, mode: 'smtp', devCode: null };
    } catch (err) {
        console.error('[HORNYHO MAIL ERROR]', err.message);
        console.log(`[HORNYHO MAIL FALLBACK CODE] To: ${to} | Purpose: ${purpose} | Code: ${code}`);
        return {
            ok: false,
            mode: 'fallback',
            error: err.message,
            devCode: process.env.MAIL_DEV_PREVIEW === 'true' ? code : null
        };
    }
}

module.exports = { isSmtpConfigured, sendCodeEmail };
