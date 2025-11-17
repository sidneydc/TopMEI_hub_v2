export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      empresa: {
        Row: {
          id: string
          user_id: string
          cnpj: string | null
          razao_social: string | null
          nome_fantasia: string | null
          nome_proprietario: string | null
          cpf_proprietario: string | null
          data_nascimento: string | null
          data_abertura: string | null
          optante_simei: boolean | null
          data_opcao_simei: string | null
          cnae_principal: string | null
          descricao_cnae_principal: string | null
          status_cnpj: string | null
          cep: string | null
          rua: string | null
          numero: string | null
          complemento: string | null
          bairro: string | null
          cidade: string | null
          estado: string | null
          telefone_ddd: string | null
          telefone_numero: string | null
          email: string | null
          observacoes: string | null
          regime_tributario: string | null
          status_cadastro: string | null
          motivo_rejeicao: string | null
          criado_por: string | null
          aprovado_por: string | null
          data_cadastro: string | null
          data_aprovacao: string | null
          data_atualizacao: string | null
        }
        Insert: Omit<Database['public']['Tables']['empresa']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['empresa']['Insert']>
      }
      perfil: {
        Row: {
          id: string
          role: string | null
          ativo: boolean | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['perfil']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['perfil']['Insert']>
      }
      user_perfis: {
        Row: {
          id: string
          user_id: string | null
          perfil_id: string | null
          ativo: boolean | null
        }
        Insert: Omit<Database['public']['Tables']['user_perfis']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['user_perfis']['Insert']>
      }
      tipo_documentos: {
        Row: {
          id: string
          nome: string | null
          descricao: string | null
          obrigatorio: boolean | null
          ativo: boolean | null
        }
        Insert: Omit<Database['public']['Tables']['tipo_documentos']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['tipo_documentos']['Insert']>
      }
      documentos: {
        Row: {
          id: string
          empresa_id: string | null
          tipo_documento_id: string | null
          nome_arquivo: string | null
          caminho_storage: string | null
          tamanho_bytes: number | null
          mime_type: string | null
          status: string | null
          motivo_rejeicao: string | null
          enviado_por: string | null
          analisado_por: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['documentos']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['documentos']['Insert']>
      }
      servicos: {
        Row: {
          id: string
          nome: string | null
          descricao: string | null
          valor: number | null
          desconto: number | null
          ativo: boolean | null
        }
        Insert: Omit<Database['public']['Tables']['servicos']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['servicos']['Insert']>
      }
      planos: {
        Row: {
          id: string
          tipo: string | null
          nome: string | null
          descrição: string | null
          valor: number | null
          recursos: Json | null
          recorrencia: string | null
          ativo: boolean | null
        }
        Insert: Omit<Database['public']['Tables']['planos']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['planos']['Insert']>
      }
      empresas_planos: {
        Row: {
          id: string
          empresa_id: string | null
          plano_id: string | null
          valor: number | null
          status: string | null
          vigencia_inicio: string | null
          vigencia_fim: string | null
        }
        Insert: Omit<Database['public']['Tables']['empresas_planos']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['empresas_planos']['Insert']>
      }
      empresa_servicos: {
        Row: {
          id: string
          empresa_id: string | null
          servicos_id: string | null
          data_contratacao: string | null
          valor: number | null
          status: string | null
          observacao: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['empresa_servicos']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['empresa_servicos']['Insert']>
      }
      cobranca_plano: {
        Row: {
          id: string
          user_id: string | null
          empresa_plano_id: string | null
          competencia: string | null
          valor: number | null
          desconto: number | null
          vencimento: string | null
          status: string | null
          data_pagamento: string | null
          transacao_id: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['cobranca_plano']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['cobranca_plano']['Insert']>
      }
      cobranca_servicos: {
        Row: {
          id: string
          empresa_servico_id: string | null
          user_id: string | null
          descricao: string | null
          valor: number | null
          desconto: number | null
          vencimento: string | null
          status: string | null
          data_pagamento: string | null
          transacao_id: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['cobranca_servicos']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['cobranca_servicos']['Insert']>
      }
      certificados_digitais: {
        Row: {
          id: string
          empresa_id: string
          user_id: string
          certificado_url: string
          certificado_senha: string
          data_validade: string | null
          ativo: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['certificados_digitais']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['certificados_digitais']['Insert']>
      }
      nfse: {
        Row: {
          id: string
          empresa_id: string
          user_id: string
          numero_rps: string | null
          serie_rps: string | null
          data_emissao: string | null
          data_competencia: string
          tomador_cpf_cnpj: string
          tomador_nome: string
          tomador_email: string | null
          tomador_telefone: string | null
          tomador_endereco: string | null
          tomador_numero: string | null
          tomador_complemento: string | null
          tomador_bairro: string | null
          tomador_cidade: string | null
          tomador_uf: string | null
          tomador_cep: string | null
          descricao_servicos: string
          valor_servicos: number
          aliquota_iss: number | null
          valor_iss: number | null
          valor_deducoes: number | null
          valor_pis: number | null
          valor_cofins: number | null
          valor_inss: number | null
          valor_ir: number | null
          valor_csll: number | null
          valor_outras_retencoes: number | null
          valor_liquido: number | null
          item_lista_servico: string | null
          codigo_tributacao_municipio: string | null
          status: string | null
          numero_nfse: string | null
          codigo_verificacao: string | null
          data_emissao_nfse: string | null
          xml_url: string | null
          pdf_url: string | null
          observacoes: string | null
          erro_mensagem: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['nfse']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['nfse']['Insert']>
      }
      orcamento: {
        Row: {
          id: string
          empresa_id: string | null
          user_id: string | null
          razao_social: string | null
          nome_fantasia: string | null
          cnpj: string | null
          email: string | null
          telefone_wpp: string | null
          site: string | null
          rua: string | null
          numero: string | null
          bairro: string | null
          cidade: string | null
          slogan: string | null
          logo_url: string | null
          introducao: string | null
          observacoes_importantes: string | null
          quem_somos: string | null
          template: string | null
          num_orc: number | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['orcamento']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['orcamento']['Insert']>
      }
      templates_orcamento: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          imagem_url: string | null
          html_code: string | null
          ativo: boolean | null
          ordem: number | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['templates_orcamento']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['templates_orcamento']['Insert']>
      }
      cnaes_secundarios: {
        Row: {
          id: string
          empresa_id: string | null
          cnae_num: string | null
          cnae_descricao: string | null
          ativo: boolean | null
        }
        Insert: Omit<Database['public']['Tables']['cnaes_secundarios']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['cnaes_secundarios']['Insert']>
      }
      inscricoes: {
        Row: {
          id: string
          empresa_id: string | null
          tipo: string | null
          numero: string | null
          estado: string | null
          cidade: string | null
          ativa: boolean | null
        }
        Insert: Omit<Database['public']['Tables']['inscricoes']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['inscricoes']['Insert']>
      }
      notificacao: {
        Row: {
          id: string
          user_id: string | null
          created_at: string | null
          titulo: string | null
          mensagem: string | null
          visualizado: boolean | null
          dt_visualizacao: string | null
          lida: boolean | null
          data_leitura: string | null
          link: string | null
          tipo: string | null
        }
        Insert: Omit<Database['public']['Tables']['notificacao']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['notificacao']['Insert']>
      }
      auditoria: {
        Row: {
          id: string
          user_id: string | null
          empresa_id: string | null
          tabela: string | null
          acao: string | null
          registro_id: string | null
          dados_anteriores: Json | null
          dados_novos: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['auditoria']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['auditoria']['Insert']>
      }
    }
  }
}

// User roles
export type UserRole = 'cliente' | 'contador' | 'administrador'

// Helper types
export type Empresa = Database['public']['Tables']['empresa']['Row']
export type Perfil = Database['public']['Tables']['perfil']['Row']
export type UserPerfil = Database['public']['Tables']['user_perfis']['Row']
export type Documento = Database['public']['Tables']['documentos']['Row']
export type TipoDocumento = Database['public']['Tables']['tipo_documentos']['Row']
export type Servico = Database['public']['Tables']['servicos']['Row']
export type Plano = Database['public']['Tables']['planos']['Row']
export type EmpresaPlano = Database['public']['Tables']['empresas_planos']['Row']
export type EmpresaServico = Database['public']['Tables']['empresa_servicos']['Row']
export type CobrancaPlano = Database['public']['Tables']['cobranca_plano']['Row']
export type CobrancaServico = Database['public']['Tables']['cobranca_servicos']['Row']
export type NFSe = Database['public']['Tables']['nfse']['Row']
export type CertificadoDigital = Database['public']['Tables']['certificados_digitais']['Row']
export type Orcamento = Database['public']['Tables']['orcamento']['Row']
export type TemplateOrcamento = Database['public']['Tables']['templates_orcamento']['Row']
export type CnaeSecundario = Database['public']['Tables']['cnaes_secundarios']['Row']
export type Inscricao = Database['public']['Tables']['inscricoes']['Row']
export type Notificacao = Database['public']['Tables']['notificacao']['Row']
export type Auditoria = Database['public']['Tables']['auditoria']['Row']

// Interfaces para uso nas páginas
export interface NFSeComEmpresa extends NFSe {
  empresa?: Empresa
}

export interface CertificadoDigitalComEmpresa extends CertificadoDigital {
  empresa?: Empresa
}
