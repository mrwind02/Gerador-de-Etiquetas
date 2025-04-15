import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'

// Layouts
import Layout from './components/Layout'

// Pages
import Dashboard from './pages/Dashboard'
import GeradorEtiquetas from './pages/GeradorEtiquetas'
import Produtos from './pages/Produtos'
import Clientes from './pages/Clientes'
import ModelosEtiquetas from './pages/ModelosEtiquetas'
import NotFound from './pages/NotFound'

// Firebase config
import { db } from './firebase/config'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="etiquetas" element={<GeradorEtiquetas db={db} />} />
        <Route path="produtos" element={<Produtos db={db} />} />
        <Route path="clientes" element={<Clientes db={db} />} />
        <Route path="modelos" element={<ModelosEtiquetas db={db} />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App