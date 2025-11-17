import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Notificacao } from '@/types/database.types'

export function useNotificacoes(userId: string | undefined) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchNotificacoes = async () => {
      try {
        const { data, error } = await (supabase
          .from('notificacao') as any)
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10)

        if (error) throw error
        setNotificacoes(data || [])
        // Contar apenas notificações NÃO LIDAS
        setUnreadCount(data?.filter((n: Notificacao) => !n.lida).length || 0)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchNotificacoes()

    // Subscribe to new notifications
    const subscription = supabase
      .channel('notificacoes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notificacao',
          filter: `user_id=eq.${userId}`
        }, 
        (payload) => {
          setNotificacoes(prev => [payload.new as Notificacao, ...prev])
          setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  const markAsRead = async (notificacaoId: string) => {
    try {
      const { error } = await (supabase
        .from('notificacao') as any)
        .update({ 
          lida: true, 
          data_leitura: new Date().toISOString(),
          visualizado: true, 
          dt_visualizacao: new Date().toISOString() 
        })
        .eq('id', notificacaoId)

      if (error) throw error

      setNotificacoes(prev =>
        prev.map(n =>
          n.id === notificacaoId ? { 
            ...n, 
            lida: true, 
            data_leitura: new Date().toISOString(),
            visualizado: true, 
            dt_visualizacao: new Date().toISOString() 
          } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err: any) {
      console.error('Error marking notification as read:', err)
    }
  }

  return { notificacoes, loading, error, unreadCount, markAsRead }
}
