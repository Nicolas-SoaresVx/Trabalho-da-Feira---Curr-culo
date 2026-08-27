/* =========================
   VARIÁVEIS PRINCIPAIS
   ========================= */

// Modelo de currículo selecionado
let currentModel = 'formacao';

// Guarda o acesso à câmera
let stream = null;

// Guarda a foto em formato Data URL
let photoDataUrl = null;


/* =========================
   INFORMAÇÕES DOS MODELOS
   ========================= */

const MODEL_INFO = {
  // Modelo para quem não possui experiência
  formacao: {
    name:'Somente formação acadêmica',
    color:'#c0e0fc',
    code:'01-FORMACAO'
  },

  // Modelo para quem possui experiência
  experiencia: {
    name:'Com experiência',
    color:'#c0e0fc',
    code:'02-EXPERIENCIA'
  }
};


/* =========================
   NAVEGAÇÃO ENTRE TELAS
   ========================= */

// Abre o formulário do modelo escolhido
function goToForm(model){
  currentModel = model;

  const info = MODEL_INFO[model];

  document.getElementById('screen-welcome').classList.remove('active');
  document.getElementById('screen-form').classList.add('active');

  document.getElementById('screen-form')
    .style.setProperty('--model-color', info.color);

  document.getElementById('form-chip').textContent =
    'MODELO ' + (model==='formacao'?'01':'02');

  document.getElementById('form-title').textContent = info.name;

  document.getElementById('proto-model').textContent = info.code;

  const isFormacao = model==='formacao';

  // Mostra o campo de experiência nos dois modelos
  document.getElementById('field-exp').style.display =
    isFormacao? 'block' : 'block';

  // O "*" aparece somente no modelo que exige experiência
  document.getElementById('exp-req-mark').style.display =
    isFormacao? 'none' : 'inline';

  document.getElementById('exp-req-mark').textContent = '*';

  resetForm();
}


// Volta para a tela inicial
function goToWelcome(){
  stopCamera();

  document.getElementById('screen-form').classList.remove('active');
  document.getElementById('screen-welcome').classList.add('active');
}


/* =========================
   RESET DO FORMULÁRIO
   ========================= */

// Limpa os dados do formulário e da foto
function resetForm(){

  document.getElementById('curriculo-form').reset();

  // Remove os erros dos campos
  document.querySelectorAll('.err')
    .forEach(el=>el.classList.remove('err'));

  document.querySelectorAll('.errmsg')
    .forEach(el=>el.classList.remove('show'));

  photoDataUrl=null;

  stopCamera();

  // Limpa a visualização da foto
  const pv=document.getElementById('photo-preview');
  pv.style.display='none';
  pv.src='';

  document.getElementById('booth-placeholder').style.display='flex';
  document.getElementById('video').style.display='none';

  document.getElementById('btn-capture').style.display='none';
  document.getElementById('btn-retake').style.display='none';
}


/* =========================
   MÁSCARA DO CPF
   ========================= */

// Formata o CPF enquanto o usuário digita
document.getElementById('f-cpf').addEventListener('input', e=>{

  // Remove tudo que não for número
  let v=e.target.value.replace(/\D/g,'').slice(0,11);

  // Adiciona pontos e hífen
  v=v.replace(/(\d{3})(\d)/,'$1.$2')
     .replace(/(\d{3})(\d)/,'$1.$2')
     .replace(/(\d{3})(\d{1,2})$/,'$1-$2');

  e.target.value=v;
});


/* =========================
   CÂMERA
   ========================= */

// Ativa ou desativa a câmera
async function toggleCamera(){

  // Se a câmera já estiver ativa, desativa
  if(stream){
    stopCamera();
    return;
  }

  try{

    // Solicita acesso à câmera
    stream=await navigator.mediaDevices.getUserMedia({
      video:{facingMode:'user'}
    });

    const video=document.getElementById('video');

    video.srcObject=stream;

    await video.play();

    // Mostra a câmera
    video.style.display='block';

    document.getElementById('booth-placeholder').style.display='none';
    document.getElementById('photo-preview').style.display='none';

    document.getElementById('btn-capture').style.display='inline-block';

  }catch{
    // Caso não seja possível acessar a câmera
    alert('Não foi possível acessar a câmera');
  }
}


