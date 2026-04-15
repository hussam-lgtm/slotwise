import { createClient } from '@/lib/supabase/server'
import InviteForm from '@/components/dashboard/InviteForm'
import OrgForm from '@/components/dashboard/OrgForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('*, organisations(*)')
    .eq('id', user!.id)
    .single()

  const { data: teamMembers } = await supabase
    .from('users')
    .select('id, full_name, role, created_at')
    .eq('organisation_id', profile?.organisation_id ?? '')
    .order('created_at')

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>

      {/* Organisation */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-medium text-gray-900 mb-4">Organisation</h2>
          <OrgForm
            orgId={profile?.organisation_id ?? ''}
            currentName={(profile?.organisations as any)?.name ?? ''}
          />
        </div>
      )}

      {/* Team */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-medium text-gray-900 mb-1">Team members</h2>
          <p className="text-xs text-gray-500 mb-4">Invite colleagues to manage clients and booking links.</p>

          {/* Current members */}
          <div className="divide-y divide-gray-100 mb-4">
            {teamMembers?.map(m => (
              <div key={m.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-xs font-semibold text-violet-700">
                    {m.full_name?.[0] ?? '?'}
                  </div>
                  <p className="text-sm text-gray-900">{m.full_name ?? 'Unknown'}</p>
                </div>
                <span className="text-xs capitalize text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {m.role}
                </span>
              </div>
            ))}
          </div>

          <InviteForm orgId={profile?.organisation_id ?? ''} invitedBy={user!.id} />
        </div>
      )}

      {/* Account */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-medium text-gray-900 mb-4">Your account</h2>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span className="text-gray-900">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Role</span>
            <span className="capitalize text-gray-900">{profile?.role}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
