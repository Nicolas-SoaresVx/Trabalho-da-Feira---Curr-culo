/* =========================================================
   PROTOCOLO DE CURRÍCULOS
   JavaScript principal
   ========================================================= */


/* =========================================================
   VARIÁVEIS PRINCIPAIS
   ========================================================= */

let currentModel = 'formacao';

let stream = null;

let photoDataUrl = null;

let contadorFormacoes = 0;


/* =========================================================
   INFORMAÇÕES DOS MODELOS
   ========================================================= */

const MODEL_INFO = {

    formacao: {
        name: 'Somente formação acadêmica',
        color: '#c0e0fc',
        code: '01-FORMACAO'
    },

    experiencia: {
        name: 'Com experiência',
        color: '#c0e0fc',
        code: '02-EXPERIENCIA'
    }

};


/* =========================================================
   NAVEGAÇÃO
   ========================================================= */

function goToForm(model) {

    currentModel = model;

    const info = MODEL_INFO[model];

    document
        .getElementById('screen-welcome')
        .classList.remove('active');

    document
        .getElementById('screen-form')
        .classList.add('active');

    document
        .getElementById('screen-form')
        .style
        .setProperty('--model-color', info.color);

    document
        .getElementById('form-chip')
        .textContent =
        'MODELO ' + (model === 'formacao' ? '01' : '02');

    document
        .getElementById('form-title')
        .textContent = info.name;

    document
        .getElementById('proto-model')
        .textContent = info.code;

    const campoExperiencia =
        document.getElementById('field-exp');

    const marcaObrigatorio =
        document.getElementById('exp-req-mark');

    if (campoExperiencia) {
        campoExperiencia.style.display = 'block';
    }

    if (marcaObrigatorio) {

        marcaObrigatorio.style.display =
            model === 'experiencia'
                ? 'inline'
                : 'none';

        marcaObrigatorio.textContent = '*';
    }

    resetForm();
}


function goToWelcome() {

    stopCamera();

    document
        .getElementById('screen-form')
        .classList.remove('active');

    document
        .getElementById('screen-welcome')
        .classList.add('active');
}


/* =========================================================
   RESET
   ========================================================= */

function resetForm() {

    const form =
        document.getElementById('curriculo-form');

    if (form) {
        form.reset();
    }

    const formacoes =
        document.getElementById('formacoes-adicionais');

    if (formacoes) {
        formacoes.innerHTML = '';
    }

    contadorFormacoes = 0;

    document
        .querySelectorAll('.err')
        .forEach(element => {
            element.classList.remove('err');
        });

    document
        .querySelectorAll('.errmsg')
        .forEach(element => {
            element.classList.remove('show');
        });

    photoDataUrl = null;

    stopCamera();

    const preview =
        document.getElementById('photo-preview');

    if (preview) {
        preview.style.display = 'none';
        preview.src = '';
    }

    const placeholder =
        document.getElementById('booth-placeholder');

    if (placeholder) {
        placeholder.style.display = 'flex';
    }

    const video =
        document.getElementById('video');

    if (video) {
        video.style.display = 'none';
    }

    const capture =
        document.getElementById('btn-capture');

    if (capture) {
        capture.style.display = 'none';
    }

    const retake =
        document.getElementById('btn-retake');

    if (retake) {
        retake.style.display = 'none';
    }
}


/* =========================================================
   CÂMERA
   ========================================================= */

async function toggleCamera() {

    if (stream) {

        stopCamera();

        return;
    }

    try {

        stream =
            await navigator
                .mediaDevices
                .getUserMedia({
                    video: {
                        facingMode: 'user'
                    }
                });

        const video =
            document.getElementById('video');

        video.srcObject = stream;

        await video.play();

        video.style.display = 'block';

        document
            .getElementById('booth-placeholder')
            .style.display = 'none';

        document
            .getElementById('photo-preview')
            .style.display = 'none';

        document
            .getElementById('btn-capture')
            .style.display = 'inline-block';

    } catch (error) {

        console.error(error);

        alert(
            'Não foi possível acessar a câmera.'
        );
    }
}


