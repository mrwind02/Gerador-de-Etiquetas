import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore'
import { PlusIcon, PencilSquareIcon, TrashIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'

export default function ModelosEtiquetas({ db }) {
  const [modelos, setModelos] = useState([])
  const [formMode, setFormMode] = useState('add') // 'add' ou 'edit'
  const [currentModelo, setCurrentModelo] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    configuracoes: {
      largura: 90,
      altura: 40,
      margemSuperior: 5,
      margemInferior: 5,
      margemEsquerda: 5,
      margemDireita: 5,
      quantidadePorPagina: 10,
      tamanhoFonte: 10
    }
  })
  
  const navigate = useNavigate()

  // Carregar modelos do Firestore
  useEffect(() => {
    const fetchModelos = async () => {
      try {
        const modelosRef = collection(db, 'modelos')
        const q = query(modelosRef, orderBy('nome'))
        const querySnapshot = await getDocs(q)
        const modelosList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setModelos(modelosList)
      } catch (error) {
        console.error('Erro ao carregar modelos:', error)
      }
    }

    fetchModelos()
  }, [db])

  // Manipular mudanças no formulário
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Manipular mudanças nas configurações
  const handleConfigChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      configuracoes: {
        ...prev.configuracoes,
        [name]: Number(value)
      }
    }))
  }

  // Abrir modal para adicionar modelo
  const handleAddClick = () => {
    setFormMode('add')
    setFormData({
      nome: '',
      descricao: '',
      configuracoes: {
        largura: 90,
        altura: 40,
        margemSuperior: 5,
        margemInferior: 5,
        margemEsquerda: 5,
        margemDireita: 5,
        quantidadePorPagina: 10,
        tamanhoFonte: 10
      }
    })
    setIsModalOpen(true)
  }

  // Abrir modal para editar modelo
  const handleEditClick = (modelo) => {
    setFormMode('edit')
    setCurrentModelo(modelo)
    setFormData({
      nome: modelo.nome,
      descricao: modelo.descricao || '',
      configuracoes: {
        largura: modelo.configuracoes?.largura || 90,
        altura: modelo.configuracoes?.altura || 40,
        margemSuperior: modelo.configuracoes?.margemSuperior || 5,
        margemInferior: modelo.configuracoes?.margemInferior || 5,
        margemEsquerda: modelo.configuracoes?.margemEsquerda || 5,
        margemDireita: modelo.configuracoes?.margemDireita || 5,
        quantidadePorPagina: modelo.configuracoes?.quantidadePorPagina || 10,
        tamanhoFonte: modelo.configuracoes?.tamanhoFonte || 10
      }
    })
    setIsModalOpen(true)
  }

  // Usar modelo para gerar etiquetas
  const handleUseModelo = (modelo) => {
    // Navegar para a página de geração de etiquetas com o modelo selecionado
    navigate('/etiquetas', { state: { modelo } })
  }

  // Salvar modelo (adicionar ou atualizar)
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (formMode === 'add') {
        // Adicionar novo modelo
        await addDoc(collection(db, 'modelos'), formData)
      } else {
        // Atualizar modelo existente
        const modeloRef = doc(db, 'modelos', currentModelo.id)
        await updateDoc(modeloRef, formData)
      }
      
      // Recarregar a lista de modelos
      const modelosRef = collection(db, 'modelos')
      const q = query(modelosRef, orderBy('nome'))
      const querySnapshot = await getDocs(q)
      const modelosList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setModelos(modelosList)
      
      // Fechar o modal
      setIsModalOpen(false)
    } catch (error) {
      console.error('Erro ao salvar modelo:', error)
    }
  }

  // Excluir modelo
  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este modelo?')) {
      try {
        await deleteDoc(doc(db, 'modelos', id))
        setModelos(modelos.filter(modelo => modelo.id !== id))
      } catch (error) {
        console.error('Erro ao excluir modelo:', error)
      }
    }
  }

  return (
    <div className="bg-white py-6">
      <div className="mx-auto max-w-7xl">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold leading-6 text-gray-900">Modelos de Etiquetas</h1>
              <p className="mt-2 text-sm text-gray-700">
                Salve e reutilize diferentes configurações de etiquetas para agilizar seu trabalho.
              </p>
            </div>
            <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
              <button
                type="button"
                onClick={handleAddClick}
                className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <PlusIcon className="h-5 w-5 inline-block mr-1" />
                Novo Modelo
              </button>
            </div>
          </div>
          
          {/* Lista de modelos */}
          <div className="mt-8 flow-root">
            {modelos.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {modelos.map((modelo) => (
                  <div key={modelo.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-medium text-gray-900 truncate">{modelo.nome}</h3>
                      <p className="mt-1 text-sm text-gray-500">{modelo.descricao}</p>
                      
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div>
                            <dt className="text-gray-500">Tamanho</dt>
                            <dd className="font-medium text-gray-900">
                              {modelo.configuracoes?.largura || 90} x {modelo.configuracoes?.altura || 40} mm
                            </dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Qtd. por página</dt>
                            <dd className="font-medium text-gray-900">
                              {modelo.configuracoes?.quantidadePorPagina || 10}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Margens</dt>
                            <dd className="font-medium text-gray-900">
                              {modelo.configuracoes?.margemSuperior || 5}/{modelo.configuracoes?.margemInferior || 5}/{modelo.configuracoes?.margemEsquerda || 5}/{modelo.configuracoes?.margemDireita || 5} mm
                            </dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Tamanho da fonte</dt>
                            <dd className="font-medium text-gray-900">
                              {modelo.configuracoes?.tamanhoFonte || 10}pt
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-between">
                      <button
                        onClick={() => handleUseModelo(modelo)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium text-sm flex items-center"
                      >
                        <DocumentDuplicateIcon className="h-5 w-5 mr-1" />
                        Usar modelo
                      </button>
                      <div>
                        <button
                          onClick={() => handleEditClick(modelo)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                          <span className="sr-only">Editar</span>
                        </button>
                        <button
                          onClick={() => handleDelete(modelo.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                          <span className="sr-only">Excluir</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <DocumentDuplicateIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum modelo</h3>
                <p className="mt-1 text-sm text-gray-500">Crie seu primeiro modelo de etiqueta para começar.</p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleAddClick}
                    className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                    Novo Modelo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de formulário */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900">
              {formMode === 'add' ? 'Novo Modelo de Etiqueta' : 'Editar Modelo de Etiqueta'}
            </h3>
            
            <form onSubmit={handleSubmit} className="mt-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
                    Nome do Modelo *
                  </label>
                  <input
                    type="text"
                    name="nome"
                    id="nome"
                    required
                    value={formData.nome}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">
                    Descrição
                  </label>
                  <textarea
                    name="descricao"
                    id="descricao"
                    rows={2}
                    value={formData.descricao}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-900">Configurações da Etiqueta</h4>
                  
                  <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="largura" className="block text-sm font-medium text-gray-700">
                        Largura (mm) *
                      </label>
                      <input
                        type="number"
                        name="largura"
                        id="largura"
                        min="10"
                        required
                        value={formData.configuracoes.largura}
                        onChange={handleConfigChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="altura" className="block text-sm font-medium text-gray-700">
                        Altura (mm) *
                      </label>
                      <input
                        type="number"
                        name="altura"
                        id="altura"
                        min="10"
                        required
                        value={formData.configuracoes.altura}
                        onChange={handleConfigChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="margemSuperior" className="block text-sm font-medium text-gray-700">
                        Margem Superior (mm) *
                      </label>
                      <input
                        type="number"
                        name="margemSuperior"
                        id="margemSuperior"
                        min="0"
                        required
                        value={formData.configuracoes.margemSuperior}
                        onChange={handleConfigChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="margemInferior" className="block text-sm font-medium text-gray-700">
                        Margem Inferior (mm) *
                      </label>
                      <input
                        type="number"
                        name="margemInferior"
                        id="margemInferior"
                        min="0"
                        required
                        value={formData.configuracoes.margemInferior}
                        onChange={handleConfigChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="margemEsquerda" className="block text-sm font-medium text-gray-700">
                        Margem Esquerda (mm) *
                      </label>
                      <input
                        type="number"
                        name="margemEsquerda"
                        id="margemEsquerda"
                        min="0"
                        required
                        value={formData.configuracoes.margemEsquerda}
                        onChange={handleConfigChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="margemDireita" className="block text-sm font-medium text-gray-700">
                        Margem Direita (mm) *
                      </label>
                      <input
                        type="number"
                        name="margemDireita"
                        id="margemDireita"
                        min="0"
                        required
                        value={formData.configuracoes.margemDireita}
                        onChange={handleConfigChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="quantidadePorPagina" className="block text-sm font-medium text-gray-700">
                        Quantidade por Página *
                      </label>
                      <input
                        type="number"
                        name="quantidadePorPagina"
                        id="quantidadePorPagina"
                        min="1"
                        required
                        value={formData.configuracoes.quantidadePorPagina}
                        onChange={handleConfigChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="tamanhoFonte" className="block text-sm font-medium text-gray-700">
                        Tamanho da Fonte (pt) *
                      </label>
                      <input
                        type="number"
                        name="tamanhoFonte"
                        id="tamanhoFonte"
                        min="6"
                        max="24"
                        required
                        value={formData.configuracoes.tamanhoFonte}
                        onChange={handleConfigChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  type="submit"
                  className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                >
                  {formMode === 'add' ? 'Criar Modelo' : 'Salvar Alterações'}
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}