// Desliga a câmera
function stopCamera(){

  if(stream){
    stream.getTracks().forEach(t=>t.stop());
    stream=null;
  }

  document.getElementById('video').style.display='none';

  document.getElementById('btn-capture').style.display='none';
}


/* =========================
   CAPTURA DA FOTO
   ========================= */

// Captura uma foto utilizando a câmera
function capturePhoto(){

  const video=document.getElementById('video');
  const canvas=document.getElementById('capture-canvas');

  // Define o tamanho do canvas de acordo com o vídeo
  canvas.width=video.videoWidth;
  canvas.height=video.videoHeight;

  // Desenha a imagem da câmera no canvas
  canvas.getContext('2d').drawImage(video,0,0);

  // Converte a imagem para JPEG
  photoDataUrl=canvas.toDataURL('image/jpeg',0.85);

  // Mostra a foto capturada
  const pv=document.getElementById('photo-preview');

  pv.src=photoDataUrl;
  pv.style.display='block';

  video.style.display='none';

  stopCamera();

  document.getElementById('btn-retake').style.display='inline-block';
  document.getElementById('booth-placeholder').style.display='none';
}


/* =========================
   FOTO DA GALERIA
   ========================= */

// Processa uma imagem escolhida pelo usuário
function handleFileSelect(e){

  const file=e.target.files[0];

  if(!file) return;

  // Limita o tamanho da imagem a 2MB
  if(file.size > 2*1024*1024){
    alert('Imagem muito grande. Máximo 2MB.');
    return;
  }

  const reader=new FileReader();

  reader.onload=ev=>{

    // Guarda a imagem
    photoDataUrl=ev.target.result;

    // Mostra a imagem escolhida
    const pv=document.getElementById('photo-preview');

    pv.src=photoDataUrl;
    pv.style.display='block';

    document.getElementById('booth-placeholder').style.display='none';
    document.getElementById('video').style.display='none';

    document.getElementById('btn-retake').style.display='inline-block';
  };

  reader.readAsDataURL(file);
}


/* =========================
   REMOVER FOTO
   ========================= */

// Remove a foto selecionada
function retakePhoto(){

  photoDataUrl=null;

  document.getElementById('photo-preview').style.display='none';

  document.getElementById('booth-placeholder').style.display='flex';

  document.getElementById('btn-retake').style.display='none';

  document.getElementById('f-foto-file').value='';
}


/* =========================
   VALIDAÇÃO DOS CAMPOS
   ========================= */

// Adiciona ou remove o estado de erro de um campo
function setError(input, has){

  input.classList.toggle('err', has);

  const msg=input.parentElement.querySelector('.errmsg');

  if(msg)
    msg.classList.toggle('show', has);
}


/* =========================
   ENVIO DO FORMULÁRIO
   ========================= */

document.getElementById('curriculo-form')
  .addEventListener('submit', function(e){

  // Impede o envio padrão do formulário
  e.preventDefault();

  let valid=true;

  // Seleciona os campos do formulário
  const nome=document.getElementById('f-nome');
  const cpf=document.getElementById('f-cpf');
  const idade=document.getElementById('f-idade');
  const cidade=document.getElementById('f-cidade');
  const estado=document.getElementById('f-estado');
  const email=document.getElementById('f-email');

  const inst=document.getElementById('f-inst');
  const curso=document.getElementById('f-curso');
  const ano=document.getElementById('f-ano');

  const exp=document.getElementById('f-experiencia');


  /* =========================
     REGRAS DE VALIDAÇÃO
     ========================= */

  const checks=[
    [nome, nome.value.trim().length>=3],
    [cpf, cpf.value.replace(/\D/g,'').length===11],
    [idade, idade.value && parseInt(idade.value)>=14],
    [cidade, cidade.value.trim().length>=2],
    [estado,!!estado.value],
    [email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)],
    [inst, inst.value.trim().length>=2],
    [curso, curso.value.trim().length>=2],
    [ano, ano.value.trim().length>=2],
  ];

  // Verifica cada campo
  checks.forEach(([inp,ok])=>{
    setError(inp,!ok);

    if(!ok)
      valid=false;
  });


  // Experiência é obrigatória somente no modelo 02
  if(currentModel==='experiencia'){

    const okExp=exp.value.trim().length>=3;

    setError(exp,!okExp);

    if(!okExp)
      valid=false;

  } else {

    setError(exp,false);
  }


  // Para o processo caso exista algum erro
  if(!valid) return;


  /* =========================
     COLETA DOS DADOS
     ========================= */

  const dados={
    nome:nome.value.trim(),

    cidade:cidade.value.trim(),

    estado:estado.value,

    email:email.value.trim(),

    tel:document.getElementById('f-tel').value.trim(),

    inst:inst.value.trim(),

    curso:curso.value.trim(),

    ano:ano.value.trim(),

    experiencia:exp.value.trim(),

    habilidades:document.getElementById('f-habilidades').value.trim(),

    idioma:document.getElementById('f-idioma').value.trim(),

    foto:photoDataUrl
  };


  /* =========================
     GERAÇÃO DO PDF
     ========================= */

  if(currentModel==='formacao')
    gerarPdfFormacao(dados);
  else
    gerarPdfExperiencia(dados);

});