function stopCamera() {

    if (stream) {

        stream
            .getTracks()
            .forEach(track => track.stop());

        stream = null;
    }

    const video =
        document.getElementById('video');

    if (video) {
        video.style.display = 'none';
        video.srcObject = null;
    }

    const capture =
        document.getElementById('btn-capture');

    if (capture) {
        capture.style.display = 'none';
    }
}


/* =========================================================
   CAPTURA DA FOTO
   ========================================================= */

function capturePhoto() {

    const video =
        document.getElementById('video');

    const canvas =
        document.getElementById('capture-canvas');

    if (
        !video ||
        !canvas ||
        !video.videoWidth ||
        !video.videoHeight
    ) {
        return;
    }

    canvas.width = video.videoWidth;

    canvas.height = video.videoHeight;

    const context =
        canvas.getContext('2d');

    context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );

    photoDataUrl =
        canvas.toDataURL(
            'image/jpeg',
            0.90
        );

    const preview =
        document.getElementById('photo-preview');

    preview.src = photoDataUrl;

    preview.style.display = 'block';

    stopCamera();

    document
        .getElementById('booth-placeholder')
        .style.display = 'none';

    document
        .getElementById('btn-retake')
        .style.display = 'inline-block';
}


/* =========================================================
   FOTO DA GALERIA
   ========================================================= */

function handleFileSelect(event) {

    const file =
        event.target.files[0];

    if (!file) {
        return;
    }

    if (!file.type.startsWith('image/')) {

        alert(
            'Selecione um arquivo de imagem.'
        );

        return;
    }

    if (file.size > 5 * 1024 * 1024) {

        alert(
            'Imagem muito grande. Máximo 5MB.'
        );

        return;
    }

    const reader =
        new FileReader();

    reader.onload = function (event) {

        photoDataUrl =
            event.target.result;

        const preview =
            document.getElementById(
                'photo-preview'
            );

        preview.src = photoDataUrl;

        preview.style.display = 'block';

        document
            .getElementById(
                'booth-placeholder'
            )
            .style.display = 'none';

        document
            .getElementById('video')
            .style.display = 'none';

        document
            .getElementById('btn-retake')
            .style.display = 'inline-block';
    };

    reader.readAsDataURL(file);
}


/* =========================================================
   REMOVER / TROCAR FOTO
   ========================================================= */

function retakePhoto() {

    photoDataUrl = null;

    const preview =
        document.getElementById(
            'photo-preview'
        );

    preview.style.display = 'none';

    preview.src = '';

    document
        .getElementById(
            'booth-placeholder'
        )
        .style.display = 'flex';

    document
        .getElementById(
            'btn-retake'
        )
        .style.display = 'none';

    const file =
        document.getElementById(
            'f-foto-file'
        );

    if (file) {
        file.value = '';
    }
}


/* =========================================================
   FORMAÇÕES ADICIONAIS
   ========================================================= */

function adicionarFormacao() {

    const container =
        document.getElementById(
            'formacoes-adicionais'
        );

    if (!container) {

        console.error(
            'Elemento #formacoes-adicionais não encontrado.'
        );

        return;
    }

    contadorFormacoes++;

    const formacao =
        document.createElement('div');

    formacao.className =
        'formacao-extra';

    formacao.dataset.formacao =
        contadorFormacoes + 1;

    formacao.innerHTML = `

        <div class="formacao-extra-head">

            <strong>
                Formação ${contadorFormacoes + 1}
            </strong>

            <button
                type="button"
                class="btn-remover-formacao"
                onclick="removerFormacao(this)">

                Remover

            </button>

        </div>


        <div class="grid">

            <div class="field full">

                <label>
                    Instituição *
                </label>

                <input
                    type="text"
                    class="f-inst-extra"
                    placeholder="Nome da instituição">

                <div class="errmsg">
                    Informe a instituição.
                </div>

            </div>


            <div class="field">

                <label>
                    Curso *
                </label>

                <input
                    type="text"
                    class="f-curso-extra"
                    placeholder="Nome do curso">

                <div class="errmsg">
                    Informe o curso.
                </div>

            </div>


            <div class="field">

                <label>
                    Ano / Situação *
                </label>

                <input
                    type="text"
                    class="f-ano-extra"
                    placeholder="Ex: Cursando 2º Ano">

                <div class="errmsg">
                    Informe o ano ou situação.
                </div>

            </div>

        </div>
    `;

    container.appendChild(formacao);

    const primeiroCampo =
        formacao.querySelector(
            '.f-inst-extra'
        );

    if (primeiroCampo) {
        primeiroCampo.focus();
    }
}


