'use strict';

const {
    enviarCurriculoPorEmail
} = require('./_email');

const MAX_BODY_BYTES = 4_500_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function enviarJson(
    response,
    statusCode,
    payload
) {

    if (response.headersSent) {
        return;
    }

    const body =
        JSON.stringify(payload);

    response.writeHead(
        statusCode,
        {
            'Content-Type':
                'application/json; charset=utf-8',
            'Content-Length':
                Buffer.byteLength(body)
        }
    );

    response.end(body);
}

function criarErro(
    statusCode,
    message
) {

    const error =
        new Error(message);

    error.statusCode =
        statusCode;

    return error;
}

async function lerCorpoJson(
    request
) {

    let body;

    try {

        body =
            request.body;

    } catch (error) {

        error.statusCode = 400;

        throw error;
    }

    if (body !== undefined) {

        const tamanho =
            Buffer.byteLength(
                JSON.stringify(body)
            );

        if (tamanho > MAX_BODY_BYTES) {

            throw criarErro(
                413,
                'Corpo da requisição muito grande.'
            );
        }

        return body;
    }

    const contentLength =
        Number(
            request.headers?.['content-length'] ||
            0
        );

    if (contentLength > MAX_BODY_BYTES) {

        throw criarErro(
            413,
            'Corpo da requisição muito grande.'
        );
    }

    const partes = [];

    let tamanho = 0;

    for await (const parte of request) {

        tamanho += parte.length;

        if (tamanho > MAX_BODY_BYTES) {

            throw criarErro(
                413,
                'Corpo da requisição muito grande.'
            );
        }

        partes.push(parte);
    }

    if (partes.length === 0) {

        throw criarErro(
            400,
            'Corpo da requisição vazio.'
        );
    }

    try {

        return JSON.parse(
            Buffer.concat(partes)
                .toString('utf8')
        );

    } catch (error) {

        error.statusCode = 400;

        throw error;
    }
}

function nomeDeArquivoSeguro(
    filename
) {

    const texto =
        typeof filename === 'string'
            ? filename
            : '';

    const semCaminho =
        texto
            .split(/[\\/]/)
            .pop()
            ?.trim() || '';

    const nome =
        semCaminho
            .replace(
                /[\r\n"]/g,
                ''
            )
            .slice(0, 200);

    if (
        !nome ||
        !/\.pdf$/i.test(nome)
    ) {

        return 'curriculo.pdf';
    }

    return nome;
}

module.exports =
    async function handler(
        request,
        response
    ) {

        if (
            request.method !== 'POST'
        ) {

            enviarJson(
                response,
                405,
                {
                    message:
                        'Método não permitido.'
                }
            );

            return;
        }

        let body;

        try {

            body =
                await lerCorpoJson(
                    request
                );

        } catch (error) {

            enviarJson(
                response,
                error.statusCode || 400,
                {
                    message:
                        'Não foi possível processar os dados do currículo.'
                }
            );

            return;
        }

        const email =
            body &&
            typeof body.email === 'string'
                ? body.email.trim()
                : '';

        const pdfBase64 =
            body &&
            typeof body.pdfBase64 === 'string'
                ? body.pdfBase64.replace(
                    /\s/g,
                    ''
                )
                : '';

        if (
            !EMAIL_PATTERN.test(email) ||
            !pdfBase64
        ) {

            enviarJson(
                response,
                400,
                {
                    message:
                        'E-mail ou PDF inválido.'
                }
            );

            return;
        }

        if (
            !/^[A-Za-z0-9+/]*={0,2}$/.test(
                pdfBase64
            ) ||
            pdfBase64.length % 4 !== 0
        ) {

            enviarJson(
                response,
                400,
                {
                    message:
                        'O PDF enviado está em um formato inválido.'
                }
            );

            return;
        }

        const pdfBuffer =
            Buffer.from(
                pdfBase64,
                'base64'
            );

        if (
            pdfBuffer.length === 0 ||
            pdfBuffer
                .subarray(0, 5)
                .toString('ascii') !== '%PDF-'
        ) {

            enviarJson(
                response,
                400,
                {
                    message:
                        'O conteúdo enviado não é um PDF válido.'
                }
            );

            return;
        }

        const filename =
            nomeDeArquivoSeguro(
                body.filename
            );

        try {

            await enviarCurriculoPorEmail({
                email,
                pdfBuffer,
                filename
            });

            console.log(
                `Currículo enviado para ${email}.`
            );

            enviarJson(
                response,
                200,
                {
                    message:
                        'Currículo gerado e enviado para o e-mail informado.'
                }
            );

        } catch (error) {

            console.error(
                'Erro ao enviar o currículo por e-mail:',
                error
            );

            const statusCode =
                error.code === 'EMAIL_CONFIG_MISSING'
                    ? 503
                    : 502;

            enviarJson(
                response,
                statusCode,
                {
                    message:
                        'Currículo gerado, mas não foi possível enviar o e-mail.'
                }
            );
        }
    };
