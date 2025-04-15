import { Link } from 'react-router-dom'
import {
  TagIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'

const features = [
  {
    name: 'Gerador de Etiquetas',
    description: 'Crie etiquetas personalizadas com código de barras, informações do produto e do cliente.',
    icon: TagIcon,
    href: '/etiquetas',
    color: 'bg-indigo-500'
  },
  {
    name: 'Cadastro de Produtos',
    description: 'Gerencie seu catálogo de produtos com informações detalhadas.',
    icon: ShoppingBagIcon,
    href: '/produtos',
    color: 'bg-green-500'
  },
  {
    name: 'Cadastro de Clientes',
    description: 'Mantenha um registro organizado de todos os seus clientes.',
    icon: UserGroupIcon,
    href: '/clientes',
    color: 'bg-yellow-500'
  },
  {
    name: 'Modelos de Etiquetas',
    description: 'Salve e reutilize diferentes modelos de etiquetas para agilizar seu trabalho.',
    icon: DocumentDuplicateIcon,
    href: '/modelos',
    color: 'bg-red-500'
  },
]

export default function Dashboard() {
  return (
    <div className="bg-white py-6">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Gerador de Etiquetas</h2>
          <p className="mt-4 text-lg leading-8 text-gray-600">
            Sistema completo para criação e gerenciamento de etiquetas personalizadas para seus produtos.
          </p>
        </div>

        <div className="mt-12">
          <div className="grid grid-cols-1 gap-y-8 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Link
                key={feature.name}
                to={feature.href}
                className="group relative block overflow-hidden rounded-lg border border-gray-200 p-6 hover:border-indigo-600 hover:ring-1 hover:ring-indigo-600 transition-all duration-300"
              >
                <div className={`absolute right-4 top-4 rounded-full ${feature.color} p-3`}>
                  <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold leading-8 tracking-tight text-gray-900">{feature.name}</h3>
                <p className="mt-2 text-base leading-7 text-gray-600">{feature.description}</p>
                <span className="absolute bottom-4 text-sm font-medium text-indigo-600 group-hover:underline">
                  Acessar
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-xl font-semibold text-gray-900">Como funciona</h3>
          <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-lg border border-gray-200 p-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                <span className="text-xl font-bold text-indigo-600">1</span>
              </div>
              <h4 className="mt-4 text-lg font-medium text-gray-900">Cadastre seus dados</h4>
              <p className="mt-2 text-sm text-gray-500">
                Adicione seus produtos e clientes no sistema para utilizá-los na geração de etiquetas.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                <span className="text-xl font-bold text-indigo-600">2</span>
              </div>
              <h4 className="mt-4 text-lg font-medium text-gray-900">Configure suas etiquetas</h4>
              <p className="mt-2 text-sm text-gray-500">
                Personalize o tamanho, margens, fonte e outras configurações das suas etiquetas.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                <span className="text-xl font-bold text-indigo-600">3</span>
              </div>
              <h4 className="mt-4 text-lg font-medium text-gray-900">Gere e imprima</h4>
              <p className="mt-2 text-sm text-gray-500">
                Exporte suas etiquetas em PDF e imprima-as com facilidade para uso imediato.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}