function removerFormacao(botao) {

    const formacao =
        botao.closest(
            '.formacao-extra'
        );

    if (!formacao) {
        return;
    }

    formacao.remove();

    atualizarNumeracaoFormacoes();
}


function atualizarNumeracaoFormacoes() {

    const formacoes =
        document.querySelectorAll(
            '.formacao-extra'
        );

    formacoes.forEach(
        (formacao, index) => {

            const numero =
                index + 2;

            const titulo =
                formacao.querySelector(
                    '.formacao-extra-head strong'
                );

            if (titulo) {

                titulo.textContent =
                    `Formação ${numero}`;
            }

            formacao.dataset.formacao =
                numero;
        }
    );

    contadorFormacoes =
        formacoes.length;
}


function obterFormacoes() {

    const formacoes = [];

    const instituicao =
        document.getElementById(
            'f-inst'
        );

    const curso =
        document.getElementById(
            'f-curso'
        );

    const ano =
        document.getElementById(
            'f-ano'
        );

    if (
        instituicao &&
        curso &&
        ano
    ) {

        formacoes.push({

            inst:
                instituicao.value.trim(),

            curso:
                curso.value.trim(),

            ano:
                ano.value.trim()
        });
    }


    document
        .querySelectorAll(
            '.formacao-extra'
        )
        .forEach(formacao => {

            const inst =
                formacao
                    .querySelector(
                        '.f-inst-extra'
                    )
                    .value
                    .trim();

            const curso =
                formacao
                    .querySelector(
                        '.f-curso-extra'
                    )
                    .value
                    .trim();

            const ano =
                formacao
                    .querySelector(
                        '.f-ano-extra'
                    )
                    .value
                    .trim();

            formacoes.push({

                inst,
                curso,
                ano
            });
        });

    return formacoes;
}


function validarFormacoesAdicionais() {

    let valido = true;

    document
        .querySelectorAll(
            '.formacao-extra'
        )
        .forEach(formacao => {

            const campos = [

                formacao.querySelector(
                    '.f-inst-extra'
                ),

                formacao.querySelector(
                    '.f-curso-extra'
                ),

                formacao.querySelector(
                    '.f-ano-extra'
                )

            ];

            campos.forEach(campo => {

                if (!campo) {
                    return;
                }

                const preenchido =
                    campo.value
                        .trim()
                        .length >= 2;

                setError(
                    campo,
                    !preenchido
                );

                if (!preenchido) {
                    valido = false;
                }
            });
        });

    return valido;
}


/* =========================================================
   VALIDAÇÃO
   ========================================================= */

function setError(input, erro) {

    if (!input) {
        return;
    }

    input.classList.toggle(
        'err',
        erro
    );

    const mensagem =
        input.parentElement
            ?.querySelector(
                '.errmsg'
            );

    if (mensagem) {

        mensagem.classList.toggle(
            'show',
            erro
        );
    }
}


/* =========================================================
   CONVERTE FOTO PARA CÍRCULO
   ========================================================= */

function criarFotoCircular(
    dataUrl,
    tamanho = 500
) {

    return new Promise(
        (resolve, reject) => {

            const imagem =
                new Image();

            imagem.onload =
                function () {

                    const canvas =
                        document.createElement(
                            'canvas'
                        );

                    canvas.width =
                        tamanho;

                    canvas.height =
                        tamanho;

                    const ctx =
                        canvas.getContext(
                            '2d'
                        );

                    ctx.clearRect(
                        0,
                        0,
                        tamanho,
                        tamanho
                    );

                    ctx.beginPath();

                    ctx.arc(
                        tamanho / 2,
                        tamanho / 2,
                        tamanho / 2,
                        0,
                        Math.PI * 2
                    );

                    ctx.closePath();

                    ctx.clip();

                    const proporcao =
                        Math.max(
                            tamanho /
                                imagem.width,

                            tamanho /
                                imagem.height
                        );

                    const largura =
                        imagem.width *
                        proporcao;

                    const altura =
                        imagem.height *
                        proporcao;

                    const x =
                        (tamanho -
                            largura) / 2;

                    const y =
                        (tamanho -
                            altura) / 2;

                    ctx.drawImage(
                        imagem,
                        x,
                        y,
                        largura,
                        altura
                    );

                    resolve(
                        canvas.toDataURL(
                            'image/png'
                        )
                    );
                };

            imagem.onerror =
                reject;

            imagem.src =
                dataUrl;
        }
    );
}


