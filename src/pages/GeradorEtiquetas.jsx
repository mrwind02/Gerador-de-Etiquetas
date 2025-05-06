import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { collection, getDocs, query, orderBy, addDoc, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore'
import { jsPDF } from 'jspdf'
import { v4 as uuidv4 } from 'uuid'
import {
  ArrowDownTrayIcon,
  DocumentTextIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'

export default function GeradorEtiquetas({ db }) {
  const location = useLocation()
  const [produtos, setProdutos] = useState([])
  const [clientes, setClientes] = useState([])
  const [modelos, setModelos] = useState([])
  const [selectedProdutos, setSelectedProdutos] = useState([])
  const [selectedCliente, setSelectedCliente] = useState(null)
  const [etiquetasGeradas, setEtiquetasGeradas] = useState([])
  const [showPreview, setShowPreview] = useState(false)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [configuracoes, setConfiguracoes] = useState({
    largura: 95,
    altura: 40,
    margemSuperior: 1,
    margemInferior: 2,
    margemEsquerda: 1,
    margemDireita: 2,
    quantidadePorPagina: 12,
    tamanhoFonte: 12
  })
  const [incluirData, setIncluirData] = useState(false)
  const [incluirCodigoBarras, setIncluirCodigoBarras] = useState(false)
  const [incluirNumeroSerie, setIncluirNumeroSerie] = useState(false)
  const [incluirCliente, setIncluirCliente] = useState(true)
  const [incluirOrdemEntrega, setIncluirOrdemEntrega] = useState(false) // Estado para incluir ordem de entrega
  const [ordemEntregaTexto, setOrdemEntregaTexto] = useState(''); // Estado para o texto de ordem de entrega
  const [successMessage, setSuccessMessage] = useState('')
  const [skuInput, setSkuInput] = useState('')
  const [codigoClienteInput, setCodigoClienteInput] = useState('')
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1) // Estado para a página atual
  const etiquetasPorPagina = 12 // Número de etiquetas por página

  const [tiposProdutos, setTiposProdutos] = useState([]);
  const [novoTipoProduto, setNovoTipoProduto] = useState('');
  const [novaQuantidade, setNovaQuantidade] = useState(1);
  const [quantidadeProdutos, setQuantidadeProdutos] = useState(1); // Estado para quantidade de produtos
  const [formMode, setFormMode] = useState('add'); // Estado para controlar o modo do formulário

  const [logomarca, setLogomarca] = useState(null); // Estado para armazenar a logomarca
  const [intensidadeMarcaDagua, setIntensidadeMarcaDagua] = useState(0.1); // Estado para intensidade da marca d'água

  const previewRef = useRef(null)

  const handleLogomarcaUpload = async (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'image/png') {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Logomarca = reader.result; // Armazena a logomarca como base64
        setLogomarca(base64Logomarca);

        try {
          // Salvar a logomarca no banco de dados
          const logomarcaDocRef = doc(db, 'configuracoes', 'logomarca');
          await setDoc(logomarcaDocRef, { logomarca: base64Logomarca });
          alert('Logomarca salva com sucesso!');
        } catch (error) {
          console.error('Erro ao salvar a logomarca:', error);
          alert('Erro ao salvar a logomarca.');
        }
      };
      reader.readAsDataURL(file);
    } else {
      alert('Por favor, envie um arquivo PNG.');
    }
  };

  // Abrir modal para editar tipo de produto
  const handleEditTipoProduto = (tipo) => {
    setNovoTipoProduto(tipo.nome);
    setNovaQuantidade(tipo.quantidade);
    setFormMode('edit'); // Alterar para modo de edição
  };

  // Adicionar tipo de produto no Firebase
  const handleAddTipoProduto = async (e) => {
    e.preventDefault();
    if (novoTipoProduto.trim() === '') {
      alert('Digite um tipo de produto.');
      return;
    }

    // Verificar se o tipo de produto já existe (case-insensitive)
    const tipoProdutoExistente = tiposProdutos.find(
      (tipo) => tipo.nome.toLowerCase() === novoTipoProduto.trim().toLowerCase()
    );

    if (tipoProdutoExistente) {
      alert('Este tipo de produto já foi adicionado.');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'tiposProdutos'), {
        nome: novoTipoProduto.trim(),
        quantidade: novaQuantidade,
      });

      // Atualizar a lista local de tipos de produtos
      setTiposProdutos([
        ...tiposProdutos,
        { id: docRef.id, nome: novoTipoProduto.trim(), quantidade: novaQuantidade },
      ]);

      // Limpar os campos do formulário
      setNovoTipoProduto('');
      setNovaQuantidade(1);
    } catch (error) {
      console.error('Erro ao adicionar tipo de produto:', error);
    }
  };

  // Atualizar tipo de produto no Firebase
  const handleUpdateTipoProduto = async (e) => {
    e.preventDefault();
    if (novoTipoProduto.trim() === '') {
      alert('Digite um tipo de produto.');
      return;
    }

    const tipoProdutoExistente = tiposProdutos.find(
      (tipo) => tipo.nome.toLowerCase() === novoTipoProduto.trim().toLowerCase()
    );

    if (!tipoProdutoExistente) {
      alert('Tipo de produto não encontrado para edição.');
      return;
    }

    try {
      const tipoProdutoRef = doc(db, 'tiposProdutos', tipoProdutoExistente.id);
      await setDoc(tipoProdutoRef, {
        nome: novoTipoProduto.trim(),
        quantidade: novaQuantidade,
      });

      // Atualizar a lista local de tipos de produtos
      setTiposProdutos((prev) =>
        prev.map((tipo) =>
          tipo.id === tipoProdutoExistente.id
            ? { ...tipo, nome: novoTipoProduto.trim(), quantidade: novaQuantidade }
            : tipo
        )
      );

      // Limpar os campos do formulário e redefinir o modo
      setNovoTipoProduto('');
      setNovaQuantidade(1);
      setFormMode('add'); // Voltar para o modo de adição
    } catch (error) {
      console.error('Erro ao atualizar tipo de produto:', error);
    }
  };

  // Remover tipo de produto do Firebase
  const handleRemoveTipoProduto = async (nome) => {
    const tipoProduto = tiposProdutos.find((tipo) => tipo.nome === nome);
    if (!tipoProduto) return;

    try {
      await deleteDoc(doc(db, 'tiposProdutos', tipoProduto.id));
      setTiposProdutos(tiposProdutos.filter((tipo) => tipo.nome !== nome));
    } catch (error) {
      console.error('Erro ao remover tipo de produto:', error);
    }
  };

  // Carregar logomarca do banco de dados ao iniciar
  useEffect(() => {
    const fetchLogomarca = async () => {
      try {
        const logomarcaDocRef = doc(db, 'configuracoes', 'logomarca');
        const logomarcaDoc = await getDoc(logomarcaDocRef);
        if (logomarcaDoc.exists()) {
          setLogomarca(logomarcaDoc.data().logomarca);
        }
      } catch (error) {
        console.error('Erro ao carregar a logomarca:', error);
      }
    };

    fetchLogomarca();
  }, [db]);

  // Carregar dados do Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Carregar produtos
        const produtosRef = collection(db, 'produtos')
        const produtosQuery = query(produtosRef, orderBy('nome'))
        const produtosSnapshot = await getDocs(produtosQuery)
        const produtosList = produtosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setProdutos(produtosList)

        // Carregar clientes
        const clientesRef = collection(db, 'clientes')
        const clientesQuery = query(clientesRef, orderBy('nome'))
        const clientesSnapshot = await getDocs(clientesQuery)
        const clientesList = clientesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setClientes(clientesList)

        // Carregar modelos
        const modelosRef = collection(db, 'modelos')
        const modelosQuery = query(modelosRef, orderBy('nome'))
        const modelosSnapshot = await getDocs(modelosQuery)
        const modelosList = modelosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setModelos(modelosList)
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      }
    }

    fetchData()
  }, [db])

  // Atualizar a lista de produtos após adicionar ou importar novos produtos
  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const produtosRef = collection(db, 'produtos');
        const produtosQuery = query(produtosRef, orderBy('nome'));
        const produtosSnapshot = await getDocs(produtosQuery);
        const produtosList = produtosSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setProdutos(produtosList);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
      }
    };

    fetchProdutos();
  }, [db]);

  // Carregar tipos de produtos do Firebase
  useEffect(() => {
    const fetchTiposProdutos = async () => {
      try {
        const tiposProdutosRef = collection(db, 'tiposProdutos');
        const tiposProdutosSnapshot = await getDocs(query(tiposProdutosRef, orderBy('nome')));
        const tiposProdutosList = tiposProdutosSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTiposProdutos(tiposProdutosList);
      } catch (error) {
        console.error('Erro ao carregar tipos de produtos:', error);
      }
    };

    fetchTiposProdutos();
  }, [db]);

  // Verificar se há um modelo selecionado na navegação
  useEffect(() => {
    if (location.state?.modelo) {
      setConfiguracoes(location.state.modelo.configuracoes)
    }
  }, [location.state])

  useEffect(() => {
    if (codigoClienteInput) {
      const cliente = clientes.find(c => c.codigo?.toString() === codigoClienteInput)
      if (cliente) {
        setSelectedCliente(cliente)
      }
    }
  }, [codigoClienteInput, clientes])

  useEffect(() => {
    if (etiquetasGeradas.length > 0) {
      const etiquetasPorPagina = Math.floor((configuracoes.quantidadePorPagina))
      const totalPages = Math.ceil(etiquetasGeradas.length / etiquetasPorPagina)
      setNumPages(totalPages)
    }
  }, [etiquetasGeradas, configuracoes.quantidadePorPagina])

  // Selecionar cliente
  const handleClienteChange = (e) => {
    const clienteId = e.target.value
    if (clienteId === '') {
      setSelectedCliente(null)
    } else {
      const cliente = clientes.find(c => c.id === clienteId)
      setSelectedCliente(cliente)
    }
  }

  // Selecionar modelo
  const handleModeloChange = (e) => {
    const modeloId = e.target.value
    if (modeloId === '') return
    
    const modelo = modelos.find(m => m.id === modeloId)
    if (modelo && modelo.configuracoes) {
      setConfiguracoes(modelo.configuracoes)
    }
  }

  // Atualizar configurações
  const handleConfigChange = (e) => {
    const { name, value } = e.target
    setConfiguracoes(prev => ({
      ...prev,
      [name]: Number(value)
    }))
  }

  const handleIntensidadeChange = (e) => {
    setIntensidadeMarcaDagua(Number(e.target.value));
  };

  // Adicionar produto por SKU
  const handleAddProduto = (e) => {
    e.preventDefault();
    const skuNormalizado = Number(skuInput.trim()); // Converter o SKU para número
    const produto = produtos.find((p) => {
      const skuProduto = typeof p.sku === 'number' ? p.sku : null; // Garantir que o SKU seja um número
      return skuProduto === skuNormalizado;
    });

    if (produto) {
      const produtoExistente = selectedProdutos.find((p) => p.id === produto.id);
      if (produtoExistente) {
        // Somar a quantidade ao produto já existente
        setSelectedProdutos((prev) =>
          prev.map((p) =>
            p.id === produto.id
              ? { ...p, quantidade: (p.quantidade || 1) + quantidadeProdutos }
              : p
          )
        );
      } else {
        // Adicionar novo produto com a quantidade informada
        setSelectedProdutos([...selectedProdutos, { ...produto, quantidade: quantidadeProdutos }]);
      }
      setSkuInput('');
      setQuantidadeProdutos(1); // Resetar a quantidade para o próximo produto
    } else {
      alert('Produto não encontrado. Certifique-se de que o SKU está correto.');
    }
  };

  // Remover produto da lista
  const handleRemoveProduto = (produtoId) => {
    setSelectedProdutos(selectedProdutos.filter(p => p.id !== produtoId))
  }

  // Gerar etiquetas com base nos tipos de produtos e palavras-chave
  const gerarEtiquetas = () => {
    if (selectedProdutos.length === 0) {
      alert('Selecione pelo menos um produto para gerar etiquetas.');
      return;
    }
  
    if (incluirCliente && !selectedCliente) {
      alert('Selecione um cliente ou desmarque a opção "Incluir cliente".');
      return;
    }
  
    const etiquetas = [];
    let totalEtiquetas = 0; // Variável para somar o total de etiquetas geradas
  
    selectedProdutos.forEach((produto) => {
      const nomeProduto = produto.nome.toLowerCase();
      const palavrasProduto = nomeProduto.split(' ').slice(0, 2); // Considerar as duas primeiras palavras do produto
  
      // Buscar o tipo de produto na tabela com base nas duas primeiras palavras
      let tipoProduto = tiposProdutos.find((tipo) => {
        const palavrasChave = tipo.nome.toLowerCase().split(' ').slice(0, 2); // Duas primeiras palavras do tipo
        return palavrasChave.length === palavrasProduto.length && palavrasChave.every((palavra, index) => palavra === palavrasProduto[index]); // Verificar correspondência exata das duas palavras
      });
  
      // Caso não encontre com as duas palavras, buscar com a primeira palavra
      if (!tipoProduto) {
        tipoProduto = tiposProdutos.find((tipo) => {
          const primeiraPalavra = tipo.nome.toLowerCase().split(' ')[0]; // Primeira palavra do tipo
          return palavrasProduto[0] === primeiraPalavra; // Verificar correspondência exata da primeira palavra
        });
      }
  
      if (!tipoProduto) {
        console.warn(`Tipo de produto não encontrado para o produto: ${produto.nome}`);
      }
  
      // Determinar a quantidade de etiquetas por unidade do produto
      const etiquetasPorUnidade = tipoProduto ? tipoProduto.quantidade : 1;
  
      // Determinar a quantidade total de etiquetas para este produto
      const quantidadeInformada = produto.quantidade || 1; // Usar quantidade fixa do produto
      const quantidadeTotalEtiquetas = etiquetasPorUnidade * quantidadeInformada;
  
      // Adicionar etiquetas para este produto
      for (let i = 0; i < quantidadeTotalEtiquetas; i++) {
        etiquetas.push({
          id: uuidv4(),
          produto: { ...produto }, // Garantir que a quantidade do produto não seja alterada
          cliente: incluirCliente
            ? {
                ...selectedCliente,
                cidade: selectedCliente.cidade || 'Cidade não informada', // Garantir que a cidade esteja presente
                uf: selectedCliente.uf || 'UF', // Alterar estado para uf
              }
            : null,
          data: incluirData ? new Date().toLocaleDateString('pt-BR') : null,
          numeroSerie: incluirNumeroSerie ? `${produto.sku}-${String(i + 1).padStart(3, '0')}` : null,
          ordemEntrega: i + 1, // Adicionar número de ordem de entrega
          tamanhoFonteNomeProduto: configuracoes.largura > 100 ? 28 : configuracoes.tamanhoFonte, // Fonte grande para etiquetas maiores
        });
      }
  
      // Somar ao total de etiquetas geradas
      totalEtiquetas += quantidadeTotalEtiquetas;
    });
  
    console.log(`Total de etiquetas geradas: ${totalEtiquetas}`); // Log do total de etiquetas geradas
    setEtiquetasGeradas(etiquetas);
    setNumPages(Math.ceil(etiquetas.length / configuracoes.quantidadePorPagina));
    setShowPreview(true);
  };

  // Função para exportar etiquetas como PDF
  const exportarEtiquetasPDF = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  
    const {
      margemDireita,
      margemInferior,
      largura,
      altura
    } = configuracoes;
  
    const margemEsquerda = 4; // Alterado para 4mm
    const margemSuperior = 5; // Margem superior fixa
    const margemEntreEtiquetas = 3; // Alterado para 3mm
  
    const etiquetasPorLinha = 2; // Duas colunas
    const etiquetasPorColuna = 6; // Seis etiquetas por coluna
    const etiquetasPorPagina = etiquetasPorLinha * etiquetasPorColuna;
  
    etiquetasGeradas.forEach((etiqueta, index) => {
      const posicaoNaPagina = index % etiquetasPorPagina;
  
      if (posicaoNaPagina === 0 && index !== 0) {
        doc.addPage();
      }
  
      const linha = Math.floor(posicaoNaPagina / etiquetasPorLinha); // Alterado para preencher linha por linha
      const coluna = posicaoNaPagina % etiquetasPorLinha;
  
      const x = margemEsquerda + coluna * (largura + margemEntreEtiquetas);
      const y = margemSuperior + linha * (altura + margemEntreEtiquetas);
  
      // Adicionar campo de ordem de entrega no canto superior direito, se habilitado
      if (incluirOrdemEntrega) {
        const campoOrdemX = x + largura - 18; // Posicionar a 4mm da margem direita
        const campoOrdemY = y + 2; // Respeitar 2mm de margem superior
        const campoOrdemTamanho = 14; // 1.4cm = 14mm

        // Removida a borda do quadrado

        // Adicionar número de ordem de entrega centralizado no quadrado
        doc.setFont('helvetica', 'bold'); // Fonte em negrito
        const fontSize = 26; // Alterar tamanho da fonte para 26
        doc.setFontSize(fontSize);

        const textoOrdem = String(ordemEntregaTexto || etiqueta.ordemEntrega || '');
        const textX = campoOrdemX + campoOrdemTamanho / 2; // Centralizar horizontalmente
        const textY = campoOrdemY + campoOrdemTamanho / 2 + fontSize * 0.35 / 2; // Centralizar verticalmente

        doc.text(textoOrdem, textX, textY, { align: 'center' });

        // Adicionar texto "ORDEM DE ENTREGA" ao lado esquerdo do quadrado
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        const textoX = campoOrdemX - 12; // Posicionar ao lado esquerdo do quadrado
        doc.text('ORDEM DE', textoX, campoOrdemY + 7); // Linha superior (ajustada para uma linha abaixo)
        doc.text('ENTREGA', textoX, campoOrdemY + 11); // Linha inferior (ajustada para uma linha abaixo)
      }

      // Adicionar texto "www.moveisamazonia.com.br" no canto superior direito, uma linha abaixo
      const textoSiteX = x + largura - 2; // Margem mínima de 2mm do lado direito
      const textoSiteY = y + 4; // Uma linha abaixo (2mm adicional)
      doc.setFont('helvetica', 'normal'); // Fonte normal
      doc.setFontSize(6); // Fonte ajustada para tamanho 6
      doc.text('www.moveisamazonia.com.br', textoSiteX, textoSiteY, { align: 'right' }); // Alinhar à direita

      // Adicionar texto "MÓVEIS AMAZÔNIA LTDA" no canto superior esquerdo
      const textoEmpresaX = x + 2; // Respeitar 4mm de margem esquerda - 2mm
      const textoEmpresaY = y + 6; // Respeitar 4mm de margem superior + 2mm adicionais
      doc.setFont('helvetica', 'bold'); // Fonte em negrito
      doc.setFontSize(13); // Tamanho da fonte ajustado para 13
      doc.text('MÓVEIS AMAZÔNIA LTDA', textoEmpresaX, textoEmpresaY, { align: 'left' }); // Alinhar à esquerda

      // Adicionar texto "CNPJ: 15.692.362/0001-68 Inscrição Estadual: 13.457.068-5" com espaçamento de 1mm
      const textoCnpjX = textoEmpresaX;
      const textoCnpjY = textoEmpresaY + 3; // Espaçamento de 1mm
      doc.setFontSize(6); // Fonte ajustada para 6
      doc.setFont('helvetica', 'normal'); // Fonte normal
      doc.text('CNPJ: 15.692.362/0001-68 Inscrição Estadual: 13.457.068-5', textoCnpjX, textoCnpjY, { align: 'left' });

      // Adicionar texto "ALTA FLORESTA - MT" com espaçamento de 1mm
      const textoLocalX = textoCnpjX;
      const textoLocalY = textoCnpjY + 3; // Espaçamento de 1mm
      doc.setFontSize(7); // Fonte ajustada para 7
      doc.setFont('helvetica', 'normal'); // Fonte normal
      doc.text('ALTA FLORESTA - MT', textoLocalX, textoLocalY, { align: 'left' });

      // Adicionar logomarca como marca d'água com opacidade ajustada
      if (logomarca) {
        const larguraMarcaDagua = largura * 0.8; // Ajustar tamanho da logomarca
        const alturaMarcaDagua = altura * 0.8;
        const posXMarcaDagua = x + (largura - larguraMarcaDagua) / 2;
        const posYMarcaDagua = y + (altura - alturaMarcaDagua) / 2;
  
        // Salvar o estado gráfico atual
        doc.saveGraphicsState();
  
        // Ajustar a opacidade para a marca d'água
        doc.setGState(new doc.GState({ opacity: intensidadeMarcaDagua }));
  
        // Adicionar a imagem da logomarca
        doc.addImage(logomarca, 'PNG', posXMarcaDagua, posYMarcaDagua, larguraMarcaDagua, alturaMarcaDagua, '', 'NONE');
  
        // Restaurar o estado gráfico original
        doc.restoreGraphicsState();
      }
  
      // Desenhar o contorno da etiqueta com largura da borda aumentada em 100%
      doc.setLineWidth(0.4); // Largura da borda dobrada (originalmente 0.2)
      doc.rect(x, y, largura, altura);

      // Adicionar Nome do Produto com fonte ajustada para etiquetas grandes
      doc.setFontSize(etiqueta.tamanhoFonteNomeProduto);
      doc.setFont('helvetica', 'bold');
      const nomeProduto = doc.splitTextToSize(etiqueta.produto.nome, largura - 4);
      doc.text(nomeProduto, x + 2, y + altura - 20);
  
      // Adicionar Cliente
      if (incluirCliente && etiqueta.cliente) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Cliente: ${etiqueta.cliente.nome}`, x + 2, y + altura - 10);
      }
  
      // Adicionar Cidade e UF e Número de Série na mesma linha
      if (incluirCliente && etiqueta.cliente && etiqueta.cliente.cidade && etiqueta.cliente.uf) {
        doc.setFontSize(8);
        doc.text(
          `${etiqueta.cliente.cidade} - ${etiqueta.cliente.uf}`,
          x + 2,
          y + altura - 5
        );
      }
      if (incluirNumeroSerie && etiqueta.numeroSerie) {
        doc.text(
          `N° Série: ${etiqueta.numeroSerie}`,
          x + largura - 2,
          y + altura - 5,
          { align: 'right' }
        );
      }
    });
  
    doc.save("etiquetas.pdf");
  };
  

  // Função para imprimir etiquetas
  const imprimirEtiquetas = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    const {
      margemDireita,
      margemInferior,
      largura,
      altura
    } = configuracoes;

    const margemEsquerda = 4; // Alterado para 4mm
    const margemSuperior = 5; // Margem superior fixa
    const margemEntreEtiquetas = 3; // Alterado para 3mm

    const etiquetasPorLinha = 2; // Duas colunas
    const etiquetasPorColuna = 6; // Seis etiquetas por coluna
    const etiquetasPorPagina = etiquetasPorLinha * etiquetasPorColuna;

    etiquetasGeradas.forEach((etiqueta, index) => {
      const posicaoNaPagina = index % etiquetasPorPagina;

      if (posicaoNaPagina === 0 && index !== 0) {
        doc.addPage();
      }

      const linha = Math.floor(posicaoNaPagina / etiquetasPorLinha); // Alterado para preencher linha por linha
      const coluna = posicaoNaPagina % etiquetasPorLinha;

      const x = margemEsquerda + coluna * (largura + margemEntreEtiquetas);
      const y = margemSuperior + linha * (altura + margemEntreEtiquetas);

      // Adicionar campo de ordem de entrega no canto superior direito, se habilitado
      if (incluirOrdemEntrega) {
        const campoOrdemX = x + largura - 18; // Posicionar a 4mm da margem direita
        const campoOrdemY = y + 2; // Respeitar 2mm de margem superior
        const campoOrdemTamanho = 14; // 1.4cm = 14mm

        // Removida a borda do quadrado

        // Adicionar número de ordem de entrega centralizado no quadrado
        doc.setFont('helvetica', 'bold'); // Fonte em negrito
        const fontSize = 26; // Alterar tamanho da fonte para 26
        doc.setFontSize(fontSize);

        const textoOrdem = String(ordemEntregaTexto || etiqueta.ordemEntrega || '');
        const textX = campoOrdemX + campoOrdemTamanho / 2; // Centralizar horizontalmente
        const textY = campoOrdemY + campoOrdemTamanho / 2 + fontSize * 0.35 / 2; // Centralizar verticalmente

        doc.text(textoOrdem, textX, textY, { align: 'center' });

        // Adicionar texto "ORDEM DE ENTREGA" ao lado esquerdo do quadrado
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        const textoX = campoOrdemX - 12; // Posicionar ao lado esquerdo do quadrado
        doc.text('ORDEM DE', textoX, campoOrdemY + 7); // Linha superior (ajustada para uma linha abaixo)
        doc.text('ENTREGA', textoX, campoOrdemY + 11); // Linha inferior (ajustada para uma linha abaixo)
      }

      // Adicionar texto "www.moveisamazonia.com.br" no canto superior direito, uma linha abaixo
      const textoSiteX = x + largura - 2; // Margem mínima de 2mm do lado direito
      const textoSiteY = y + 4; // Uma linha abaixo (2mm adicional)
      doc.setFont('helvetica', 'normal'); // Fonte normal
      doc.setFontSize(6); // Fonte ajustada para tamanho 6
      doc.text('www.moveisamazonia.com.br', textoSiteX, textoSiteY, { align: 'right' }); // Alinhar à direita

      // Adicionar texto "MÓVEIS AMAZÔNIA LTDA" no canto superior esquerdo
      const textoEmpresaX = x + 2; // Respeitar 4mm de margem esquerda - 2mm
      const textoEmpresaY = y + 6; // Respeitar 4mm de margem superior + 2mm adicionais
      doc.setFont('helvetica', 'bold'); // Fonte em negrito
      doc.setFontSize(13); // Tamanho da fonte ajustado para 13
      doc.text('MÓVEIS AMAZÔNIA LTDA', textoEmpresaX, textoEmpresaY, { align: 'left' }); // Alinhar à esquerda

      // Adicionar texto "CNPJ: 15.692.362/0001-68 Inscrição Estadual: 13.457.068-5" com espaçamento de 1mm
      const textoCnpjX = textoEmpresaX;
      const textoCnpjY = textoEmpresaY + 3; // Espaçamento de 1mm
      doc.setFontSize(6); // Fonte ajustada para 6
      doc.setFont('helvetica', 'normal'); // Fonte normal
      doc.text('CNPJ: 15.692.362/0001-68 Inscrição Estadual: 13.457.068-5', textoCnpjX, textoCnpjY, { align: 'left' });

      // Adicionar texto "ALTA FLORESTA - MT" com espaçamento de 1mm
      const textoLocalX = textoCnpjX;
      const textoLocalY = textoCnpjY + 3; // Espaçamento de 1mm
      doc.setFontSize(7); // Fonte ajustada para 7
      doc.setFont('helvetica', 'normal'); // Fonte normal
      doc.text('ALTA FLORESTA - MT', textoLocalX, textoLocalY, { align: 'left' });

      // Adicionar logomarca como marca d'água com opacidade ajustada
      if (logomarca) {
        const larguraMarcaDagua = largura * 0.8; // Ajustar tamanho da logomarca
        const alturaMarcaDagua = altura * 0.8;
        const posXMarcaDagua = x + (largura - larguraMarcaDagua) / 2;
        const posYMarcaDagua = y + (altura - alturaMarcaDagua) / 2;

        // Salvar o estado gráfico atual
        doc.saveGraphicsState();

        // Ajustar a opacidade para a marca d'água
        doc.setGState(new doc.GState({ opacity: intensidadeMarcaDagua }));

        // Adicionar a imagem da logomarca
        doc.addImage(logomarca, 'PNG', posXMarcaDagua, posYMarcaDagua, larguraMarcaDagua, alturaMarcaDagua, '', 'NONE');

        // Restaurar o estado gráfico original
        doc.restoreGraphicsState();
      }

      // Desenhar o contorno da etiqueta com largura da borda aumentada em 100%
      doc.setLineWidth(0.4); // Largura da borda dobrada (originalmente 0.2)
      doc.rect(x, y, largura, altura);

      // Adicionar Nome do Produto com fonte ajustada para etiquetas grandes
      doc.setFontSize(etiqueta.tamanhoFonteNomeProduto);
      doc.setFont('helvetica', 'bold');
      const nomeProduto = doc.splitTextToSize(etiqueta.produto.nome, largura - 4);
      doc.text(nomeProduto, x + 2, y + altura - 20);

      // Adicionar Cliente
      if (incluirCliente && etiqueta.cliente) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Cliente: ${etiqueta.cliente.nome}`, x + 2, y + altura - 10);
      }

      // Adicionar Cidade e Estado e Número de Série na mesma linha
      if (incluirCliente && etiqueta.cliente && etiqueta.cliente.cidade && etiqueta.cliente.estado) {
        doc.setFontSize(8);
        doc.text(
          `${etiqueta.cliente.cidade} - ${etiqueta.cliente.estado}`,
          x + 2,
          y + altura - 5
        );
      }
      if (incluirNumeroSerie && etiqueta.numeroSerie) {
        doc.text(
          `N° Série: ${etiqueta.numeroSerie}`,
          x + largura - 2,
          y + altura - 5,
          { align: 'right' }
        );
      }
    });

    // Abrir o PDF no navegador para impressão
    window.open(doc.output('bloburl'), '_blank');
  };

  const totalPaginas = Math.ceil(etiquetasGeradas.length / etiquetasPorPagina);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPaginas) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="bg-white py-6">
      <div className="mx-auto max-w-7xl">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold leading-6 text-gray-900">Gerador de Etiquetas</h1>
              <p className="mt-2 text-sm text-gray-700">
                Crie etiquetas personalizadas para seus produtos e exporte-as em PDF.
              </p>
            </div>
            <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
              <button
                type="button"
                onClick={() => setIsConfigOpen(!isConfigOpen)}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <AdjustmentsHorizontalIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                Configurações
              </button>
            </div>
          </div>
          
          {/* Painel de configurações */}
          {isConfigOpen && (
            <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-base font-semibold leading-6 text-gray-900">Configurações da Etiqueta</h3>
              
              <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="modelo" className="block text-sm font-medium text-gray-700">
                    Modelo de Etiqueta
                  </label>
                  <select
                    id="modelo"
                    name="modelo"
                    onChange={handleModeloChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Selecione um modelo...</option>
                    {modelos.map(modelo => (
                      <option key={modelo.id} value={modelo.id}>{modelo.nome}</option>
                    ))}
                  </select>
                </div>
                
                <div className="sm:col-span-3"></div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="largura" className="block text-sm font-medium text-gray-700">
                    Largura (mm)
                  </label>
                  <input
                    type="number"
                    name="largura"
                    id="largura"
                    min="10"
                    value={configuracoes.largura}
                    onChange={handleConfigChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="altura" className="block text-sm font-medium text-gray-700">
                    Altura (mm)
                  </label>
                  <input
                    type="number"
                    name="altura"
                    id="altura"
                    min="10"
                    value={configuracoes.altura}
                    onChange={handleConfigChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="quantidadePorPagina" className="block text-sm font-medium text-gray-700">
                    Quantidade por Página
                  </label>
                  <input
                    type="number"
                    name="quantidadePorPagina"
                    id="quantidadePorPagina"
                    min="1"
                    value={configuracoes.quantidadePorPagina}
                    onChange={handleConfigChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="margemSuperior" className="block text-sm font-medium text-gray-700">
                    Margem Superior (mm)
                  </label>
                  <input
                    type="number"
                    name="margemSuperior"
                    id="margemSuperior"
                    min="0"
                    value={configuracoes.margemSuperior}
                    onChange={handleConfigChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="margemInferior" className="block text-sm font-medium text-gray-700">
                    Margem Inferior (mm)
                  </label>
                  <input
                    type="number"
                    name="margemInferior"
                    id="margemInferior"
                    min="0"
                    value={configuracoes.margemInferior}
                    onChange={handleConfigChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="margemEsquerda" className="block text-sm font-medium text-gray-700">
                    Margem Esquerda (mm)
                  </label>
                  <input
                    type="number"
                    name="margemEsquerda"
                    id="margemEsquerda"
                    min="0"
                    value={configuracoes.margemEsquerda}
                    onChange={handleConfigChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="margemDireita" className="block text-sm font-medium text-gray-700">
                    Margem Direita (mm)
                  </label>
                  <input
                    type="number"
                    name="margemDireita"
                    id="margemDireita"
                    min="0"
                    value={configuracoes.margemDireita}
                    onChange={handleConfigChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="tamanhoFonte" className="block text-sm font-medium text-gray-700">
                    Tamanho da Fonte (pt)
                  </label>
                  <input
                    type="number"
                    name="tamanhoFonte"
                    id="tamanhoFonte"
                    min="6"
                    max="24"
                    value={configuracoes.tamanhoFonte}
                    onChange={handleConfigChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="intensidadeMarcaDagua" className="block text-sm font-medium text-gray-700">
                    Intensidade da Marca d'Água
                  </label>
                  <input
                    type="range"
                    id="intensidadeMarcaDagua"
                    name="intensidadeMarcaDagua"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={intensidadeMarcaDagua}
                    onChange={handleIntensidadeChange}
                    className="mt-1 block w-full"
                  />
                  <span className="text-sm text-gray-500">Valor atual: {intensidadeMarcaDagua}</span>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="logomarca" className="block text-sm font-medium text-gray-700">
                    Logomarca (PNG)
                  </label>
                  <input
                    type="file"
                    id="logomarca"
                    accept="image/png"
                    onChange={handleLogomarcaUpload}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:border-gray-300 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                  />
                  {logomarca && (
                    <div className="mt-2">
                      <img src={logomarca} alt="Logomarca Preview" className="h-16" />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-900">Tipos de Produto e Quantidades</h4>
                <form onSubmit={formMode === 'edit' ? handleUpdateTipoProduto : handleAddTipoProduto} className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={novoTipoProduto}
                    onChange={(e) => setNovoTipoProduto(e.target.value)}
                    placeholder="Digite o tipo de produto"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <input
                    type="number"
                    value={novaQuantidade}
                    onChange={(e) => setNovaQuantidade(Number(e.target.value))}
                    min="1"
                    placeholder="Quantidade"
                    className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                  >
                    {formMode === 'edit' ? 'Atualizar' : 'Adicionar'}
                  </button>
                </form>
                <div className="mt-4">
                  {tiposProdutos.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Tipo de Produto
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Quantidade
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Ações</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {tiposProdutos.map((tipo) => (
                          <tr key={tipo.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tipo.nome}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tipo.quantidade}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => {
                                  handleEditTipoProduto(tipo);
                                  setFormMode('edit'); // Alterar para modo de edição
                                }}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleRemoveTipoProduto(tipo.nome)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Remover
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-sm text-gray-500">Nenhum tipo de produto cadastrado.</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Seleção de produtos */}
            <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Produtos</h3>
                <p className="mt-1 text-sm text-gray-500">Adicione produtos à lista temporária.</p>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={skuInput}
                      onChange={(e) => setSkuInput(e.target.value)}
                      placeholder="Digite o SKU do produto"
                      className="flex-grow rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      style={{ flexBasis: '75%' }} // Campo SKU com 75% do tamanho
                    />
                    <input
                      type="text"
                      value={quantidadeProdutos}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ''); // Remove caracteres não numéricos
                        setQuantidadeProdutos(value ? Number(value) : '');
                      }}
                      placeholder="Qtd."
                      className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      style={{ width: '20%' }}
                      inputMode="numeric" // Define o campo para aceitar apenas números
                      onKeyDown={(e) => {
                        if (['e', 'E', '-', '+', '.'].includes(e.key)) e.preventDefault(); // Previne entrada de caracteres inválidos
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddProduto}
                    className="inline-flex justify-center items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                  >
                    Adicionar
                  </button>
                </form>

                <div className="mt-4 space-y-2">
                  {selectedProdutos.map((produto) => (
                    <div key={produto.id} className="flex items-center justify-between p-2 border rounded-md">
                      <span className="text-sm">
                        {produto.nome} <span className="text-gray-500">({produto.sku})</span>
                      </span>
                      <button
                        onClick={() => handleRemoveProduto(produto.id)}
                        className="inline-flex items-center rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-red-500"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Opções de etiqueta */}
            <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Opções da Etiqueta</h3>
                <p className="mt-1 text-sm text-gray-500">Configure as informações que aparecerão na etiqueta</p>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="incluirCodigoBarras"
                      name="incluirCodigoBarras"
                      type="checkbox"
                      checked={incluirCodigoBarras}
                      onChange={(e) => setIncluirCodigoBarras(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="incluirCodigoBarras" className="ml-3 block text-sm font-medium text-gray-700">
                      Incluir código de barras
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="incluirData"
                      name="incluirData"
                      type="checkbox"
                      checked={incluirData}
                      onChange={(e) => setIncluirData(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="incluirData" className="ml-3 block text-sm font-medium text-gray-700">
                      Incluir data
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="incluirNumeroSerie"
                      name="incluirNumeroSerie"
                      type="checkbox"
                      checked={incluirNumeroSerie}
                      onChange={(e) => setIncluirNumeroSerie(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="incluirNumeroSerie" className="ml-3 block text-sm font-medium text-gray-700">
                      Incluir número de série
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="incluirCliente"
                      name="incluirCliente"
                      type="checkbox"
                      checked={incluirCliente}
                      onChange={(e) => setIncluirCliente(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="incluirCliente" className="ml-3 block text-sm font-medium text-gray-700">
                      Incluir cliente
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="incluirOrdemEntrega"
                      name="incluirOrdemEntrega"
                      type="checkbox"
                      checked={incluirOrdemEntrega}
                      onChange={(e) => setIncluirOrdemEntrega(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="incluirOrdemEntrega" className="ml-3 block text-sm font-medium text-gray-700">
                      Incluir ordem de entrega
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 01, 10A"
                      value={ordemEntregaTexto} // Usar o estado para o texto
                      onChange={(e) => setOrdemEntregaTexto(e.target.value.toUpperCase())} // Atualizar o estado
                      className="ml-3 block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  {incluirCliente && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="codigoCliente" className="block text-sm font-medium text-gray-700">
                          Código do Cliente
                        </label>
                        <input
                          type="text"
                          id="codigoCliente"
                          value={codigoClienteInput}
                          onChange={(e) => setCodigoClienteInput(e.target.value)}
                          placeholder="Digite o código do cliente"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="cliente" className="block text-sm font-medium text-gray-700">
                          Cliente Selecionado
                        </label>
                        <select
                          id="cliente"
                          name="cliente"
                          value={selectedCliente?.id || ''}
                          onChange={handleClienteChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="">Selecione um cliente...</option>
                          {clientes.map(cliente => (
                            <option key={cliente.id} value={cliente.id}>
                              {cliente.codigo && `[${cliente.codigo}] `}{cliente.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Ações */}
            <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Gerar Etiquetas</h3>
                <p className="mt-1 text-sm text-gray-500">Visualize, exporte ou imprima as etiquetas</p>
              </div>
              <div className="px-4 py-5 sm:p-6 flex flex-col items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={gerarEtiquetas}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 w-full justify-center"
                >
                  <DocumentTextIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                  Visualizar Etiquetas
                </button>
                <button
                  type="button"
                  onClick={exportarEtiquetasPDF}
                  className="inline-flex items-center rounded-md bg-green-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 w-full justify-center"
                >
                  <ArrowDownTrayIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                  Exportar Etiquetas em PDF
                </button>
                <button
                  type="button"
                  onClick={imprimirEtiquetas}
                  className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 w-full justify-center"
                >
                  <DocumentTextIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                  Imprimir Etiquetas
                </button>
              </div>
            </div>
          </div>
          
          {/* Visualização das etiquetas */}
          {showPreview && etiquetasGeradas.length > 0 && (
            <div className="mt-8">
              <div className="bg-white shadow rounded-lg border border-gray-200">
                <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-semibold leading-6 text-gray-900">Visualização das Etiquetas</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {etiquetasGeradas.length} etiquetas geradas em {totalPaginas}{' '}
                      {totalPaginas === 1 ? 'página' : 'páginas'}
                    </p>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-2 gap-6">
                    {etiquetasGeradas
                      .slice((currentPage - 1) * etiquetasPorPagina, currentPage * etiquetasPorPagina)
                      .map((etiqueta) => (
                        <div
                          key={etiqueta.id}
                          className="bg-white border border-gray-300 relative"
                          style={{
                            width: `${configuracoes.largura}mm`,
                            height: `${configuracoes.altura}mm`,
                            padding: '5mm',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            position: 'relative',
                          }}
                        >
                          {incluirCodigoBarras && (
                            <div className="mt-2">
                              <div
                                className="w-full h-8 flex items-end justify-center"
                                style={{ gap: '0.5mm' }}
                              >
                                {Array.from({ length: 30 }).map((_, i) => (
                                  <div
                                    key={i}
                                    className="bg-black"
                                    style={{
                                      width: '0.8mm',
                                      height: `${Math.floor(Math.random() * 6) + 2}mm`,
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          <div
                            style={{
                              position: 'absolute',
                              bottom: '2mm',
                              left: '2mm',
                              right: '2mm',
                              display: 'flex',
                              flexDirection: 'column',
                              fontSize: '10pt',
                              textAlign: 'left',
                            }}
                          >
                            <div className="font-bold">{etiqueta.produto.nome}</div>
                            {incluirCliente && etiqueta.cliente && (
                              <div>Cliente: {etiqueta.cliente.nome}</div>
                            )}
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '8pt',
                                marginTop: '2mm',
                              }}
                            >
                              {incluirCliente && etiqueta.cliente && etiqueta.cliente.cidade && etiqueta.cliente.uf && (
                                <div>
                                  {etiqueta.cliente.cidade} - {etiqueta.cliente.uf}
                                </div>
                              )}
                              {incluirNumeroSerie && etiqueta.numeroSerie && (
                                <div style={{ textAlign: 'right' }}>
                                  N° Série: {etiqueta.numeroSerie}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Botões de navegação */}
                  <div className="mt-4 flex justify-center items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        currentPage === 1 ? 'bg-gray-200 text-gray-400' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Anterior
                    </button>
                    {Array.from({ length: totalPaginas }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => handlePageChange(index + 1)}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                          currentPage === index + 1
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPaginas}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        currentPage === totalPaginas
                          ? 'bg-gray-200 text-gray-400'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Próximo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}