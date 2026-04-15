'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserPlus } from 'lucide-react'

export default function InviteForm({ orgId, invitedBy }: { orgId: string; invitedBy: string }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'member' | 'client'>('member')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  async function invite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.from('invitations').insert({
      organisation_id: orgId,
      invited_by: invitedBy,
      email,
      role,
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setEmail('')
      setTimeout(() => setSuccess(false), 3000)
    }
    setLoading(false)
  }

  return (
    <div>
      {error && <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
      {success && <div className="mb-3 p-2.5 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">Invitation created! Share the invite link with them.</div>}

      <form onSubmit={invite} className="flex items-center gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="colleague@agency.com"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <select
          value={role}
          onChange={e => setRole(e.target.value as 'member' | 'client')}
          className="px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
        >
          <option value="member">Member</option>
          <option value="client">Client</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
        >
          <UserPlus size={14} />
          {loading ? '...' : 'Invite'}
        </button>
      </form>
    </div>
  )
}
