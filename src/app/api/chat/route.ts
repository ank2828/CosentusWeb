import { NextRequest, NextResponse } from 'next/server'

// Rate limiting storage (in production, use Redis or a database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Clean up old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

function checkRateLimit(ip: string): { allowed: boolean; error?: string } {
  const now = Date.now()
  const rateKey = `chat_${ip}`
  const limit = rateLimitStore.get(rateKey)

  if (!limit || now > limit.resetTime) {
    // Reset or create new limit
    rateLimitStore.set(rateKey, { count: 1, resetTime: now + 60000 }) // 60 seconds
    return { allowed: true }
  }

  if (limit.count >= 10) {
    return { allowed: false, error: 'Too many messages. Please wait a minute.' }
  }

  limit.count++
  return { allowed: true }
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    // Check rate limit
    const rateLimitResult = checkRateLimit(ip)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { status: 429 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { message, sessionId, leadData } = body

    // Validate message
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      )
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: 'Message too long' },
        { status: 400 }
      )
    }

    // Validate sessionId
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }

    // n8n webhook URL
    const webhookUrl = process.env.N8N_WEBHOOK_URL || 'https://cosentus.app.n8n.cloud/webhook/8d3ea813-b1bb-46f6-ba02-2f62775524b8'

    if (!webhookUrl || webhookUrl === 'YOUR_WEBHOOK_URL_HERE') {
      return NextResponse.json(
        { error: 'Chatbot not configured' },
        { status: 500 }
      )
    }

    // Call n8n webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message.trim(),
        sessionId,
        leadData: leadData || null,
        timestamp: new Date().toISOString(),
        source: 'nextjs-chatbot',
        eventType: 'chat_message',
      }),
    })

    if (!webhookResponse.ok) {
      console.error('Webhook error:', webhookResponse.status, webhookResponse.statusText)
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }

    const responseText = await webhookResponse.text()
    let aiResponse = ''

    // Try to parse as JSON first
    try {
      const data = JSON.parse(responseText)

      // Handle various n8n response formats
      if (data.message) {
        aiResponse = data.message
      } else if (data.output) {
        aiResponse = data.output
      } else if (data.response) {
        aiResponse = data.response
      } else if (data.text) {
        aiResponse = data.text
      } else if (Array.isArray(data) && data.length > 0) {
        const firstItem = data[0]
        if (typeof firstItem === 'object') {
          aiResponse = firstItem.output || firstItem.message || firstItem.response || JSON.stringify(data)
        } else {
          aiResponse = String(firstItem)
        }
      } else {
        aiResponse = 'Response format not recognized'
      }
    } catch {
      // Not JSON, use raw response
      aiResponse = responseText.trim()

      // If empty, provide fallback
      if (!aiResponse) {
        aiResponse = webhookResponse.status === 200
          ? "I received your message! However, I'm having trouble generating a response right now. Please try again."
          : 'Thank you for your message. I received it successfully!'
      }
    }

    return NextResponse.json({
      message: aiResponse,
      sessionId: sessionId,
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
