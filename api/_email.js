'use strict';

const tls = require('node:tls');
const nodemailer = require('nodemailer');

function obterCertificadosCa() {

    const certificados =
        Array.isArray(tls.rootCertificates)
            ? [...tls.rootCertificates]
            : [];

    if (
        typeof tls.getCACertificates ===
        'function'
    ) {

        const certificadosSistema =
            tls.getCACertificates(
                'system'
            );

        if (
            Array.isArray(certificadosSistema)
        ) {

            return certificados.concat(
                certificadosSistema
            );
        }
    }

    return certificados;
}

const CERTIFICADOS_CA =
    obterCertificadosCa();

let transporter = null;

function obterTransporter() {

    const user =
        process.env.EMAIL_USER
            ?.trim();

    const pass =
        process.env.EMAIL_APP_PASSWORD;

    if (
        !user ||
        !pass
    ) {

        const error =
            new Error(
                'Credenciais de e-mail não configuradas.'
            );

        error.code =
            'EMAIL_CONFIG_MISSING';

        throw error;
    }

    if (!transporter) {

        transporter =
            nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user,
                    pass
                },

                tls: {
                    ca: CERTIFICADOS_CA,

                    rejectUnauthorized: true
                }
            });
    }

    return {
        transporter,
        user
    };
}

async function enviarCurriculoPorEmail(
    {
        email,
        pdfBuffer,
        filename
    }
) {

    const {
        transporter: mailer,
        user
    } = obterTransporter();

    await mailer.sendMail({
        from: user,
        to: email,
        subject: 'Seu currículo em PDF',
        text: [
            'Olá!',
            '',
            'Obrigado por enviar seu currículo.',
            '',
            'Segue em anexo uma cópia das informações preenchidas no formulário.',
            '',
            'Atenciosamente,',
            '',
            'Equipe do 3º DS & 2º ADM'
        ].join('\n'),
        attachments: [
            {
                filename:
                    filename ||
                    'curriculo.pdf',
                content: pdfBuffer,
                contentType: 'application/pdf'
            }
        ]
    });
}

module.exports = {
    enviarCurriculoPorEmail
};
