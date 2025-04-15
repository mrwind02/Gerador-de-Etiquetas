# Guia de Deploy na Vercel

Este guia explica como fazer o deploy do Gerador de Etiquetas na Vercel, uma plataforma de hospedagem gratuita para aplicações web.

## Pré-requisitos

1. Uma conta na [Vercel](https://vercel.com/signup)
2. Git instalado em sua máquina
3. Projeto do Firebase configurado (conforme o GUIA_FIREBASE.md)

## Passo 1: Preparar o Projeto para Deploy

O projeto já está configurado para deploy na Vercel com os seguintes arquivos:

- `vercel.json` - Configuração para roteamento e build
- `.env.example` - Exemplo das variáveis de ambiente necessárias

## Passo 2: Fazer Upload do Projeto para um Repositório Git

1. Crie um repositório no GitHub, GitLab ou Bitbucket
2. Inicialize o Git no seu projeto (se ainda não estiver inicializado):

```bash
git init
git add .
git commit -m "Preparação para deploy na Vercel"
```

3. Adicione o repositório remoto e faça push:

```bash
git remote add origin [URL_DO_SEU_REPOSITÓRIO]
git push -u origin main
```

## Passo 3: Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em "New Project"
3. Importe o repositório que você acabou de criar
4. Configure as variáveis de ambiente:
   - Vá para a seção "Environment Variables"
   - Adicione todas as variáveis listadas no arquivo `.env.example` com os valores do seu projeto Firebase

```
VITE_FIREBASE_API_KEY=seu-api-key
VITE_FIREBASE_AUTH_DOMAIN=seu-auth-domain
VITE_FIREBASE_PROJECT_ID=seu-project-id
VITE_FIREBASE_STORAGE_BUCKET=seu-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=seu-messaging-sender-id
VITE_FIREBASE_APP_ID=seu-app-id
VITE_FIREBASE_MEASUREMENT_ID=seu-measurement-id
```

5. Clique em "Deploy"

## Passo 4: Configurações Adicionais

### Domínio Personalizado (Opcional)

1. Na dashboard do seu projeto na Vercel, vá para "Settings" > "Domains"
2. Adicione seu domínio personalizado e siga as instruções

### Configurações de Segurança do Firebase

Para produção, é recomendado configurar regras de segurança mais restritivas no Firestore:

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Vá para seu projeto > Firestore Database > Rules
3. Configure regras de segurança adequadas para seu caso de uso

## Solução de Problemas

### Problema: Rotas não funcionam após o deploy

**Solução**: Verifique se o arquivo `vercel.json` está correto e contém a configuração de rewrites para direcionar todas as rotas para o index.html.

### Problema: Erro de conexão com o Firebase

**Solução**: 
1. Verifique se todas as variáveis de ambiente foram configuradas corretamente na Vercel
2. Certifique-se de que o domínio do seu site está autorizado no Firebase Console (Authentication > Sign-in method > Authorized domains)

## Atualizações do Projeto

Para atualizar seu projeto após fazer alterações:

1. Faça commit das alterações locais
2. Push para o repositório remoto
3. A Vercel detectará automaticamente as alterações e fará um novo deploy

```bash
git add .
git commit -m "Descrição das alterações"
git push
```

## Recursos Adicionais

- [Documentação da Vercel](https://vercel.com/docs)
- [Guia de Variáveis de Ambiente no Vite](https://vitejs.dev/guide/env-and-mode.html)
- [Configuração do Firebase para Produção](https://firebase.google.com/docs/web/setup)