/* =========================================================
   ENVIO DO FORMULÁRIO
   ========================================================= */

document
    .getElementById('curriculo-form')
    .addEventListener(
        'submit',
        async function (event) {

            event.preventDefault();

            let valido = true;


            const nome =
                document.getElementById(
                    'f-nome'
                );

            const idade =
                document.getElementById(
                    'f-idade'
                );

            const cidade =
                document.getElementById(
                    'f-cidade'
                );

            const estado =
                document.getElementById(
                    'f-estado'
                );

            const email =
                document.getElementById(
                    'f-email'
                );

            const telefone =
                document.getElementById(
                    'f-tel'
                );

            const instituicao =
                document.getElementById(
                    'f-inst'
                );

            const curso =
                document.getElementById(
                    'f-curso'
                );

            const ano =
                document.getElementById(
                    'f-ano'
                );

            const experiencia =
                document.getElementById(
                    'f-experiencia'
                );

            const objetivo =
                document.getElementById(
                    'f-objetivo'
                );

            const habilidades =
                document.getElementById(
                    'f-habilidades'
                );

            const cursos =
                document.getElementById(
                    'f-cursos'
                );


            /* =================================================
               VALIDAÇÃO
               ================================================= */

            const campos = [

                [
                    nome,
                    nome &&
                    nome.value.trim().length >= 3
                ],

                [
                    idade,
                    idade &&
                    parseInt(
                        idade.value
                    ) >= 14
                ],

                [
                    cidade,
                    cidade &&
                    cidade.value.trim().length >= 2
                ],

                [
                    estado,
                    estado &&
                    !!estado.value
                ],

                [
                    email,
                    email &&
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                        .test(
                            email.value
                        )
                ],

                [
                    instituicao,
                    instituicao &&
                    instituicao.value
                        .trim()
                        .length >= 2
                ],

                [
                    curso,
                    curso &&
                    curso.value
                        .trim()
                        .length >= 2
                ],

                [
                    ano,
                    ano &&
                    ano.value
                        .trim()
                        .length >= 2
                ],

                [
                    objetivo,
                    objetivo &&
                    objetivo.value
                        .trim()
                        .length >= 3
                ]

            ];


            campos.forEach(
                ([campo, correto]) => {

                    setError(
                        campo,
                        !correto
                    );

                    if (!correto) {
                        valido = false;
                    }
                }
            );


            if (
                currentModel ===
                'experiencia'
            ) {

                const experienciaValida =
                    experiencia &&
                    experiencia.value
                        .trim()
                        .length >= 3;

                setError(
                    experiencia,
                    !experienciaValida
                );

                if (!experienciaValida) {
                    valido = false;
                }

            } else {

                setError(
                    experiencia,
                    false
                );
            }


            if (
                !validarFormacoesAdicionais()
            ) {

                valido = false;
            }


            if (!valido) {

                alert(
                    'Preencha corretamente os campos obrigatórios.'
                );

                return;
            }


            /* =================================================
               COLETA DOS DADOS
               ================================================= */

            const dados = {

                nome:
                    nome.value.trim(),

                idade:
                    idade.value.trim(),

                cidade:
                    cidade.value.trim(),

                estado:
                    estado.value,

                email:
                    email.value.trim(),

                tel:
                    telefone
                        ? telefone.value.trim()
                        : '',

                inst:
                    instituicao.value.trim(),

                curso:
                    curso.value.trim(),

                ano:
                    ano.value.trim(),

                formacoes:
                    obterFormacoes(),

                objetivo:
                    objetivo
                        ? objetivo.value.trim()
                        : '',

                experiencia:
                    experiencia
                        ? experiencia.value.trim()
                        : '',

                habilidades:
                    habilidades
                        ? habilidades.value.trim()
                        : '',

                cursos:
                    cursos
                        ? cursos.value.trim()
                        : '',

                foto:
                    photoDataUrl
            };


            /* =================================================
               GERAÇÃO DO PDF
               ================================================= */

            try {

                if (currentModel === 'formacao') {

                    await gerarPdfFormacao(
                        dados
                    );

                } else {

                    await gerarPdfExperiencia(
                        dados
                    );
                }

            } catch (error) {

                console.error(error);

                alert(
                    'Ocorreu um erro ao gerar o PDF.'
                );
            }

        }
    );