/* =========================
   BASE DO PDF
   ========================= */

// Cria a estrutura básica do currículo
function gerarPdfBase(d){

  const {jsPDF}=window.jspdf;

  // Cria um PDF no formato A4
  const doc=new jsPDF({
    unit:'mm',
    format:'a4'
  });

  // Define a largura da lateral
  const sidebarW=60;


  // Cria o fundo azul da lateral
  doc.setFillColor(192,224,252);
  doc.rect(0,0,sidebarW,297,'F');


  let sideY=12;


  // Adiciona a foto caso exista
  if(d.foto){

    doc.addImage(
      d.foto,
      'JPEG',
      11,
      sideY,
      38,
      38
    );

    sideY+=44;

  } else {

    // Sem foto, continua normalmente
    sideY+=2;
  }


  // Cor dos textos principais do PDF
  const dark=[30,58,95];


  /* =========================
     FUNÇÕES DA LATERAL
     ========================= */

  // Cria um título na lateral
  function sideTitle(t,y){

    doc.setFont('helvetica','bold');

    doc.setFontSize(9);

    doc.setTextColor(
      dark[0],
      dark[1],
      dark[2]
    );

    doc.text(
      t.toUpperCase(),
      10,
      y
    );

    y+=2.5;

    doc.setDrawColor(
      dark[0],
      dark[1],
      dark[2]
    );

    doc.setLineWidth(0.3);

    doc.line(
      10,
      y,
      sidebarW-10,
      y
    );

    y+=5;

    return y;
  }


  // Adiciona texto na lateral
  function sideText(txt,y,size=8,bold=false){

    doc.setFont(
      'helvetica',
      bold?'bold':'normal'
    );

    doc.setFontSize(size);

    doc.setTextColor(
      dark[0],
      dark[1],
      dark[2]
    );

    const lines=doc.splitTextToSize(
      txt,
      sidebarW-20
    );

    doc.text(lines,10,y);

    return y+lines.length*3.2+2;
  }


  /* =========================
     INFORMAÇÕES DA LATERAL
     ========================= */

  sideY=sideTitle(
    'Contato',
    sideY
  );

  sideY=sideText(
    `${d.cidade} / ${d.estado}`,
    sideY,
    7.5,
    true
  );

  if(d.tel)
    sideY=sideText(
      d.tel,
      sideY,
      7.5,
      false
    );

  sideY=sideText(
    d.email,
    sideY,
    7,
    false
  );


  sideY=sideTitle(
    'Formação Acadêmica',
    sideY
  );

  sideY=sideText(
    d.curso,
    sideY,
    8,
    true
  );

  sideY=sideText(
    d.inst,
    sideY,
    7.5,
    false
  );

  sideY=sideText(
    d.ano,
    sideY,
    7,
    false
  );


  // Adiciona idiomas se o usuário preencher
  if(d.idioma){

    sideY=sideTitle(
      'Idiomas',
      sideY
    );

    sideY=sideText(
      d.idioma,
      sideY,
      7.5,
      false
    );
  }


  // Adiciona habilidades se o usuário preencher
  if(d.habilidades){

    sideY=sideTitle(
      'Habilidades',
      sideY
    );

    sideY=sideText(
      d.habilidades,
      sideY,
      7.5,
      false
    );
  }


  /* =========================
     ÁREA PRINCIPAL DO PDF
     ========================= */

  const mainX=sidebarW+10;

  let my=18;

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setFontSize(20);

  doc.setTextColor(
    dark[0],
    dark[1],
    dark[2]
  );


  // Exibe o nome do candidato em destaque
  const nomeU=d.nome.toUpperCase();

  doc.text(
    nomeU,
    mainX,
    my
  );

  my+=9;


  // Retorna os elementos necessários para os outros modelos
  return {
    doc,
    mainX,
    my,
    dark
  };
}


