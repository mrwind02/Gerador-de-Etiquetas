import { Link } from 'react-router-dom'
import { HomeIcon } from '@heroicons/react/24/outline'

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">Página não encontrada</h1>
        <p className="mt-4 text-base leading-7 text-gray-600">Desculpe, não conseguimos encontrar a página que você está procurando.</p>
        <div className="mt-10">
          <Link to="/" className="inline-flex items-center rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            <HomeIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  )
}