/* =========================================================
   CONFIGURAÇÃO BASE DO PDF
   ========================================================= */

async function gerarPdfBase(dados) {

    const { jsPDF } =
        window.jspdf;

    const doc =
        new jsPDF({

            unit: 'mm',

            format: 'a4'
        });


    const sidebarW = 60;

    const larguraPagina = 210;

    const alturaPagina = 297;

    const mainX =
        sidebarW + 10;


    /* =================================================
       FUNDO DA LATERAL
       ================================================= */

    doc.setFillColor(
        192,
        224,
        252
    );

    doc.rect(
        0,
        0,
        sidebarW,
        alturaPagina,
        'F'
    );


    /* =================================================
       FOTO CIRCULAR
       ================================================= */

    let sideY = 12;

    if (dados.foto) {

        try {

            const fotoCircular =
                await criarFotoCircular(
                    dados.foto
                );

            doc.addImage(
                fotoCircular,
                'PNG',
                11,
                sideY,
                38,
                38
            );

            sideY += 44;

        } catch (error) {

            console.error(
                'Erro ao processar foto:',
                error
            );
        }

    } else {

        sideY += 2;
    }


    const dark =
        [30, 58, 95];


    /* =================================================
       FUNÇÕES DA LATERAL
       ================================================= */

    function sideTitle(
        titulo,
        y
    ) {

        doc.setFont(
            'helvetica',
            'bold'
        );

        doc.setFontSize(10);

        doc.setTextColor(
            dark[0],
            dark[1],
            dark[2]
        );

        doc.text(
            titulo.toUpperCase(),
            10,
            y
        );

        y += 3;

        doc.setDrawColor(
            dark[0],
            dark[1],
            dark[2]
        );

        doc.setLineWidth(
            0.3
        );

        doc.line(
            10,
            y,
            sidebarW - 10,
            y
        );

        y += 5;

        return y;
    }


    function sideText(
        texto,
        y,
        tamanho = 9,
        negrito = false
    ) {

        if (!texto) {
            return y;
        }

        doc.setFont(
            'helvetica',
            negrito
                ? 'bold'
                : 'normal'
        );

        doc.setFontSize(
            tamanho
        );

        doc.setTextColor(
            dark[0],
            dark[1],
            dark[2]
        );

        const linhas =
            doc.splitTextToSize(
                texto,
                sidebarW - 20
            );

        doc.text(
            linhas,
            10,
            y
        );

        return (
            y +
            linhas.length * 3.5 +
            2
        );
    }


    /* =================================================
       CONTATO
       ================================================= */

    sideY =
        sideTitle(
            'Contato',
            sideY
        );


    sideY =
        sideText(
            `${dados.cidade} / ${dados.estado}`,
            sideY,
            8.5,
            true
        );


    if (dados.tel) {

        sideY =
            sideText(
                dados.tel,
                sideY,
                8
            );
    }


    sideY =
        sideText(
            dados.email,
            sideY,
            7.5
        );


    /* =================================================
       FORMAÇÃO NA LATERAL
       ================================================= */

    sideY =
        sideTitle(
            'Formação Acadêmica',
            sideY
        );


    dados.formacoes.forEach(
        formacao => {

            if (
                formacao.curso
            ) {

                sideY =
                    sideText(
                        formacao.curso,
                        sideY,
                        8.5,
                        true
                    );
            }

            if (
                formacao.inst
            ) {

                sideY =
                    sideText(
                        formacao.inst,
                        sideY,
                        7.5
                    );
            }

            if (
                formacao.ano
            ) {

                sideY =
                    sideText(
                        formacao.ano,
                        sideY,
                        7.5
                    );
            }
        }
    );

    /* =================================================
       NOME
       ================================================= */

    let mainY = 18;

    doc.setFont(
        'helvetica',
        'bold'
    );

    doc.setFontSize(
        20
    );

    doc.setTextColor(
        dark[0],
        dark[1],
        dark[2]
    );


    doc.text(
        dados.nome
            .toUpperCase(),
        mainX,
        mainY
    );


    mainY += 10;


    return {

        doc,

        mainX,

        mainY,

        dark,

        larguraPagina,

        alturaPagina
    };
}


