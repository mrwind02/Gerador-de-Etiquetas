import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, writeBatch } from 'firebase/firestore';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import { normalizeProductData } from '../firebase/config';

export default function Produtos({ db }) {
  const [produtos, setProdutos] = useState([]);
  const [filteredProdutos, setFilteredProdutos] = useState([]); // Lista filtrada de produtos
  const [searchTerm, setSearchTerm] = useState(''); // Termo de busca
  const [formMode, setFormMode] = useState('add'); // 'add' ou 'edit'
  const [currentProduto, setCurrentProduto] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    sku: ''
  });

  // Função para calcular automaticamente a quantidade de etiquetas com base no tipo de produto
  const calcularQuantidadeEtiquetas = (produto, tiposProdutos) => {
    const tipoProduto = tiposProdutos.find((tipo) => {
      const palavrasChave = tipo.nome.toLowerCase().split(' '); // Dividir o nome do tipo em palavras-chave
      return palavrasChave.every((palavra) => produto.nome.toLowerCase().includes(palavra)); // Verificar se todas as palavras-chave estão no nome do produto
    });

    return tipoProduto ? tipoProduto.quantidade : 1; // Retornar a quantidade do tipo ou 1 como padrão
  };

  // Função para gerar etiquetas com base nos produtos selecionados
  const gerarEtiquetas = (produtosSelecionados, tiposProdutos) => {
    const etiquetas = [];

    produtosSelecionados.forEach((produto) => {
      const quantidadeEtiquetas = calcularQuantidadeEtiquetas(produto, tiposProdutos);

      for (let i = 0; i < quantidadeEtiquetas; i++) {
        etiquetas.push({
          id: `${produto.id}-${i + 1}`,
          produto,
          numeroEtiqueta: i + 1,
        });
      }
    });

    return etiquetas;
  };

  // Exemplo de uso ao salvar ou processar produtos
  const handleGerarEtiquetas = () => {
    const etiquetasGeradas = gerarEtiquetas(produtos, tiposProdutos); // `tiposProdutos` deve ser carregado do banco
    console.log('Etiquetas Geradas:', etiquetasGeradas);
    alert(`Foram geradas ${etiquetasGeradas.length} etiquetas.`);
  };

  // Carregar produtos do Firestore
  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const produtosRef = collection(db, 'produtos');
        const q = query(produtosRef, orderBy('nome'));
        const querySnapshot = await getDocs(q);
        const produtosList = querySnapshot.docs.map((doc) => ({
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

  // Atualizar a lista filtrada de produtos com base no termo de busca
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProdutos(produtos); // Mostrar todos os produtos se o termo de busca estiver vazio
    } else {
      const term = searchTerm.trim().toLowerCase();
      setFilteredProdutos(
        produtos.filter((produto) =>
          produto.nome.toLowerCase().includes(term) // Filtrar produtos pelo nome
        )
      );
    }
  }, [searchTerm, produtos]);

  // Manipular mudanças no formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Abrir modal para adicionar produto
  const handleAddClick = () => {
    setFormMode('add');
    setFormData({
      nome: '',
      sku: ''
    });
    setIsModalOpen(true);
  };

  // Abrir modal para editar produto
  const handleEditClick = (produto) => {
    setFormMode('edit');
    setCurrentProduto(produto);
    setFormData({
      nome: produto.nome,
      sku: produto.sku
    });
    setIsModalOpen(true);
  };

  // Salvar produto (adicionar ou atualizar)
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (formMode === 'add') {
        // Adicionar novo produto
        await addDoc(collection(db, 'produtos'), formData);
      } else {
        // Atualizar produto existente
        const produtoRef = doc(db, 'produtos', currentProduto.id);
        await updateDoc(produtoRef, formData);
      }

      // Recarregar a lista de produtos
      const produtosRef = collection(db, 'produtos');
      const q = query(produtosRef, orderBy('nome'));
      const querySnapshot = await getDocs(q);
      const produtosList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setProdutos(produtosList);

      // Fechar o modal
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
    }
  };

  // Excluir produto
  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await deleteDoc(doc(db, 'produtos', id));
        setProdutos(produtos.filter((produto) => produto.id !== id));
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
      }
    }
  };

  // Função para importar produtos de arquivos
  const handleImportProdutos = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop().toLowerCase();

    let produtosImportados = [];

    if (fileExtension === 'txt' || fileExtension === 'csv') {
      // Processar arquivos de texto ou CSV
      const reader = new FileReader();
      reader.onload = async (event) => {
        const lines = event.target.result.split('\n').map((line) => line.trim());
        produtosImportados = lines
          .filter((line) => line) // Ignorar linhas vazias
          .map((line) => {
            const [nome, sku] = line.split(',').map((item) => item.trim());
            return { nome, sku };
          });

        await salvarProdutosNoBanco(produtosImportados);
      };
      reader.readAsText(file);
    } else if (fileExtension === 'xlsx') {
      // Processar arquivos Excel
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });

          // Considerar a primeira planilha
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          produtosImportados = XLSX.utils.sheet_to_json(sheet).map((produto) => ({
            nome: produto.Descrição || produto.descricao || produto.Nome || produto.nome || '',
            sku: produto.Cod || produto.Código || produto.codigo || produto.sku || ''
          }));

          // Normalizar os dados importados
          produtosImportados = produtosImportados.map((produto) => ({
            nome: produto.nome.trim(),
            sku: produto.sku.trim().toLowerCase(), // Normalizar SKU para minúsculas
          }));

          await salvarProdutosNoBanco(produtosImportados);
        } catch (error) {
          console.error('Erro ao processar arquivo Excel:', error);
          alert('Erro ao processar o arquivo Excel. Verifique o formato do arquivo.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert('Formato de arquivo não suportado. Use arquivos .txt, .csv ou .xlsx.');
    }
  };

  // Função para salvar produtos no banco de dados com validação de duplicados e operações em lote
  const salvarProdutosNoBanco = async (produtosImportados) => {
    try {
      console.log('Iniciando a importação de produtos...');
      const produtosRef = collection(db, 'produtos');
      const q = query(produtosRef, orderBy('sku'));
      const querySnapshot = await getDocs(q);
      const produtosExistentes = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        sku: typeof doc.data().sku === 'string' ? Number(doc.data().sku.trim()) : doc.data().sku, // Converter SKU existente para número
      }));

      console.log(`Produtos existentes carregados: ${produtosExistentes.length}`);

      let batch = writeBatch(db); // Criar um batch para operações em lote
      let batchCounter = 0; // Contador para rastrear o número de operações no lote

      for (const produto of produtosImportados) {
        const normalizedProduto = normalizeProductData(produto); // Normalizar o produto antes de salvar

        if (!normalizedProduto.sku || !normalizedProduto.nome) {
          console.warn(`Produto ignorado por dados incompletos: ${JSON.stringify(normalizedProduto)}`);
          continue; // Ignorar produtos com dados incompletos
        }

        const produtoDuplicado = produtosExistentes.find(
          (p) => p.sku === normalizedProduto.sku
        );

        if (produtoDuplicado) {
          console.log(`Produto duplicado encontrado: ${normalizedProduto.sku}`);
          const userChoice = window.confirm(
            `O produto com SKU "${normalizedProduto.sku}" já existe. Deseja editar o produto existente?`
          );

          if (userChoice) {
            // Atualizar o produto existente no batch
            const produtoRef = doc(db, 'produtos', produtoDuplicado.id);
            batch.update(produtoRef, { ...produtoDuplicado, ...normalizedProduto });
          }
          // Caso contrário, ignorar o produto duplicado
        } else {
          // Adicionar novo produto ao batch
          console.log(`Adicionando novo produto: ${normalizedProduto.sku}`);
          const novoProdutoRef = doc(produtosRef);
          batch.set(novoProdutoRef, { ...normalizedProduto, id: novoProdutoRef.id }); // Atribuir um id único
        }

        batchCounter++;

        // Se o número de operações no lote atingir o limite, confirmar o batch e criar um novo
        if (batchCounter === 500) {
          console.log('Comitando lote de 500 operações...');
          await batch.commit();
          batch = writeBatch(db); // Criar um novo batch
          batchCounter = 0; // Reiniciar o contador
        }
      }

      // Confirmar o último batch, se houver operações pendentes
      if (batchCounter > 0) {
        console.log(`Comitando último lote com ${batchCounter} operações...`);
        await batch.commit();
      }

      // Recarregar a lista de produtos
      const updatedSnapshot = await getDocs(query(produtosRef, orderBy('nome')));
      const produtosList = updatedSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        sku: typeof doc.data().sku === 'string' ? Number(doc.data().sku.trim()) : doc.data().sku, // Converter SKU ao recarregar
      }));
      setProdutos(produtosList); // Atualizar a lista de produtos

      console.log('Importação concluída com sucesso!');
      alert('Produtos importados e salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar produtos no banco de dados:', error);
      alert('Erro ao salvar produtos no banco de dados. Verifique os logs para mais detalhes.');
    }
  };

  return (
    <div className="bg-white py-6">
      <div className="mx-auto max-w-7xl">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold leading-6 text-gray-900">Produtos</h1>
              <p className="mt-2 text-sm text-gray-700">
                Cadastre e gerencie os produtos que serão utilizados na geração de etiquetas.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:flex sm:items-center sm:gap-4">
              <button
                type="button"
                onClick={handleAddClick}
                className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <PlusIcon className="h-5 w-5 inline-block mr-1" />
                Adicionar Produto
              </button>
              <label
                htmlFor="importProdutos"
                className="block rounded-md bg-gray-100 px-3 py-2 text-center text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-200 cursor-pointer"
              >
                Importar Produtos
                <input
                  type="file"
                  id="importProdutos"
                  accept=".txt,.csv,.xlsx"
                  onChange={handleImportProdutos}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Barra de busca */}
          <div className="mt-6">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome do produto"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {/* Tabela de produtos */}
          <div className="mt-8 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                {filteredProdutos.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Nome</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">SKU</th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                          <span className="sr-only">Ações</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredProdutos.map((produto) => (
                        <tr key={produto.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">{produto.nome}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{produto.sku}</td>
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
                    <p className="text-gray-500">Nenhum produto encontrado.</p>
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
  );
}