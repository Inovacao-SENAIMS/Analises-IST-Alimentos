/* Gestão de documentos: lista os anexos do cadastro e permite visualizar/baixar. */
(function () {
  AppAuth.configurarCabecalho();
  if (!AppAuth.exigirGrupos(['IST_Colaborators', 'Manager_User', 'Administrator_User'])) return;

  const ROTULOS_TIPO = { FISICA: 'Pessoa física', JURIDICA: 'Pessoa jurídica' };
  const ROTULOS_CATEGORIA = {
    DOCUMENTO_FOTO: 'Documento com foto',
    COMPROVANTE_RESIDENCIA: 'Comprovante de residência',
    DOCUMENTO_RT: 'Documento do RT',
    ART: 'ART'
  };

  const corpo = document.querySelector('#docs-body');
  const status = document.querySelector('#documentos-status');
  const vazio = document.querySelector('#docs-empty');
  const busca = document.querySelector('#docs-busca');
  const categoria = document.querySelector('#docs-categoria');
  const tipo = document.querySelector('#docs-tipo');
  const atualizar = document.querySelector('#docs-refresh');
  const modal = document.querySelector('#doc-modal');
  const modalTitulo = document.querySelector('#doc-modal-title');
  const modalCorpo = document.querySelector('#doc-modal-body');

  let documentos = [];
  let visualizacao = null;

  function escapar(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, (caractere) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[caractere]));
  }

  function mostrarStatus(mensagem, tipoStatus = 'success') {
    status.textContent = mensagem;
    status.className = `status show ${tipoStatus}`;
  }

  function formatarTamanho(bytes) {
    const valor = Number(bytes) || 0;
    if (valor < 1024) return `${valor} B`;
    if (valor < 1024 * 1024) return `${(valor / 1024).toFixed(0)} KB`;
    return `${(valor / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatarData(valor) {
    if (!valor) return '—';
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleString('pt-BR');
  }

  function base64ParaBlob(base64, mimeType) {
    const binario = atob(base64);
    const bytes = new Uint8Array(binario.length);
    for (let i = 0; i < binario.length; i += 1) bytes[i] = binario.charCodeAt(i);
    return new Blob([bytes], { type: mimeType || 'application/octet-stream' });
  }

  function filtrados() {
    const texto = busca.value.trim().toLowerCase();
    const cat = categoria.value;
    const pessoa = tipo.value;
    return documentos.filter((documento) => {
      if (cat && documento.categoria !== cat) return false;
      if (pessoa && documento.tipoPessoa !== pessoa) return false;
      if (texto && !(`${documento.usuarioNome} ${documento.usuarioEmail}`.toLowerCase().includes(texto))) return false;
      return true;
    });
  }

  function renderizar() {
    const itens = filtrados();
    vazio.hidden = itens.length > 0;
    corpo.innerHTML = itens.map((documento) => `
      <tr>
        <td data-label="Usuário"><strong>${escapar(documento.usuarioNome)}</strong><br><small>${escapar(documento.usuarioEmail)}</small></td>
        <td data-label="Tipo">${escapar(ROTULOS_TIPO[documento.tipoPessoa] || documento.tipoPessoa || '—')}</td>
        <td data-label="Categoria">${escapar(ROTULOS_CATEGORIA[documento.categoria] || documento.categoria || '—')}</td>
        <td data-label="Arquivo">${escapar(documento.nomeOriginal || '—')}</td>
        <td data-label="Tamanho">${escapar(formatarTamanho(documento.tamanho))}</td>
        <td data-label="Data">${escapar(formatarData(documento.dataUpload))}</td>
        <td data-label="Ação">
          <div class="admin-row-actions">
            <button class="button primary" type="button" data-acao="visualizar" data-id="${escapar(documento.documentoId)}">Visualizar</button>
            <button class="button docs-download-button" type="button" data-acao="baixar" data-id="${escapar(documento.documentoId)}">Baixar</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function preencherCategorias() {
    const valores = Array.from(new Set(documentos.map((documento) => documento.categoria).filter(Boolean)));
    const atual = categoria.value;
    categoria.innerHTML = '<option value="">Todas</option>' + valores
      .map((valor) => `<option value="${escapar(valor)}">${escapar(ROTULOS_CATEGORIA[valor] || valor)}</option>`)
      .join('');
    categoria.value = valores.includes(atual) ? atual : '';
  }

  async function carregar() {
    atualizar.disabled = true;
    mostrarStatus('Carregando documentos…', 'loading');
    try {
      const resultado = await AppAuth.requisitarApi('listarDocumentos');
      documentos = resultado.dados.documentos || [];
      preencherCategorias();
      renderizar();
      mostrarStatus(`${documentos.length} documento(s) carregado(s).`);
    } catch (erro) {
      mostrarStatus(erro.message, 'error');
    } finally {
      atualizar.disabled = false;
    }
  }

  async function buscarArquivo(botao, documentoId) {
    const rotulo = botao.textContent;
    botao.disabled = true;
    botao.textContent = 'Abrindo…';
    try {
      const resultado = await AppAuth.requisitarApi('obterDocumento', { dados: { documentoId } });
      return resultado.dados;
    } finally {
      botao.disabled = false;
      botao.textContent = rotulo;
    }
  }

  function baixarArquivo(documento, blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = documento.nome || 'documento';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function fecharModal() {
    if (visualizacao && visualizacao.url) URL.revokeObjectURL(visualizacao.url);
    visualizacao = null;
    modal.hidden = true;
    modalCorpo.innerHTML = '';
  }

  function abrirModal(documento, blob) {
    fecharModal();
    const url = URL.createObjectURL(blob);
    visualizacao = { documento, blob, url };
    modalTitulo.textContent = documento.nome || 'Documento';
    modalCorpo.innerHTML = documento.mimeType === 'application/pdf'
      ? `<iframe class="doc-preview-frame" src="${url}" title="${escapar(documento.nome || 'Documento')}"></iframe>`
      : `<img class="doc-preview-image" src="${url}" alt="${escapar(documento.nome || 'Documento')}">`;
    modal.hidden = false;
  }

  async function acaoVisualizar(botao, documentoId) {
    try {
      const arquivo = await buscarArquivo(botao, documentoId);
      abrirModal(arquivo, base64ParaBlob(arquivo.base64, arquivo.mimeType));
    } catch (erro) {
      mostrarStatus(erro.message, 'error');
    }
  }

  async function acaoBaixar(botao, documentoId) {
    try {
      const arquivo = await buscarArquivo(botao, documentoId);
      baixarArquivo(arquivo, base64ParaBlob(arquivo.base64, arquivo.mimeType));
    } catch (erro) {
      mostrarStatus(erro.message, 'error');
    }
  }

  corpo.addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-acao]');
    if (!botao) return;
    const documentoId = botao.dataset.id;
    if (botao.dataset.acao === 'visualizar') acaoVisualizar(botao, documentoId);
    else acaoBaixar(botao, documentoId);
  });

  modal.querySelectorAll('[data-doc-close]').forEach((elemento) => elemento.addEventListener('click', fecharModal));
  modal.querySelector('[data-doc-download]').addEventListener('click', () => {
    if (visualizacao) baixarArquivo(visualizacao.documento, visualizacao.blob);
  });
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && !modal.hidden) fecharModal();
  });

  busca.addEventListener('input', renderizar);
  categoria.addEventListener('change', renderizar);
  tipo.addEventListener('change', renderizar);
  atualizar.addEventListener('click', carregar);

  carregar();
})();
