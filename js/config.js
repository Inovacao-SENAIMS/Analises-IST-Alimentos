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
    },
    {
      id: 'analise-microbiologica',
      titulo: 'Solicitação de Análise Microbiológica',
      descricao: 'Solicitação de ensaios microbiológicos para água, gelo, alimentos e bebidas',
      icone: '🧫',
      caminho: 'formulario-analise-microbiologica.html'
    }
  ],
  ensaiosMicrobiologicos: {
    aguaGelo: [
      { codigo: 'M04', nome: 'Contagem Total de Clostridium perfringens incluindo esporos a 44±1°C' },
      { codigo: 'M08', nome: 'Contagem de Coliformes Totais - Método de Filtração em Membrana' },
      { codigo: 'M09', nome: 'Contagem de Enterococos spp. - Método de Filtração em Membrana' },
      { codigo: 'M10', nome: 'Detecção e Contagem de Escherichia coli - Método de Filtração em Membrana' },
      { codigo: 'M13', nome: 'Contagem Padrão de Microrganismos Mesófilos Aeróbios Viáveis a 36°C' },
      { codigo: 'M13A', nome: 'Contagem Padrão de Microrganismos Mesófilos Aeróbios Viáveis a 22°C' },
      { codigo: 'M13B', nome: 'Contagem Padrão de Microrganismos Heterotróficos Aeróbios Viáveis' },
      { codigo: 'M26A', nome: 'Pesquisa de Salmonella spp.' },
      { codigo: 'M53', nome: 'Pesquisa de Pseudomonas aeruginosa' }
    ],
    alimentosBebidas: [
      { codigo: 'M01', nome: 'Contagem Presuntiva de Bacillus cereus' },
      { codigo: 'M02', nome: 'Contagem Total de Bolores e Leveduras' },
      { codigo: 'M03', nome: 'Contagem Total de Clostridium perfringens' },
      { codigo: 'M06', nome: 'Contagem Total de Coliformes Termotolerantes' },
      { codigo: 'M07', nome: 'Contagem de Coliformes totais' },
      { codigo: 'M11', nome: 'Contagem de Microrganismos Mesófilos Aeróbios Viáveis a 30°C' },
      { codigo: 'M12', nome: 'Contagem de Staphylococcus aureus' },
      { codigo: 'M12A', nome: 'Contagem de Staphylococcus coagulase positiva' },
      { codigo: 'M14', nome: 'Contagem Total de Enterobacteriaceas' },
      { codigo: 'M15', nome: 'NMP de Coliformes Termotolerantes' },
      { codigo: 'M16', nome: 'NMP de Coliformes Totais' },
      { codigo: 'M26', nome: 'Pesquisa de Listeria monocytogenes' },
      { codigo: 'M26A', nome: 'Pesquisa de Salmonella spp.' },
      { codigo: 'M29', nome: 'Pré-incubação a 55°C±1°C - Teste de Esterilidade Comercial' },
      { codigo: 'M30', nome: 'Pré-incubação a 36°C±1°C - Teste de Esterilidade Comercial' },
      { codigo: 'M32', nome: 'Contagem Total de Escherichia coli' },
      { codigo: 'M34', nome: 'Contagem total de Bactérias Acidófilas específicas' },
      { codigo: '', nome: 'Detecção de Salmonella typhimurium e Salmonella enteritidis' },
      { codigo: '', nome: 'Detecção de Enterotoxina Estafilocócica' }
    ]
  },
  opcoesPadrao: {
    peneiras: ['Não se aplica', 'Peneira 1', 'Peneira 2', 'Peneira 3'],
    categorias: ['Semente genética', 'Semente básica', 'Semente certificada', 'Semente não certificada']
  }
};
