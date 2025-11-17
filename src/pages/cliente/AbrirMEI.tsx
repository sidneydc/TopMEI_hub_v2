import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Building2, FileText, CheckCircle, User, MapPin, FileSignature } from 'lucide-react'

export function AbrirMEI() {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Abrir um MEI</h1>
          <p className="text-gray-600 mt-1">Processo completo de abertura do Microempreendedor Individual</p>
        </div>

        <Alert type="info" title="Funcionalidade em Desenvolvimento">
          Esta funcionalidade está em desenvolvimento. Em breve você poderá iniciar todo o processo
          de abertura do MEI diretamente pela plataforma TopMEI Hub.
        </Alert>

        {/* Pré-requisitos */}
        <Card title="📋 Pré-requisitos para abrir um MEI">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold">Ter mais de 18 anos</h4>
                <p className="text-sm text-gray-600">Ou ser emancipado legalmente</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold">Não ter participação em outra empresa</h4>
                <p className="text-sm text-gray-600">Como sócio, administrador ou titular</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold">Faturamento anual até R$ 81.000,00</h4>
                <p className="text-sm text-gray-600">Ou R$ 6.750,00 por mês em média</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold">Não ter mais de um empregado</h4>
                <p className="text-sm text-gray-600">Recebendo até um salário mínimo ou o piso da categoria</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold">Não ser servidor público federal</h4>
                <p className="text-sm text-gray-600">Em atividade (exceto militares e aposentados)</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Documentos Necessários */}
        <Card title="📄 Documentos Necessários">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
              <User className="w-6 h-6 text-primary-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Dados Pessoais</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• CPF</li>
                  <li>• RG ou CNH</li>
                  <li>• Título de eleitor</li>
                  <li>• Comprovante de residência</li>
                </ul>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
              <MapPin className="w-6 h-6 text-primary-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Endereço</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• CEP do local de trabalho</li>
                  <li>• Número IPTU (se houver)</li>
                  <li>• Autorização do proprietário</li>
                </ul>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
              <Building2 className="w-6 h-6 text-primary-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Atividade</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Escolher CNAE principal</li>
                  <li>• Até 15 atividades secundárias</li>
                  <li>• Descrição das atividades</li>
                </ul>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
              <FileSignature className="w-6 h-6 text-primary-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Certificado Digital</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Não é obrigatório</li>
                  <li>• Facilita o processo</li>
                  <li>• Pode usar CPF + senha</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Passo a Passo */}
        <Card title="✅ Processo de Abertura (7 Passos)">
          <div className="space-y-4">
            {[
              {
                numero: 1,
                titulo: 'Acesse o Portal do Empreendedor',
                descricao: 'Entre no site oficial gov.br/mei'
              },
              {
                numero: 2,
                titulo: 'Faça login com Gov.br',
                descricao: 'Use sua conta gov.br (CPF + senha)'
              },
              {
                numero: 3,
                titulo: 'Preencha seus dados pessoais',
                descricao: 'Informações básicas, endereço e contato'
              },
              {
                numero: 4,
                titulo: 'Escolha suas atividades',
                descricao: 'Selecione o CNAE principal e secundários'
              },
              {
                numero: 5,
                titulo: 'Defina o endereço comercial',
                descricao: 'Pode ser sua residência ou outro local'
              },
              {
                numero: 6,
                titulo: 'Revise e confirme',
                descricao: 'Verifique todos os dados antes de enviar'
              },
              {
                numero: 7,
                titulo: 'Receba seu CNPJ',
                descricao: 'Certificado de MEI emitido na hora!'
              }
            ].map((passo) => (
              <div key={passo.numero} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                  {passo.numero}
                </div>
                <div className="pt-1">
                  <h4 className="font-semibold">{passo.titulo}</h4>
                  <p className="text-sm text-gray-600">{passo.descricao}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Custos */}
        <Card title="💰 Custos Mensais do MEI">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <p className="text-gray-700 mb-4">
              O MEI paga uma contribuição mensal fixa através do DAS (Documento de Arrecadação do Simples Nacional):
            </p>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Comércio ou Indústria:</span>
                <span className="text-lg font-bold text-primary-600">R$ 67,00/mês</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Prestação de Serviços:</span>
                <span className="text-lg font-bold text-primary-600">R$ 71,00/mês</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Comércio e Serviços:</span>
                <span className="text-lg font-bold text-primary-600">R$ 72,00/mês</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              * Valores atualizados para 2024. Inclui INSS, ICMS/ISS conforme atividade.
            </p>
          </div>
        </Card>

        {/* Links Úteis */}
        <Card title="🔗 Links Oficiais">
          <div className="space-y-3">
            <a 
              href="https://www.gov.br/mei" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary-600 hover:underline"
            >
              <FileText className="w-4 h-4" />
              Portal do Empreendedor (gov.br/mei)
            </a>
            <a 
              href="https://www.gov.br/empresas-e-negocios/pt-br/empreendedor" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary-600 hover:underline"
            >
              <FileText className="w-4 h-4" />
              Guia Completo do MEI
            </a>
            <a 
              href="https://www8.receita.fazenda.gov.br/SimplesNacional/Aplicacoes/ATSPO/pgmei.app/Identificacao" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary-600 hover:underline"
            >
              <FileText className="w-4 h-4" />
              Formalização de MEI (Receita Federal)
            </a>
          </div>
        </Card>

        {/* Botão de voltar */}
        <div className="flex justify-center pt-4">
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Voltar para Minhas Empresas
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
