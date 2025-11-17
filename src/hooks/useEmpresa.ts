import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Empresa } from '@/types/database.types'

export function useEmpresa(userId: string | undefined) {
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchEmpresa = async () => {
      try {
        const { data, error } = await supabase
          .from('empresa')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (error) throw error
        setEmpresa(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchEmpresa()
  }, [userId])

  return { empresa, loading, error }
}

// Hook para buscar múltiplas empresas do usuário
export function useEmpresasUsuario(userId: string | undefined) {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      setEmpresas([])
      return
    }

    try {
      setLoading(true)
      console.log('Buscando empresas para userId:', userId)
      
      const { data, error } = await supabase
        .from('empresa')
        .select('*')
        .eq('user_id', userId)
        .neq('status_cadastro', 'inativo')  // Não mostrar empresas inativas
        .order('data_cadastro', { ascending: false })

      console.log('Resultado da busca:', { data, error })

      if (error) throw error
      setEmpresas(data || [])
    } catch (err: any) {
      console.error('Erro ao buscar empresas:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  return { empresas, loading, error, recarregar }
}

export function useEmpresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        const { data, error } = await supabase
          .from('empresa')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setEmpresas(data || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchEmpresas()
  }, [])

  return { empresas, loading, error }
}
