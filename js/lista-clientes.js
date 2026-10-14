/* Listagem de clientes: tabela com filtros e acesso ao detalhe de cada cadastro. */
(function () {
  AppAuth.configurarCabecalho();
  if (!AppAuth.exigirGrupos(['IST_Colaborators', 'Administrator_User'])) return;

  const ROTULOS_TIPO = { FISICA: 'Pessoa física', JURIDICA: 'Pessoa jurídica' };

  const corpo = document.querySelector('#clientes-body');
  const status = document.querySelector('#clientes-status');
  const vazio = document.querySelector('#clientes-empty');
  const busca = document.querySelector('#clientes-busca');
  const tipo = document.querySelector('#clientes-tipo');
  const situacao = document.querySelector('#clientes-situacao');
  const atualizar = document.querySelector('#clientes-refresh');

  let clientes = [];

  function escapar(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, (caractere) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[caractere]));
  }

  function mostrarStatus(mensagem, tipoStatus = 'success') {
    status.textContent = mensagem;
    status.className = `status show ${tipoStatus}`;
  }

  function formatarData(valor) {
    if (!valor) return '—';
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleDateString('pt-BR');
  }

  function nomeCadastro(cliente) {
    if (cliente.tipoPessoa === 'FISICA') return cliente.nome;
    return cliente.razaoSocial || cliente.nomeFantasia || cliente.nome;
  }

  function pillSituacao(situacao) {
    const pendente = situacao === 'PENDENTE';
    return `<span class="clientes-situacao${pendente ? ' clientes-situacao--pendente' : ''}">${pendente ? 'Pendente' : 'Concluído'}</span>`;
  }

  function filtrados() {
    const texto = busca.value.trim().toLowerCase();
    const pessoa = tipo.value;
    const estado = situacao.value;
    return clientes.filter((cliente) => {
      if (pessoa && cliente.tipoPessoa !== pessoa) return false;
      if (estado && cliente.situacao !== estado) return false;
      if (!texto) return true;
      const campos = `${cliente.nome} ${cliente.usuarioEmail} ${nomeCadastro(cliente)} ${cliente.cpfCnpj}`;
      return campos.toLowerCase().includes(texto);
    });
  }

  function renderizar() {
    const itens = filtrados();
    vazio.hidden = itens.length > 0;
    corpo.innerHTML = itens.map((cliente) => `
      <tr>
        <td data-label="Cliente"><strong>${escapar(cliente.nome)}</strong><br><small>${escapar(cliente.usuarioEmail)}</small></td>
        <td data-label="Razão social">${escapar(nomeCadastro(cliente))}</td>
        <td data-label="Tipo">${escapar(ROTULOS_TIPO[cliente.tipoPessoa] || cliente.tipoPessoa || '—')}</td>
        <td data-label="CPF/CNPJ">${escapar(cliente.cpfCnpj || '—')}</td>
        <td data-label="Telefone">${escapar(cliente.telefone || '—')}</td>
        <td data-label="Cidade/UF">${escapar(cliente.cidade ? `${cliente.cidade}${cliente.estado ? ' / ' + cliente.estado : ''}` : '—')}</td>
        <td data-label="Cadastro">${escapar(formatarData(cliente.dataCadastro))}</td>
        <td data-label="Situação">${pillSituacao(cliente.situacao)}</td>
        <td data-label="Ação">
          <div class="clientes-actions">
            <a class="button primary" href="detalhe-cliente.html?email=${encodeURIComponent(cliente.usuarioEmail)}">Detalhes</a>
          </div>
        </td>
      </tr>
    `).join('');
  }

  async function carregar() {
    atualizar.disabled = true;
    mostrarStatus('Carregando clientes…', 'loading');
    try {
      const resultado = await AppAuth.requisitarApi('listarClientes');
      clientes = resultado.dados.clientes || [];
      renderizar();
      mostrarStatus(`${clientes.length} cliente(s) carregado(s).`);
    } catch (erro) {
      mostrarStatus(erro.message, 'error');
    } finally {
      atualizar.disabled = false;
    }
  }

  busca.addEventListener('input', renderizar);
  tipo.addEventListener('change', renderizar);
  situacao.addEventListener('change', renderizar);
  atualizar.addEventListener('click', carregar);

  carregar();
})();
