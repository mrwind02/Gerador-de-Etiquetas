// Configuração do Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Configuração do Firebase
// Para obter essas credenciais:
// 1. Acesse https://console.firebase.google.com/
// 2. Crie um novo projeto ou selecione um existente
// 3. Adicione um aplicativo web ao seu projeto
// 4. Copie o objeto de configuração e configure nas variáveis de ambiente
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCFG619a_ghDi2GchUVw7QSeYCTWgPV1ZA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gerador-de-etiquetas-4a815.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gerador-de-etiquetas-4a815",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gerador-de-etiquetas-4a815.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "272647407940",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:272647407940:web:de285000b0e40b08456f11",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-LZGVS01MGL"
};

// Nota: Em produção, configure estas variáveis no painel da Vercel

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Função para validar e normalizar os dados importados
export const normalizeProductData = (product) => {
  return {
    ...product,
    id: product.id || null, // Garantir que o produto tenha um campo 'id' (pode ser nulo inicialmente)
    sku: typeof product.Cod === 'string' && product.Cod.trim() ? Number(product.Cod.trim()) :
         typeof product.Código === 'string' && product.Código.trim() ? Number(product.Código.trim()) :
         typeof product.sku === 'string' ? Number(product.sku.trim()) :
         typeof product.sku === 'number' ? product.sku : null, // Garantir que o SKU seja convertido para número
    nome: typeof product.Descrição === 'string' && product.Descrição.trim() ? product.Descrição.trim() :
          typeof product.Nome === 'string' && product.Nome.trim() ? product.Nome.trim() :
          typeof product.nome === 'string' ? product.nome.trim() : 'Produto sem nome', // Garantir que o nome seja extraído corretamente
    uf: product.UF?.trim() || product.Estado?.trim() || 'UF', // Garantir que UF seja extraído corretamente
  };
};

export { db };