/* =========================================================
   FUNÇÕES DE TEXTO DO PDF
   ========================================================= */

function criarTituloSecao(
    doc,
    titulo,
    x,
    y,
    dark
) {

    doc.setFont(
        'helvetica',
        'bold'
    );

    doc.setFontSize(
        11
    );

    doc.setTextColor(
        dark[0],
        dark[1],
        dark[2]
    );

    doc.text(
        titulo.toUpperCase(),
        x,
        y
    );

    y += 3;

    doc.setDrawColor(
        dark[0],
        dark[1],
        dark[2]
    );

    doc.setLineWidth(
        0.4
    );

    doc.line(
        x,
        y,
        200,
        y
    );

    return y + 7;
}


function escreverTextoPDF(
    doc,
    texto,
    x,
    y,
    largura
) {

    if (!texto) {
        return y;
    }

    doc.setFont(
        'helvetica',
        'normal'
    );

    doc.setFontSize(
        10
    );

    doc.setTextColor(
        40,
        40,
        40
    );

    const linhas =
        doc.splitTextToSize(
            texto,
            largura
        );

    doc.text(
        linhas,
        x,
        y
    );

    return (
        y +
        linhas.length * 4 +
        5
    );
}


/* =========================================================
   MODELO 01
   ========================================================= */

async function gerarPdfFormacao(
    dados
) {

    const {

        doc,

        mainX,

        mainY,

        dark

    } =
        await gerarPdfBase(
            dados
        );


    let y = mainY;


    /* =================================================
       OBJETIVO PROFISSIONAL
       ================================================= */

    if (dados.objetivo) {

        y =
            criarTituloSecao(
                doc,
                'Objetivo Profissional',
                mainX,
                y,
                dark
            );

        y =
            escreverTextoPDF(
                doc,
                dados.objetivo,
                mainX,
                y,
                140
            );
    }


    /* =================================================
       EXPERIÊNCIA
       ================================================= */

    if (dados.experiencia) {

        y =
            criarTituloSecao(
                doc,
                'Experiência Profissional',
                mainX,
                y,
                dark
            );

        y =
            escreverTextoPDF(
                doc,
                dados.experiencia,
                mainX,
                y,
                140
            );
    }


    /* =================================================
       FORMAÇÃO ACADÊMICA
       ================================================= */

    y =
        criarTituloSecao(
            doc,
            'Formação Acadêmica',
            mainX,
            y,
            dark
        );


    dados.formacoes.forEach(
        (formacao, index) => {

            if (
                !formacao.inst &&
                !formacao.curso &&
                !formacao.ano
            ) {
                return;
            }


            doc.setFont(
                'helvetica',
                'bold'
            );

            doc.setFontSize(
                10
            );

            doc.setTextColor(
                40,
                40,
                40
            );


            doc.text(
                `${index + 1}. ${formacao.curso}`,
                mainX,
                y
            );

            y += 5;


            doc.setFont(
                'helvetica',
                'normal'
            );

            doc.text(
                formacao.inst,
                mainX,
                y
            );

            y += 5;


            doc.text(
                formacao.ano,
                mainX,
                y
            );

            y += 7;
        }
    );


    /* =================================================
       CURSOS E CERTIFICAÇÕES
       ================================================= */

    if (dados.cursos) {

        y =
            criarTituloSecao(
                doc,
                'Cursos e Certificações',
                mainX,
                y,
                dark
            );

        y =
            escreverTextoPDF(
                doc,
                dados.cursos,
                mainX,
                y,
                140
            );
    }


    /* =================================================
       HABILIDADES
       ================================================= */

    if (dados.habilidades) {

        y =
            criarTituloSecao(
                doc,
                'Habilidades e Competências',
                mainX,
                y,
                dark
            );

        escreverTextoPDF(
            doc,
            dados.habilidades,
            mainX,
            y,
            140
        );
    }


    doc.save(
        `curriculo-${slug(
            dados.nome
        )}-formacao.pdf`
    );
}


