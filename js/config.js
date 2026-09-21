/* Configuração pública: substitua apenas a URL pelo Web App implantado. */
window.APP_CONFIG = {
  apiUrl: 'https://script.google.com/macros/s/AKfycbwH_94kvA7DDv9alK4qs-JF_cnDdU7ib-BUP3WxvVNXmQ3qcjntjrDywnrneN8bMhjX/exec',
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
