import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, leadData, reason, conversation, metadata } = body

    // Validate required fields
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId' },
        { status: 400 }
      )
    }

    // Format conversation as readable text for HubSpot property
    const conversationText = formatConversationText(conversation || [], metadata, reason)

    // Send to n8n webhook for HubSpot processing
    const webhookUrl = 'https://cosentus.app.n8n.cloud/webhook/11d11ca9-5093-4d03-9624-476359b36832'

    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: 'session_end',
          sessionId,
          leadData: leadData || null,
          reason: reason || 'unknown',
          timestamp: new Date().toISOString(),
          conversation: conversation || [],
          conversationText, // Pre-formatted text for HubSpot property
          metadata: metadata || {
            messageCount: 0,
            duration: '0 minutes',
            startedAt: new Date().toISOString(),
            endedAt: new Date().toISOString(),
          }
        }),
      })

      if (!webhookResponse.ok) {
        console.error('n8n webhook error:', webhookResponse.status)
      } else {
        console.log('Session end data sent to n8n successfully')
      }
    } catch (webhookError) {
      console.error('Error sending to n8n webhook:', webhookError)
      // Don't fail the request - just log the error
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Conversation end API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function formatConversationText(
  conversation: any[],
  metadata: any,
  reason: string
): string {
  let text = `=== CHAT CONVERSATION ===\n\n`
  text += `Session ended: ${reason === 'timeout' ? 'Due to inactivity' : 'Manually closed'}\n`
  text += `Duration: ${metadata?.duration || 'Unknown'}\n`
  text += `Messages: ${metadata?.messageCount || 0}\n`
  text += `Started: ${metadata?.startedAt ? new Date(metadata.startedAt).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }) : 'Unknown'}\n`
  text += `Ended: ${metadata?.endedAt ? new Date(metadata.endedAt).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }) : 'Unknown'}\n\n`
  text += `--- CONVERSATION ---\n\n`

  conversation.forEach((msg, index) => {
    const sender = msg.sender === 'user' ? 'CUSTOMER' : 'COSE AI'
    const timestamp = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }) : ''
    text += `[${timestamp}] ${sender}:\n${msg.text}\n\n`
  })

  return text
}
