'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function OrgForm({ orgId, currentName }: { orgId: string; currentName: string }) {
  const [name, setName] = useState(currentName)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('organisations').update({ name }).eq('id', orgId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <form onSubmit={save} className="flex items-center gap-3">
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
        placeholder="Agency name"
      />
      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 bg-black hover:bg-gray-800 disabled:opacity-60 text-gray-900 text-sm font-medium rounded-lg transition-colors"
      >
        {saved ? 'Saved!' : saving ? 'Saving...' : 'Save'}
      </button>
    </form>
  )
}
