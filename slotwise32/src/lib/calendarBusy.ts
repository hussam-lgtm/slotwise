export interface BusyBlock {
  start: string
  end: string
}

export async function getGoogleBusyTimes(
  accessToken: string,
  calendarId: string,
  dateStart: string,
  dateEnd: string
): Promise<BusyBlock[]> {
  try {
    const res = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timeMin: dateStart,
        timeMax: dateEnd,
        items: [{ id: calendarId || 'primary' }],
      }),
    })

    if (!res.ok) return []
    const data = await res.json()
    const busy = data.calendars?.[calendarId || 'primary']?.busy ?? []
    return busy.map((b: any) => ({ start: b.start, end: b.end }))
  } catch {
    return []
  }
}

export async function getMicrosoftBusyTimes(
  accessToken: string,
  dateStart: string,
  dateEnd: string
): Promise<BusyBlock[]> {
  try {
    const res = await fetch('https://graph.microsoft.com/v1.0/me/calendarView?' + new URLSearchParams({
      startDateTime: dateStart,
      endDateTime: dateEnd,
      $select: 'start,end,showAs',
      $top: '100',
    }), {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) return []
    const data = await res.json()
    return (data.value ?? [])
      .filter((e: any) => e.showAs !== 'free')
      .map((e: any) => ({
        start: e.start.dateTime + 'Z',
        end: e.end.dateTime + 'Z',
      }))
  } catch {
    return []
  }
}
