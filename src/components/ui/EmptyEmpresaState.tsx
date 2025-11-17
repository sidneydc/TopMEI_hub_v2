import { Building2 } from 'lucide-react'

export function EmptyEmpresaState() {
  return (
    <div className="bg-white rounded-lg shadow-md p-8 text-center">
      <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Nenhuma empresa cadastrada
      </h2>
      <p className="text-gray-600 mb-4">
        Você ainda não tem empresas cadastradas no sistema.
      </p>
      <a
        href="/empresa"
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
      >
        <Building2 className="w-5 h-5" />
        Cadastrar Empresa
      </a>
    </div>
  )
}
