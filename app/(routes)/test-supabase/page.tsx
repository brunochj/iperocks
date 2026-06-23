'use client'

import { useEffect, useState } from 'react'

export default function TestSupabase() {
  const [status, setStatus] = useState('Carregando...')
  const [data, setData] = useState(null)

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Testa se as variáveis estão definidas
    if (!supabaseUrl || !supabaseKey) {
      setStatus('❌ Variáveis de ambiente não definidas!')
      return
    }

    // Faz uma requisição direta para o Supabase (sem o cliente)
    fetch(`${supabaseUrl}/rest/v1/sectors?limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        setStatus('✅ Conexão OK!')
        setData(data)
      })
      .catch(err => {
        setStatus(`❌ Erro: ${err.message}`)
      })
  }, [])

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Teste Supabase</h1>
      <p><strong>Status:</strong> {status}</p>
      {data && (
        <pre className="bg-gray-100 p-4 rounded mt-4 text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
      <div className="mt-4 text-sm text-gray-500">
        <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
        <p>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20)}...</p>
      </div>
    </div>
  )
}