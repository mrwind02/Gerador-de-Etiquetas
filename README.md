# Gerador de Etiquetas

Um aplicativo web completo para criação e gerenciamento de etiquetas personalizadas para produtos, desenvolvido com React, Tailwind CSS e Firebase.

## Funcionalidades

### 🎫 Gerador de Etiquetas
- Crie etiquetas personalizadas em PDF para impressão
- Configure tamanho, margens, quantidade por página e tamanho da fonte
- Inclua informações como nome do produto, código de barras, cliente, data e número de série
- Visualize as etiquetas antes de exportar para PDF

### 📦 Cadastro de Produtos
- Adicione, edite, exclua e liste produtos
- Campos: nome, SKU, descrição

### 👤 Cadastro de Clientes
- Adicione, edite, exclua e liste clientes
- Campos: nome, CPF/CNPJ, e-mail, telefone, endereço

### 🧩 Modelos de Etiquetas
- Salve diferentes configurações de etiquetas para reutilização
- Gerencie seus modelos favoritos

## Tecnologias Utilizadas

- **Frontend**: React com Tailwind CSS
- **Roteamento**: React Router
- **Banco de Dados**: Firebase Firestore
- **Geração de PDF**: jsPDF
- **UI Components**: Headless UI e Heroicons

## Como Executar o Projeto

### Pré-requisitos

- Node.js (versão 14 ou superior)
- NPM ou Yarn

### Instalação

1. Clone o repositório ou extraia os arquivos
2. Navegue até a pasta do projeto
3. Instale as dependências:

```bash
npm install
```

4. Configure o Firebase:
   - Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
   - Ative o Firestore Database
   - Substitua as configurações no arquivo `src/firebase/config.js` com suas credenciais

5. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

6. Acesse o aplicativo em `http://localhost:5173`

## Como Usar

1. **Cadastre seus produtos**: Acesse a seção "Produtos" e adicione seus produtos com nome, SKU e descrição.

2. **Cadastre seus clientes** (opcional): Acesse a seção "Clientes" e adicione informações dos seus clientes.

3. **Configure modelos de etiquetas**: Crie modelos com diferentes configurações de tamanho, margens e fonte.

4. **Gere etiquetas**: Na seção "Gerador de Etiquetas":
   - Selecione os produtos
   - Configure as opções da etiqueta (código de barras, data, etc.)
   - Visualize as etiquetas
   - Exporte para PDF

## Licença

Este projeto está licenciado sob a licença MIT.