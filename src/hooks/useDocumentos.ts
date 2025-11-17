import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Documento } from '@/types/database.types'

export function useDocumentos(empresaId: string | undefined) {
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!empresaId) {
      setLoading(false)
      return
    }

    const fetchDocumentos = async () => {
      try {
        const { data, error } = await supabase
          .from('documentos')
          .select('*')
          .eq('empresa_id', empresaId)
          .order('created_at', { ascending: false })

        if (error) throw error
        setDocumentos(data || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDocumentos()
  }, [empresaId])

  return { documentos, loading, error }
}
