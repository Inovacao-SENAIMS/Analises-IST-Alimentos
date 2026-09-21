/* Gera comprovantes e relatórios públicos no navegador, sem acesso à planilha. */
(function () {
  const MARGEM = 18;
  const LARGURA_CONTEUDO = 174;
  const ALTURA_MINIMA_RODAPE = 22;

  function obterDocumento() {
    const ConstrutorPdf = window.jspdf?.jsPDF;
    if (!ConstrutorPdf) {
      throw new Error('Não foi possível carregar o gerador de PDF. Verifique sua conexão e tente novamente.');
    }
    return new ConstrutorPdf({ unit: 'mm', format: 'a4' });
  }

  function texto(valor, padrao = 'Não informado') {
    const resultado = String(valor ?? '').trim();
    return resultado || padrao;
  }

  function nomeArquivo(titulo, identificador) {
    const base = `${titulo}-${identificador || 'solicitacao'}`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
    return `${base || 'relatorio-solicitacao'}.pdf`;
  }

  function escreverCabecalho(doc, titulo, subtitulo) {
    doc.setFillColor(0, 61, 114);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.text('SENAI FIEMS', MARGEM, 13);
    doc.setFontSize(11);
    doc.text(titulo, MARGEM, 21);
    doc.setTextColor(35, 43, 51);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    return 37 + escreverLinhas(doc, doc.splitTextToSize(texto(subtitulo, ''), LARGURA_CONTEUDO), 37, 5);
  }

  function escreverLinhas(doc, linhas, y, espacamento = 5) {
    linhas.forEach((linha) => {
      if (y > 297 - ALTURA_MINIMA_RODAPE) {
        doc.addPage();
        y = 18;
      }
      doc.text(linha, MARGEM, y);
      y += espacamento;
    });
    return y;
  }

  function escreverSecao(doc, titulo, campos, y) {
    const itens = Array.isArray(campos) ? campos : [];
    if (!itens.length) return y;

    if (y > 265) {
      doc.addPage();
      y = 18;
    }
    doc.setTextColor(0, 61, 114);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(titulo, MARGEM, y);
    y += 7;
    doc.setTextColor(35, 43, 51);
    doc.setFontSize(9);

    itens.forEach((campo) => {
      const rotulo = texto(campo.rotulo || campo.label, 'Informação');
      const valor = texto(campo.valor ?? campo.value);
      const linhas = doc.splitTextToSize(`${rotulo}: ${valor}`, LARGURA_CONTEUDO);
      doc.setFont('helvetica', 'normal');
      y = escreverLinhas(doc, linhas, y, 4.5) + 1;
    });
    return y + 2;
  }

  function escreverRelacionados(doc, relacionados, y) {
    const itens = Array.isArray(relacionados) ? relacionados : [];
    if (!itens.length) return y;
    itens.forEach((item, indice) => {
      y = escreverSecao(doc, `Item ${texto(item.numero, indice + 1)}`, item.campos, y);
    });
    return y;
  }

  function escreverRodapes(doc) {
    const total = doc.getNumberOfPages();
    for (let pagina = 1; pagina <= total; pagina += 1) {
      doc.setPage(pagina);
      doc.setDrawColor(210, 214, 220);
      doc.line(MARGEM, 284, 210 - MARGEM, 284);
      doc.setTextColor(94, 103, 112);
      doc.setFontSize(8);
      doc.text('Documento gerado eletronicamente pelo Portal de Serviços SENAI FIEMS.', MARGEM, 290);
      doc.text(`Página ${pagina} de ${total}`, 210 - MARGEM, 290, { align: 'right' });
    }
  }

  function gerarDocumento(titulo, dados) {
    if (!dados || !dados.solicitacaoId) throw new Error('Não foi possível preparar os dados do relatório.');
    const doc = obterDocumento();
    const dataEnvio = texto(dados.dataEnvio, new Date().toLocaleString('pt-BR'));
    let y = escreverCabecalho(doc, titulo, `${texto(dados.titulo, 'Solicitação')} • ${dados.solicitacaoId}`);
    y = escreverSecao(doc, 'Identificação', [
      { rotulo: 'Número da solicitação', valor: dados.solicitacaoId },
      { rotulo: 'Data de envio', valor: dataEnvio },
      { rotulo: 'Status', valor: texto(dados.status, 'Enviada') }
    ], y);
    y = escreverSecao(doc, 'Dados informados', dados.campos, y);
    escreverRelacionados(doc, dados.relacionados, y);
    escreverRodapes(doc);
    doc.save(nomeArquivo(titulo, dados.solicitacaoId));
  }

  function gerarResumo(solicitacoes, filtros) {
    if (!Array.isArray(solicitacoes) || !solicitacoes.length) {
      throw new Error('Não há solicitações para exportar.');
    }
    const doc = obterDocumento();
    const termo = texto(filtros?.termoBusca, 'Todos os registros');
    let y = escreverCabecalho(doc, 'Relatório resumido de solicitações', `Filtro aplicado: ${termo}`);
    const campos = solicitacoes.map((item) => ({
      rotulo: texto(item.solicitacaoId, 'Solicitação'),
      valor: `${texto(item.titulo)} | ${texto(item.dataEnvio)} | ${texto(item.status, 'Enviada')}`
    }));
    y = escreverSecao(doc, `${solicitacoes.length} solicitação(ões)`, campos, y);
    escreverRodapes(doc);
    doc.save(nomeArquivo('relatorio-resumido', `historico-${new Date().toISOString().slice(0, 10)}`));
  }

  window.RelatoriosPdf = {
    baixarComprovante(dados) {
      return gerarDocumento('Comprovante de solicitação', dados);
    },
    baixarIndividual(detalhes) {
      return gerarDocumento('Relatório individual da solicitação', detalhes);
    },
    baixarResumo(solicitacoes, filtros) {
      return gerarResumo(solicitacoes, filtros);
    }
  };
})();
