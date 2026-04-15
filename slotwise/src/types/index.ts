export type Role = 'admin' | 'member' | 'client'
export type CalendarProvider = 'google' | 'microsoft'
export type BookingStatus = 'confirmed' | 'cancelled' | 'rescheduled'

export interface Organisation {
  id: string
  name: string
  slug: string
  logo_url?: string
  created_at: string
}

export interface User {
  id: string
  organisation_id?: string
  role: Role
  full_name?: string
  avatar_url?: string
  created_at: string
}

export interface Client {
  id: string
  organisation_id: string
  user_id?: string
  name: string
  email?: string
  company?: string
  avatar_url?: string
  notes?: string
  created_at: string
}

export interface CalendarConnection {
  id: string
  client_id: string
  provider: CalendarProvider
  access_token: string
  refresh_token?: string
  token_expiry?: string
  calendar_id?: string
  created_at: string
  updated_at: string
}

export type WeekdayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
export type TimeSlot = { start: string; end: string }   // e.g. "09:00", "17:00"
export type Availability = Partial<Record<WeekdayKey, TimeSlot[]>>

export interface BookingLink {
  id: string
  client_id: string
  created_by: string
  name: string
  slug: string
  description?: string
  duration_mins: number
  buffer_before: number
  buffer_after: number
  timezone: string
  availability?: Availability
  is_active: boolean
  max_bookings_per_day?: number
  created_at: string
  updated_at: string
  // joined
  client?: Client
}

export interface Booking {
  id: string
  booking_link_id: string
  booker_name: string
  booker_email: string
  starts_at: string
  ends_at: string
  timezone: string
  status: BookingStatus
  calendar_event_id?: string
  notes?: string
  created_at: string
  // joined
  booking_link?: BookingLink
}

export interface Invitation {
  id: string
  organisation_id: string
  invited_by: string
  email: string
  role: Role
  client_id?: string
  token: string
  accepted_at?: string
  expires_at: string
  created_at: string
}
