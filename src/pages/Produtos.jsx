import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore'
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function Produtos({ db }) {
  const [produtos, setProdutos] = useState([])
  const [formMode, setFormMode] = useState('add') // 'add' ou 'edit'
  const [currentProduto, setCurrentProduto] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    sku: '',
    descricao: ''
  })

  // Carregar produtos do Firestore
  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const produtosRef = collection(db, 'produtos')
        const q = query(produtosRef, orderBy('nome'))
        const querySnapshot = await getDocs(q)
        const produtosList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setProdutos(produtosList)
      } catch (error) {
        console.error('Erro ao carregar produtos:', error)
      }
    }

    fetchProdutos()
  }, [db])

  // Manipular mudanças no formulário
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Abrir modal para adicionar produto
  const handleAddClick = () => {
    setFormMode('add')
    setFormData({
      nome: '',
      sku: '',
      descricao: ''
    })
    setIsModalOpen(true)
  }

  // Abrir modal para editar produto
  const handleEditClick = (produto) => {
    setFormMode('edit')
    setCurrentProduto(produto)
    setFormData({
      nome: produto.nome,
      sku: produto.sku,
      descricao: produto.descricao || ''
    })
    setIsModalOpen(true)
  }

  // Salvar produto (adicionar ou atualizar)
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (formMode === 'add') {
        // Adicionar novo produto
        await addDoc(collection(db, 'produtos'), formData)
      } else {
        // Atualizar produto existente
        const produtoRef = doc(db, 'produtos', currentProduto.id)
        await updateDoc(produtoRef, formData)
      }
      
      // Recarregar a lista de produtos
      const produtosRef = collection(db, 'produtos')
      const q = query(produtosRef, orderBy('nome'))
      const querySnapshot = await getDocs(q)
      const produtosList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setProdutos(produtosList)
      
      // Fechar o modal
      setIsModalOpen(false)
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
    }
  }

  // Excluir produto
  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await deleteDoc(doc(db, 'produtos', id))
        setProdutos(produtos.filter(produto => produto.id !== id))
      } catch (error) {
        console.error('Erro ao excluir produto:', error)
      }
    }
  }

  return (
    <div className="bg-white py-6">
      <div className="mx-auto max-w-7xl">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold leading-6 text-gray-900">Produtos</h1>
              <p className="mt-2 text-sm text-gray-700">
                Cadastre e gerencie os produtos que serão utilizados na geração de etiquetas.
              </p>
            </div>
            <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
              <button
                type="button"
                onClick={handleAddClick}
                className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <PlusIcon className="h-5 w-5 inline-block mr-1" />
                Adicionar Produto
              </button>
            </div>
          </div>
          
          {/* Tabela de produtos */}
          <div className="mt-8 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                {produtos.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Nome</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">SKU</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Descrição</th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                          <span className="sr-only">Ações</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {produtos.map((produto) => (
                        <tr key={produto.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">{produto.nome}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{produto.sku}</td>
                          <td className="px-3 py-4 text-sm text-gray-500">{produto.descricao}</td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                            <button
                              onClick={() => handleEditClick(produto)}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              <PencilSquareIcon className="h-5 w-5 inline-block" />
                              <span className="sr-only">Editar</span>
                            </button>
                            <button
                              onClick={() => handleDelete(produto.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-5 w-5 inline-block" />
                              <span className="sr-only">Excluir</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500">Nenhum produto cadastrado. Clique em "Adicionar Produto" para começar.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de formulário */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900">
              {formMode === 'add' ? 'Adicionar Produto' : 'Editar Produto'}
            </h3>
            
            <form onSubmit={handleSubmit} className="mt-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
                    Nome do Produto *
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
                  <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                    SKU *
                  </label>
                  <input
                    type="text"
                    name="sku"
                    id="sku"
                    required
                    value={formData.sku}
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
                    rows={3}
                    value={formData.descricao}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  type="submit"
                  className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                >
                  {formMode === 'add' ? 'Adicionar' : 'Salvar'}
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