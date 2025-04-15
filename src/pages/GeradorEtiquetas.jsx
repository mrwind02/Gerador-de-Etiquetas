import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { jsPDF } from 'jspdf'
import { v4 as uuidv4 } from 'uuid'
import {
  ArrowDownTrayIcon,
  DocumentTextIcon,
  AdjustmentsHorizontalIcon,
  TagIcon,
  CheckCircleIcon
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
    largura: 90,
    altura: 40,
    margemSuperior: 5,
    margemInferior: 5,
    margemEsquerda: 5,
    margemDireita: 5,
    quantidadePorPagina: 10,
    tamanhoFonte: 10
  })
  const [quantidade, setQuantidade] = useState(1)
  const [incluirData, setIncluirData] = useState(true)
  const [incluirCodigoBarras, setIncluirCodigoBarras] = useState(true)
  const [incluirNumeroSerie, setIncluirNumeroSerie] = useState(true)
  const [incluirCliente, setIncluirCliente] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  
  const previewRef = useRef(null)

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

  // Verificar se há um modelo selecionado na navegação
  useEffect(() => {
    if (location.state?.modelo) {
      setConfiguracoes(location.state.modelo.configuracoes)
    }
  }, [location.state])

  // Selecionar/deselecionar produto
  const toggleProdutoSelection = (produto) => {
    if (selectedProdutos.some(p => p.id === produto.id)) {
      setSelectedProdutos(selectedProdutos.filter(p => p.id !== produto.id))
    } else {
      setSelectedProdutos([...selectedProdutos, produto])
    }
  }

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

  // Gerar etiquetas
  const gerarEtiquetas = () => {
    if (selectedProdutos.length === 0) {
      alert('Selecione pelo menos um produto para gerar etiquetas.')
      return
    }

    const etiquetas = []

    selectedProdutos.forEach(produto => {
      for (let i = 0; i < quantidade; i++) {
        etiquetas.push({
          id: uuidv4(),
          produto,
          cliente: incluirCliente ? selectedCliente : null,
          data: incluirData ? new Date().toLocaleDateString('pt-BR') : null,
          numeroSerie: incluirNumeroSerie ? `${produto.sku}-${String(i + 1).padStart(3, '0')}` : null
        })
      }
    })

    setEtiquetasGeradas(etiquetas)
    setShowPreview(true)
  }

  // Gerar PDF
  const gerarPDF = () => {
    if (etiquetasGeradas.length === 0) return

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = 210
    const pageHeight = 297
    
    // Calcular quantas etiquetas por linha e por coluna
    const etiquetasPorLinha = Math.floor((pageWidth - 20) / configuracoes.largura)
    const linhasPorPagina = Math.floor((pageHeight - 20) / configuracoes.altura)
    const etiquetasPorPagina = etiquetasPorLinha * linhasPorPagina
    
    // Posição inicial
    let x = 10
    let y = 10
    let etiquetasNaPagina = 0
    let paginaAtual = 1
    
    etiquetasGeradas.forEach((etiqueta, index) => {
      // Verificar se precisa criar uma nova página
      if (etiquetasNaPagina >= etiquetasPorPagina) {
        doc.addPage()
        paginaAtual++
        etiquetasNaPagina = 0
        x = 10
        y = 10
      }
      
      // Calcular posição da etiqueta na página
      const coluna = etiquetasNaPagina % etiquetasPorLinha
      const linha = Math.floor(etiquetasNaPagina / etiquetasPorLinha)
      
      x = 10 + (coluna * configuracoes.largura)
      y = 10 + (linha * configuracoes.altura)
      
      // Desenhar borda da etiqueta
      doc.setDrawColor(200, 200, 200)
      doc.rect(
        x, 
        y, 
        configuracoes.largura, 
        configuracoes.altura
      )
      
      // Definir margens internas
      const xInicio = x + configuracoes.margemEsquerda
      const yInicio = y + configuracoes.margemSuperior
      const larguraUtil = configuracoes.largura - configuracoes.margemEsquerda - configuracoes.margemDireita
      
      // Definir fonte
      doc.setFontSize(configuracoes.tamanhoFonte)
      
      // Nome do produto
      doc.setFont('helvetica', 'bold')
      doc.text(etiqueta.produto.nome, xInicio, yInicio + 5)
      
      // SKU
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(configuracoes.tamanhoFonte - 2)
      doc.text(`SKU: ${etiqueta.produto.sku}`, xInicio, yInicio + 10)
      
      // Cliente (se incluído)
      let yOffset = 15
      if (incluirCliente && etiqueta.cliente) {
        doc.text(`Cliente: ${etiqueta.cliente.nome}`, xInicio, yInicio + yOffset)
        yOffset += 5
      }
      
      // Data (se incluída)
      if (incluirData && etiqueta.data) {
        doc.text(`Data: ${etiqueta.data}`, xInicio, yInicio + yOffset)
        yOffset += 5
      }
      
      // Número de série (se incluído)
      if (incluirNumeroSerie && etiqueta.numeroSerie) {
        doc.text(`N° Série: ${etiqueta.numeroSerie}`, xInicio, yInicio + yOffset)
      }
      
      // Código de barras simulado (se incluído)
      if (incluirCodigoBarras) {
        // Desenhar um código de barras simulado
        const barWidth = 0.8
        const barcodeY = yInicio + configuracoes.altura - configuracoes.margemInferior - 10
        const barcodeHeight = 8
        
        doc.setFillColor(0, 0, 0)
        
        // Gerar barras aleatórias para simular código de barras
        for (let i = 0; i < 30; i++) {
          const barX = xInicio + (i * barWidth * 2)
          if (barX < xInicio + larguraUtil) {
            if (Math.random() > 0.3) { // 70% de chance de desenhar uma barra
              doc.rect(barX, barcodeY, barWidth, barcodeHeight, 'F')
            }
          }
        }
        
        // Texto do código de barras
        doc.setFontSize(8)
        doc.text(etiqueta.produto.sku, xInicio + (larguraUtil / 2), barcodeY + barcodeHeight + 3, { align: 'center' })
      }
      
      etiquetasNaPagina++
    })
    
    // Salvar o PDF
    doc.save('etiquetas.pdf')
    
    // Mostrar mensagem de sucesso
    setSuccessMessage('Etiquetas geradas com sucesso!')
    setTimeout(() => setSuccessMessage(''), 3000)
  }

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
              </div>
            </div>
          )}
          
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Seleção de produtos */}
            <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Produtos</h3>
                <p className="mt-1 text-sm text-gray-500">Selecione os produtos para gerar etiquetas</p>
              </div>
              <div className="px-4 py-5 sm:p-6 max-h-96 overflow-y-auto">
                {produtos.length > 0 ? (
                  <div className="space-y-2">
                    {produtos.map(produto => (
                      <div key={produto.id} className="flex items-center">
                        <input
                          id={`produto-${produto.id}`}
                          name={`produto-${produto.id}`}
                          type="checkbox"
                          checked={selectedProdutos.some(p => p.id === produto.id)}
                          onChange={() => toggleProdutoSelection(produto)}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor={`produto-${produto.id}`} className="ml-3 block text-sm font-medium text-gray-700">
                          {produto.nome} <span className="text-gray-500 text-xs">({produto.sku})</span>
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Nenhum produto cadastrado.</p>
                )}
              </div>
              <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center">
                  <label htmlFor="quantidade" className="block text-sm font-medium text-gray-700 mr-3">
                    Quantidade por produto:
                  </label>
                  <input
                    type="number"
                    name="quantidade"
                    id="quantidade"
                    min="1"
                    value={quantidade}
                    onChange={(e) => setQuantidade(Number(e.target.value))}
                    className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
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
                  
                  {incluirCliente && (
                    <div className="mt-4">
                      <label htmlFor="cliente" className="block text-sm font-medium text-gray-700">
                        Selecione o cliente
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
                          <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Ações */}
            <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Gerar Etiquetas</h3>
                <p className="mt-1 text-sm text-gray-500">Visualize e exporte as etiquetas em PDF</p>
              </div>
              <div className="px-4 py-5 sm:p-6 flex flex-col items-center justify-center">
                <button
                  type="button"
                  onClick={gerarEtiquetas}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 w-full justify-center mb-4"
                >
                  <DocumentTextIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                  Visualizar Etiquetas
                </button>
                
                <button
                  type="button"
                  onClick={gerarPDF}
                  disabled={etiquetasGeradas.length === 0}
                  className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-full justify-center ${etiquetasGeradas.length === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-500 focus-visible:outline-green-600'}`}
                >
                  <ArrowDownTrayIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                  Exportar PDF
                </button>
                
                {successMessage && (
                  <div className="mt-4 flex items-center justify-center text-green-600">
                    <CheckCircleIcon className="h-5 w-5 mr-1" />
                    <span>{successMessage}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Visualização das etiquetas */}
          {showPreview && etiquetasGeradas.length > 0 && (
            <div className="mt-8">
              <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-semibold leading-6 text-gray-900">Visualização das Etiquetas</h3>
                    <p className="mt-1 text-sm text-gray-500">{etiquetasGeradas.length} etiquetas geradas</p>
                  </div>
                  <button
                    type="button"
                    onClick={gerarPDF}
                    className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                  >
                    <ArrowDownTrayIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                    Exportar PDF
                  </button>
                </div>
                <div className="px-4 py-5 sm:p-6" ref={previewRef}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {etiquetasGeradas.map((etiqueta) => (
                      <div 
                        key={etiqueta.id} 
                        className="border border-gray-300 rounded-md p-3 relative"
                        style={{
                          width: `${configuracoes.largura * 2}px`,
                          height: `${configuracoes.altura * 2}px`,
                        }}
                      >
                        <div className="flex flex-col h-full">
                          <div className="font-bold text-sm">{etiqueta.produto.nome}</div>
                          <div className="text-xs">SKU: {etiqueta.produto.sku}</div>
                          
                          {incluirCliente && etiqueta.cliente && (
                            <div className="text-xs mt-1">Cliente: {etiqueta.cliente.nome}</div>
                          )}
                          
                          {incluirData && etiqueta.data && (
                            <div className="text-xs mt-1">Data: {etiqueta.data}</div>
                          )}
                          
                          {incluirNumeroSerie && etiqueta.numeroSerie && (
                            <div className="text-xs mt-1">N° Série: {etiqueta.numeroSerie}</div>
                          )}
                          
                          {incluirCodigoBarras && (
                            <div className="mt-auto">
                              <div className="w-full h-8 mt-2 flex items-end justify-center">
                                {/* Simulação visual de código de barras */}
                                <div className="w-full h-8 flex items-end">
                                  {Array.from({ length: 30 }).map((_, i) => (
                                    <div 
                                      key={i} 
                                      className={`h-${Math.floor(Math.random() * 8) + 3} bg-black mx-px`}
                                      style={{ width: '1px' }}
                                    />
                                  ))}
                                </div>
                              </div>
                              <div className="text-center text-xs mt-1">{etiqueta.produto.sku}</div>
                            </div>
                          )}
                        </div>
                        <div className="absolute top-0 right-0 p-1">
                          <TagIcon className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
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