/* =========================================================
   MODELO 02
   ========================================================= */

async function gerarPdfExperiencia(
    dados
) {

    const {

        doc,

        mainX,

        mainY,

        dark

    } =
        await gerarPdfBase(
            dados
        );


    let y = mainY;


    /* =================================================
       OBJETIVO
       ================================================= */

    if (dados.objetivo) {

        y =
            criarTituloSecao(
                doc,
                'Objetivo Profissional',
                mainX,
                y,
                dark
            );

        y =
            escreverTextoPDF(
                doc,
                dados.objetivo,
                mainX,
                y,
                140
            );
    }


    /* =================================================
       EXPERIÊNCIA
       ================================================= */

    if (dados.experiencia) {

        y =
            criarTituloSecao(
                doc,
                'Experiência Profissional',
                mainX,
                y,
                dark
            );

        y =
            escreverTextoPDF(
                doc,
                dados.experiencia,
                mainX,
                y,
                140
            );
    }


    /* =================================================
       FORMAÇÃO
       ================================================= */

    y =
        criarTituloSecao(
            doc,
            'Formação Acadêmica',
            mainX,
            y,
            dark
        );


    dados.formacoes.forEach(
        (formacao, index) => {

            if (
                !formacao.inst &&
                !formacao.curso &&
                !formacao.ano
            ) {
                return;
            }


            doc.setFont(
                'helvetica',
                'bold'
            );

            doc.setFontSize(
                10
            );

            doc.setTextColor(
                40,
                40,
                40
            );


            doc.text(
                `${index + 1}. ${formacao.curso}`,
                mainX,
                y
            );

            y += 5;


            doc.setFont(
                'helvetica',
                'normal'
            );

            doc.text(
                formacao.inst,
                mainX,
                y
            );

            y += 5;


            doc.text(
                formacao.ano,
                mainX,
                y
            );

            y += 7;
        }
    );


    /* =================================================
       CURSOS
       ================================================= */

    if (dados.cursos) {

        y =
            criarTituloSecao(
                doc,
                'Cursos e Certificações',
                mainX,
                y,
                dark
            );

        y =
            escreverTextoPDF(
                doc,
                dados.cursos,
                mainX,
                y,
                140
            );
    }


    /* =================================================
       HABILIDADES
       ================================================= */

    if (dados.habilidades) {

        y =
            criarTituloSecao(
                doc,
                'Habilidades e Competências',
                mainX,
                y,
                dark
            );

        escreverTextoPDF(
            doc,
            dados.habilidades,
            mainX,
            y,
            140
        );
    }


    doc.save(
        `curriculo-${slug(
            dados.nome
        )}-experiencia.pdf`
    );
}


/* =========================================================
   NOME DO ARQUIVO
   ========================================================= */

function slug(texto) {

    return texto

        .toLowerCase()

        .normalize('NFD')

        .replace(
            /[\u0300-\u036f]/g,
            ''
        )

        .replace(
            /[^a-z0-9]+/g,
            '-'
        )

        .replace(
            /^-+|-+$/g,
            ''
        )

        || 'candidato';
}


/* =========================================================
   GARANTE QUE AS FUNÇÕES FIQUEM DISPONÍVEIS NO HTML
   ========================================================= */

window.goToForm =
    goToForm;

window.goToWelcome =
    goToWelcome;

window.toggleCamera =
    toggleCamera;

window.capturePhoto =
    capturePhoto;

window.handleFileSelect =
    handleFileSelect;

window.retakePhoto =
    retakePhoto;

window.adicionarFormacao =
    adicionarFormacao;

window.removerFormacao =
    removerFormacao;