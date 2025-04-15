import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore'
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function Clientes({ db }) {
  const [clientes, setClientes] = useState([])
  const [formMode, setFormMode] = useState('add') // 'add' ou 'edit'
  const [currentCliente, setCurrentCliente] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    documento: '',
    email: '',
    telefone: '',
    endereco: ''
  })

  // Carregar clientes do Firestore
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const clientesRef = collection(db, 'clientes')
        const q = query(clientesRef, orderBy('nome'))
        const querySnapshot = await getDocs(q)
        const clientesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setClientes(clientesList)
      } catch (error) {
        console.error('Erro ao carregar clientes:', error)
      }
    }

    fetchClientes()
  }, [db])

  // Manipular mudanças no formulário
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Abrir modal para adicionar cliente
  const handleAddClick = () => {
    setFormMode('add')
    setFormData({
      nome: '',
      documento: '',
      email: '',
      telefone: '',
      endereco: ''
    })
    setIsModalOpen(true)
  }

  // Abrir modal para editar cliente
  const handleEditClick = (cliente) => {
    setFormMode('edit')
    setCurrentCliente(cliente)
    setFormData({
      nome: cliente.nome,
      documento: cliente.documento || '',
      email: cliente.email || '',
      telefone: cliente.telefone || '',
      endereco: cliente.endereco || ''
    })
    setIsModalOpen(true)
  }

  // Salvar cliente (adicionar ou atualizar)
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (formMode === 'add') {
        // Adicionar novo cliente
        await addDoc(collection(db, 'clientes'), formData)
      } else {
        // Atualizar cliente existente
        const clienteRef = doc(db, 'clientes', currentCliente.id)
        await updateDoc(clienteRef, formData)
      }
      
      // Recarregar a lista de clientes
      const clientesRef = collection(db, 'clientes')
      const q = query(clientesRef, orderBy('nome'))
      const querySnapshot = await getDocs(q)
      const clientesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setClientes(clientesList)
      
      // Fechar o modal
      setIsModalOpen(false)
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
    }
  }

  // Excluir cliente
  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await deleteDoc(doc(db, 'clientes', id))
        setClientes(clientes.filter(cliente => cliente.id !== id))
      } catch (error) {
        console.error('Erro ao excluir cliente:', error)
      }
    }
  }

  return (
    <div className="bg-white py-6">
      <div className="mx-auto max-w-7xl">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold leading-6 text-gray-900">Clientes</h1>
              <p className="mt-2 text-sm text-gray-700">
                Cadastre e gerencie os clientes que serão associados às etiquetas.
              </p>
            </div>
            <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
              <button
                type="button"
                onClick={handleAddClick}
                className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <PlusIcon className="h-5 w-5 inline-block mr-1" />
                Adicionar Cliente
              </button>
            </div>
          </div>
          
          {/* Tabela de clientes */}
          <div className="mt-8 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                {clientes.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Nome</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">CPF/CNPJ</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">E-mail</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Telefone</th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                          <span className="sr-only">Ações</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {clientes.map((cliente) => (
                        <tr key={cliente.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">{cliente.nome}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{cliente.documento}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{cliente.email}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{cliente.telefone}</td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                            <button
                              onClick={() => handleEditClick(cliente)}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              <PencilSquareIcon className="h-5 w-5 inline-block" />
                              <span className="sr-only">Editar</span>
                            </button>
                            <button
                              onClick={() => handleDelete(cliente.id)}
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
                    <p className="text-gray-500">Nenhum cliente cadastrado. Clique em "Adicionar Cliente" para começar.</p>
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
              {formMode === 'add' ? 'Adicionar Cliente' : 'Editar Cliente'}
            </h3>
            
            <form onSubmit={handleSubmit} className="mt-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
                    Nome *
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
                  <label htmlFor="documento" className="block text-sm font-medium text-gray-700">
                    CPF/CNPJ
                  </label>
                  <input
                    type="text"
                    name="documento"
                    id="documento"
                    value={formData.documento}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    E-mail
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">
                    Telefone
                  </label>
                  <input
                    type="text"
                    name="telefone"
                    id="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="endereco" className="block text-sm font-medium text-gray-700">
                    Endereço
                  </label>
                  <textarea
                    name="endereco"
                    id="endereco"
                    rows={3}
                    value={formData.endereco}
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