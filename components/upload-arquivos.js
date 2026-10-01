/* Selecao e transporte dos documentos obrigatorios do cadastro. */
(function () {
  const MAX_BYTES = 5 * 1024 * 1024;
  const categorias = {
    FISICA: [['DOCUMENTO_FOTO', 'Documento com foto'], ['COMPROVANTE_RESIDENCIA', 'Comprovante de residência']],
    JURIDICA: [['DOCUMENTO_RT', 'Documento com foto do RT (responsável técnico)'], ['ART', 'ART — Anotação de Responsabilidade Técnica']]
  };

  function validarArquivo(arquivo) {
    if (!arquivo || !arquivo.size) throw new Error('Selecione um arquivo que não esteja vazio.');
    if (arquivo.size > MAX_BYTES) throw new Error('Cada arquivo deve ter no máximo 5 MB.');
    const extensao = { 'application/pdf': /\.pdf$/i, 'image/jpeg': /\.jpe?g$/i, 'image/png': /\.png$/i }[arquivo.type];
    if (!extensao || !extensao.test(arquivo.name)) throw new Error('Selecione um arquivo PDF, JPG/JPEG ou PNG.');
    if (arquivo.name.length > 180 || /[\x00-\x1f/\\]/.test(arquivo.name)) throw new Error('Use um nome de arquivo com até 180 caracteres, sem barras.');
  }

  function serializarArquivo(arquivo, categoria) {
    validarArquivo(arquivo);
    return new Promise((resolve, reject) => {
      const leitor = new FileReader();
      leitor.onerror = () => reject(new Error('Não foi possível ler o arquivo. Selecione-o novamente.'));
      leitor.onabort = leitor.onerror;
      leitor.onload = () => resolve({ categoria, nome: arquivo.name, mimeType: arquivo.type, tamanho: arquivo.size, base64: String(leitor.result).split(',')[1] });
      leitor.readAsDataURL(arquivo);
    });
  }

  function criar(secao) {
    const campos = Array.from(secao.querySelectorAll('[data-documento-campo]'));
    let tipoAnterior = '';
    let ativoAnterior = false;
    function limparCampo(campo) {
      const input = campo.querySelector('input');
      input.value = '';
      input.setCustomValidity('');
      campo.querySelector('[data-documento-status]').textContent = 'Nenhum arquivo selecionado.';
      campo.querySelector('[data-documento-remover]').hidden = true;
    }
    function limpar() { campos.forEach(limparCampo); }
    campos.forEach((campo) => {
      const input = campo.querySelector('input');
      input.addEventListener('change', () => {
        const status = campo.querySelector('[data-documento-status]');
        input.setCustomValidity('');
        if (!input.files.length) { limparCampo(campo); return; }
        try {
          if (input.files.length !== 1) throw new Error('Selecione somente um arquivo por documento.');
          validarArquivo(input.files[0]);
          status.textContent = `${input.files[0].name} · ${(input.files[0].size / (1024 * 1024)).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} MB`;
          campo.querySelector('[data-documento-remover]').hidden = false;
        } catch (erro) {
          limparCampo(campo);
          status.textContent = erro.message;
          input.setCustomValidity(erro.message);
        }
      });
      campo.querySelector('[data-documento-remover]').addEventListener('click', () => limparCampo(campo));
    });
    function atualizar(tipoPessoa, ativo) {
      if (tipoPessoa !== tipoAnterior || ativo !== ativoAnterior) limpar();
      tipoAnterior = tipoPessoa;
      ativoAnterior = ativo;
      secao.hidden = !ativo;
      campos.forEach((campo, i) => {
        const categoria = categorias[tipoPessoa]?.[i];
        const input = campo.querySelector('input');
        input.dataset.documentoCategoria = categoria?.[0] || '';
        input.disabled = !ativo || !categoria;
        input.required = ativo && Boolean(categoria);
        campo.querySelector('[data-documento-rotulo]').textContent = categoria ? `${categoria[1]} *` : 'Selecione o tipo de pessoa acima';
        campo.querySelector('[data-documento-remover]').disabled = input.disabled;
      });
    }
    async function coletar() {
      if (!ativoAnterior || !categorias[tipoAnterior]) throw new Error('Selecione Pessoa física ou Pessoa jurídica.');
      const documentos = [];
      for (const campo of campos) {
        const input = campo.querySelector('input');
        if (input.files.length !== 1) throw new Error(`Envie ${campo.querySelector('[data-documento-rotulo]').textContent.replace(' *', '')}.`);
        documentos.push(await serializarArquivo(input.files[0], input.dataset.documentoCategoria));
      }
      return documentos;
    }
    return { atualizar, coletar, limpar };
  }

  window.UploadDocumentos = { validarArquivo, serializarArquivo, criar };
})();
