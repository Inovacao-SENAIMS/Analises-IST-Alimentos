/* Configuração pública: substitua apenas a URL pelo Web App implantado. */
window.APP_CONFIG = {
  apiUrl: 'COLE_AQUI_A_URL_DO_WEB_APP',
  sessionStorageKey: 'ist_alimentos_sessao',
  sessionHours: 8,
  formularios: [
    {
      id: 'analise-sementes',
      titulo: 'Solicitação de Análise de Sementes',
      descricao: 'Solicitação de ensaios de análise de sementes para Controle de Qualidade ou emissão de BAS',
      icone: '🌱',
      caminho: 'formulario-analise-sementes.html'
    }
  ],
  opcoesPadrao: {
    peneiras: ['Não se aplica', 'Peneira 1', 'Peneira 2', 'Peneira 3'],
    categorias: ['Semente genética', 'Semente básica', 'Semente certificada', 'Semente não certificada']
  }
};
