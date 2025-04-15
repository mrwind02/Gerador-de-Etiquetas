# Guia de Configuração do Firebase

Este guia irá ajudá-lo a conectar seu aplicativo "Gerador de Etiquetas" ao Firebase, permitindo o armazenamento de dados no Firestore.

## Passo 1: Criar um Projeto no Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Digite um nome para o projeto (ex: "Gerador de Etiquetas")
4. Siga as instruções para criar o projeto (você pode desativar o Google Analytics se desejar)
5. Aguarde a criação do projeto e clique em "Continuar"

## Passo 2: Adicionar um Aplicativo Web

1. Na página inicial do seu projeto Firebase, clique no ícone da web (</>) para adicionar um aplicativo web
2. Digite um nome para o aplicativo (ex: "Gerador de Etiquetas Web")
3. Não é necessário configurar o Firebase Hosting agora
4. Clique em "Registrar aplicativo"

## Passo 3: Copiar as Credenciais

Após registrar o aplicativo, você verá um código de configuração semelhante a este:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB_XXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

Copie todo o objeto `firebaseConfig`.

## Passo 4: Configurar o Firestore Database

1. No menu lateral do Firebase Console, clique em "Firestore Database"
2. Clique em "Criar banco de dados"
3. Selecione "Iniciar no modo de produção" ou "Iniciar no modo de teste" (recomendado para desenvolvimento)
4. Selecione a localização do servidor mais próxima de você (ex: "us-east1")
5. Clique em "Ativar"

## Passo 5: Atualizar o Arquivo de Configuração

1. Abra o arquivo `src/firebase/config.js` no seu projeto
2. Substitua o objeto `firebaseConfig` existente pelo que você copiou do Firebase Console

```javascript
// Configuração do Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Substitua este objeto pelo que você copiou do Firebase Console
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
```

## Passo 6: Criar as Coleções Necessárias

Seu aplicativo utiliza as seguintes coleções no Firestore:

1. `produtos` - Para armazenar informações sobre produtos
2. `clientes` - Para armazenar informações sobre clientes
3. `modelos` - Para armazenar modelos de etiquetas

Você pode criar estas coleções manualmente no Firebase Console ou deixar que sejam criadas automaticamente quando seu aplicativo adicionar o primeiro documento a cada coleção.

## Passo 7: Testar a Conexão

1. Inicie seu aplicativo com `npm run dev`
2. Tente adicionar um cliente ou produto
3. Verifique no Firebase Console se os dados foram salvos corretamente

## Solução de Problemas

Se encontrar problemas ao conectar ao Firebase:

1. Verifique se as credenciais foram copiadas corretamente
2. Certifique-se de que o Firestore Database foi ativado
3. Verifique o console do navegador para ver mensagens de erro específicas
4. Certifique-se de que as regras de segurança do Firestore permitem leitura e escrita

## Regras de Segurança do Firestore

Para desenvolvimento, você pode usar estas regras que permitem acesso total:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Para produção, recomenda-se implementar regras de segurança mais restritivas.