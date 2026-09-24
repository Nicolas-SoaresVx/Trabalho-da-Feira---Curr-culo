'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {
    enviarCurriculoPorEmail
} = require('./api/_email');

const ROOT_DIR = __dirname;
const MAX_BODY_BYTES = 20 * 1024 * 1024;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STATIC_FILES = {
    '/': {
        filename: 'index.html',
        contentType: 'text/html; charset=utf-8'
    },
    '/index.html': {
        filename: 'index.html',
        contentType: 'text/html; charset=utf-8'
    },
    '/style.css': {
        filename: 'style.css',
        contentType: 'text/css; charset=utf-8'
    },
    '/script.js': {
        filename: 'script.js',
        contentType: 'text/javascript; charset=utf-8'
    }
};

function carregarEnv() {

    if (typeof process.loadEnvFile !== 'function') {
        return;
    }

    try {

        process.loadEnvFile(
            path.join(
                ROOT_DIR,
                '.env'
            )
        );

    } catch (error) {

        if (error.code !== 'ENOENT') {
            console.warn(
                'Não foi possível carregar o arquivo .env.'
            );
        }
    }
}

carregarEnv();

function enviarJson(
    response,
    statusCode,
    payload
) {

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

async function lerJsonBody(request) {

    const partes = [];

    let tamanho = 0;

    for await (const parte of request) {

        tamanho += parte.length;

        if (tamanho > MAX_BODY_BYTES) {

            const error =
                new Error(
                    'Corpo da requisição muito grande.'
                );

            error.statusCode = 413;

            throw error;
        }

        partes.push(parte);
    }

    if (partes.length === 0) {

        const error =
            new Error(
                'Corpo da requisição vazio.'
            );

        error.statusCode = 400;

        throw error;
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

async function tratarEnvio(
    request,
    response
) {

    let body;

    try {

        body =
            await lerJsonBody(request);

    } catch (error) {

        const statusCode =
            error.statusCode || 400;

        enviarJson(
            response,
            statusCode,
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
}

async function servirEstatico(
    request,
    response,
    pathname
) {

    const arquivo =
        STATIC_FILES[pathname];

    if (!arquivo) {

        enviarJson(
            response,
            404,
            {
                message:
                    'Recurso não encontrado.'
            }
        );

        return;
    }

    try {

        const conteudo =
            await fs.promises.readFile(
                path.join(
                    ROOT_DIR,
                    arquivo.filename
                )
            );

        response.writeHead(
            200,
            {
                'Content-Type':
                    arquivo.contentType,
                'Content-Length':
                    conteudo.length
            }
        );

        response.end(conteudo);

    } catch (error) {

        console.error(
            'Erro ao servir arquivo estático:',
            error
        );

        enviarJson(
            response,
            500,
            {
                message:
                    'Não foi possível carregar a aplicação.'
            }
        );
    }
}

const server =
    http.createServer(
        async (
            request,
            response
        ) => {

            const url =
                new URL(
                    request.url,
                    `http://${request.headers.host || 'localhost'}`
                );

            const pathname =
                url.pathname;

            try {

                if (
                    request.method === 'POST' &&
                    pathname === '/api/enviar-curriculo'
                ) {

                    await tratarEnvio(
                        request,
                        response
                    );

                    return;
                }

                if (
                    request.method === 'GET'
                ) {

                    await servirEstatico(
                        request,
                        response,
                        pathname
                    );

                    return;
                }

                enviarJson(
                    response,
                    404,
                    {
                        message:
                            'Recurso não encontrado.'
                    }
                );

            } catch (error) {

                console.error(
                    'Erro interno do servidor:',
                    error
                );

                if (!response.headersSent) {

                    enviarJson(
                        response,
                        500,
                        {
                            message:
                                'Ocorreu um erro no servidor.'
                        }
                    );
                }
            }
        }
    );

const port =
    Number(process.env.PORT) || 3000;

server.listen(
    port,
    '0.0.0.0',
    () => {

        console.log(
            `Servidor iniciado em http://localhost:${port}`
        );
    }
);
