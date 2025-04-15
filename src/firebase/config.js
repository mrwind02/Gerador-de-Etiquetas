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

export { db };