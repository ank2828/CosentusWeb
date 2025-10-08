import { useState, useEffect, useRef } from 'react'

const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes in milliseconds

export interface LeadData {
  firstName: string
  lastName: string
  email: string
  hubspotContactId?: string
}

export interface ChatSession {
  sessionId: string
  lastActivityTime: number
  leadData?: LeadData
  conversationActive: boolean
}

export function useSessionManager() {
  const [session, setSession] = useState<ChatSession | null>(null)
  const [needsLeadCapture, setNeedsLeadCapture] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load or create session on mount
  useEffect(() => {
    const stored = localStorage.getItem('cosentus_chat_session')

    if (stored) {
      try {
        const parsedSession: ChatSession = JSON.parse(stored)
        const timeSinceLastActivity = Date.now() - parsedSession.lastActivityTime

        if (timeSinceLastActivity < SESSION_TIMEOUT && parsedSession.conversationActive) {
          // Session still active - resume
          setSession(parsedSession)
          setNeedsLeadCapture(false)
          startInactivityTimer()
        } else {
          // Session expired - create new
          createNewSession()
        }
      } catch (error) {
        console.error('Error parsing session:', error)
        createNewSession()
      }
    } else {
      // No session - create new
      createNewSession()
    }

    setIsLoading(false)
  }, [])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const createNewSession = () => {
    const newSession: ChatSession = {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lastActivityTime: Date.now(),
      conversationActive: true,
    }

    setSession(newSession)
    setNeedsLeadCapture(true)
    localStorage.setItem('cosentus_chat_session', JSON.stringify(newSession))
  }

  const updateActivity = () => {
    if (session) {
      const updatedSession: ChatSession = {
        ...session,
        lastActivityTime: Date.now(),
      }

      setSession(updatedSession)
      localStorage.setItem('cosentus_chat_session', JSON.stringify(updatedSession))

      // Reset inactivity timer
      resetInactivityTimer()
    }
  }

  const startInactivityTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      endSession('timeout')
    }, SESSION_TIMEOUT)
  }

  const resetInactivityTimer = () => {
    startInactivityTimer()
  }

  const endSession = async (reason: 'timeout' | 'manual', conversation?: any[]) => {
    if (session && session.conversationActive) {
      try {
        // Get conversation history from localStorage if not provided
        let conversationData = conversation
        if (!conversationData) {
          const stored = localStorage.getItem(`cosentus_messages_${session.sessionId}`)
          if (stored) {
            try {
              conversationData = JSON.parse(stored)
            } catch (e) {
              conversationData = []
            }
          }
        }

        // Calculate metadata
        const startedAt = session.lastActivityTime ? new Date(session.lastActivityTime) : new Date()
        const endedAt = new Date()
        const duration = conversationData && conversationData.length > 0
          ? Math.round((endedAt.getTime() - new Date(conversationData[0].timestamp).getTime()) / 60000)
          : 0

        // Send "conversation ended" webhook with full conversation
        await fetch('/api/conversation/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: session.sessionId,
            leadData: session.leadData,
            reason,
            conversation: conversationData || [],
            metadata: {
              messageCount: conversationData?.length || 0,
              duration: `${duration} minutes`,
              startedAt: startedAt.toISOString(),
              endedAt: endedAt.toISOString(),
            }
          }),
        })

        // Mark session as inactive
        const endedSession: ChatSession = {
          ...session,
          conversationActive: false,
        }

        localStorage.setItem('cosentus_chat_session', JSON.stringify(endedSession))
        setSession(endedSession)

        // Clear timer
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
      } catch (error) {
        console.error('Error ending session:', error)
      }
    }
  }

  const saveLeadData = async (leadData: LeadData) => {
    if (session) {
      try {
        // Send session start event to API
        await fetch('/api/conversation/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: session.sessionId,
            ...leadData,
          }),
        })

        // Update local session
        const updatedSession: ChatSession = {
          ...session,
          leadData,
          lastActivityTime: Date.now(),
        }

        setSession(updatedSession)
        localStorage.setItem('cosentus_chat_session', JSON.stringify(updatedSession))
        setNeedsLeadCapture(false)

        // Start inactivity timer after lead capture
        startInactivityTimer()
      } catch (error) {
        console.error('Error saving lead data:', error)
        throw error
      }
    }
  }

  return {
    session,
    needsLeadCapture,
    isLoading,
    updateActivity,
    saveLeadData,
    endSession,
  }
}
