import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, firstName, lastName, email } = body

    // Validate required fields
    if (!sessionId || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // n8n session start webhook URL
    const webhookUrl = process.env.N8N_SESSION_START_WEBHOOK_URL

    if (!webhookUrl) {
      console.warn('N8N_SESSION_START_WEBHOOK_URL not configured')
      // Don't fail the request - just log the warning
      return NextResponse.json({ success: true })
    }

    // Send to n8n for HubSpot contact creation
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        firstName,
        lastName,
        email,
        timestamp: new Date().toISOString(),
        eventType: 'session_start',
      }),
    })

    if (!webhookResponse.ok) {
      console.error('Session start webhook error:', webhookResponse.status)
      // Don't fail the user's request even if webhook fails
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Conversation start API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