/* =========================
   PDF - MODELO FORMAÇÃO
   ========================= */

// Gera o currículo do modelo 01
function gerarPdfFormacao(d){

  const {
    doc,
    mainX,
    my,
    dark
  }=gerarPdfBase(d);

  let y=my;


  // Cria títulos das seções
  function secTitle(t){

    doc.setFont(
      'helvetica',
      'bold'
    );

    doc.setFontSize(11);

    doc.setTextColor(
      dark[0],
      dark[1],
      dark[2]
    );

    doc.text(
      t.toUpperCase(),
      mainX,
      y
    );

    y+=3;

    doc.setDrawColor(
      dark[0],
      dark[1],
      dark[2]
    );

    doc.setLineWidth(0.4);

    doc.line(
      mainX,
      y,
      200,
      y
    );

    y+=7;
  }


  // Adiciona textos ao corpo do currículo
  function body(txt){

    doc.setFont(
      'helvetica',
      'normal'
    );

    doc.setFontSize(9);

    doc.setTextColor(
      40,
      40,
      40
    );

    const lines=doc.splitTextToSize(
      txt,
      210-mainX-10
    );

    // Limita o conteúdo para uma página
    if(y+lines.length*4>280){
      lines.length=Math.floor(
        (280-y)/4
      );
    }

    doc.text(
      lines,
      mainX,
      y
    );

    y+=lines.length*4+8;
  }


  // Experiência é opcional nesse modelo
  if(d.experiencia){

    secTitle(
      'Experiência Profissional'
    );

    body(d.experiencia);
  }


  secTitle(
    'Cursos Complementares'
  );

  body(
    d.habilidades
      ? d.habilidades
      : 'Informática Básica, Pacote Office, Boa Comunicação, Trabalho em Equipe.'
  );


  // Salva o PDF no computador
  doc.save(
    `curriculo-${slug(d.nome)}-formacao.pdf`
  );
}


/* =========================
   PDF - MODELO EXPERIÊNCIA
   ========================= */

// Gera o currículo do modelo 02
function gerarPdfExperiencia(d){

  const {
    doc,
    mainX,
    my,
    dark
  }=gerarPdfBase(d);

  let y=my;


  // Cria títulos das seções
  function secTitle(t){

    doc.setFont(
      'helvetica',
      'bold'
    );

    doc.setFontSize(11);

    doc.setTextColor(
      dark[0],
      dark[1],
      dark[2]
    );

    doc.text(
      t.toUpperCase(),
      mainX,
      y
    );

    y+=3;

    doc.setDrawColor(
      dark[0],
      dark[1],
      dark[2]
    );

    doc.setLineWidth(0.4);

    doc.line(
      mainX,
      y,
      200,
      y
    );

    y+=7;
  }


  // Adiciona textos ao corpo do currículo
  function body(txt){

    doc.setFont(
      'helvetica',
      'normal'
    );

    doc.setFontSize(9);

    doc.setTextColor(
      40,
      40,
      40
    );

    const lines=doc.splitTextToSize(
      txt,
      210-mainX-10
    );

    // Limita o conteúdo para uma página
    if(y+lines.length*4>280){
      lines.length=Math.floor(
        (280-y)/4
      );
    }

    doc.text(
      lines,
      mainX,
      y
    );

    y+=lines.length*4+8;
  }


  // Resumo profissional
  secTitle('Resumo');

  body(
    `Profissional com experiência em ${d.experiencia.substring(0,60)}... Busco oportunidade para aplicar conhecimentos em ${d.curso}.`
  );


  // Experiência profissional
  secTitle(
    'Experiência Profissional'
  );

  body(d.experiencia);


  // Formação acadêmica
  secTitle(
    'Formação Acadêmica'
  );

  body(
    `${d.curso} - ${d.inst} - ${d.ano}`
  );


  // Salva o PDF
  doc.save(
    `curriculo-${slug(d.nome)}-experiencia.pdf`
  );
}


/* =========================
   NOME DO ARQUIVO
   ========================= */

// Transforma o nome em um formato adequado para o nome do PDF
function slug(s){

  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-')
    || 'candidato';
}