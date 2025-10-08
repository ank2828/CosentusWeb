'use client'

import { useState } from 'react'
import type { LeadData } from '@/hooks/useSessionManager'

interface LeadCaptureModalProps {
  onSubmit: (leadData: LeadData) => Promise<void>
  companyName?: string
}

export default function LeadCaptureModal({
  onSubmit,
  companyName = 'Cosentus',
}: LeadCaptureModalProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleStep1Next = () => {
    if (!firstName.trim()) {
      setError('Please enter your first name')
      return
    }
    if (!lastName.trim()) {
      setError('Please enter your last name')
      return
    }
    setError('')
    setStep(2)
  }

  const handleStep2Submit = async () => {
    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      // Submit to HubSpot Forms API
      const hubspotFormData = {
        fields: [
          { name: 'firstname', value: firstName.trim() },
          { name: 'lastname', value: lastName.trim() },
          { name: 'email', value: email.trim().toLowerCase() }
        ],
        context: {
          pageUri: window.location.href,
          pageName: document.title
        }
      }

      // Submit to HubSpot form first
      let hubspotContactId: string | undefined
      try {
        const hubspotResponse = await fetch('https://api.hsforms.com/submissions/v3/integration/submit/242934396/90945e4f-977b-4985-b91c-5f97be3b609b', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(hubspotFormData)
        })

        if (hubspotResponse.ok) {
          console.log('HubSpot form submitted successfully')

          // Forms API v3 doesn't return contact ID, so we need to fetch it
          // Call our backend to search for the contact by email
          try {
            const contactSearchResponse = await fetch('/api/hubspot/contact/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: email.trim().toLowerCase() })
            })

            if (contactSearchResponse.ok) {
              const contactData = await contactSearchResponse.json()
              hubspotContactId = contactData?.contactId
              console.log('HubSpot Contact ID found:', hubspotContactId)
            }
          } catch (searchErr) {
            console.error('Error searching for contact:', searchErr)
          }
        }
      } catch (err) {
        console.error('HubSpot submission error:', err)
        // Don't block user - continue with chat even if HubSpot fails
      }

      // Continue with our session management, including HubSpot contact ID if available
      await onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        hubspotContactId,
      })
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      action()
    }
  }

  return (
    <>
      <style jsx>{`
        .lead-capture-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100%;
          width: 100%;
          padding: 2rem 1.5rem;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .lead-capture-title {
          font-size: 1.35rem;
          font-weight: 700;
          color: #000000;
          margin-bottom: 0.5rem;
          text-align: center;
        }

        .lead-capture-subtitle {
          font-size: 0.9rem;
          color: #666666;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .lead-capture-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
        }

        .lead-capture-input {
          width: 100%;
          padding: 0.8rem 0.9rem;
          font-size: 0.9rem;
          border: 2px solid #E5E5E5;
          border-radius: 10px;
          outline: none;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .lead-capture-input:focus {
          border-color: #01B2D6;
          box-shadow: 0 0 0 3px rgba(1, 178, 214, 0.1);
        }

        .lead-capture-input::placeholder {
          color: #999999;
        }

        .lead-capture-button {
          width: 100%;
          padding: 0.8rem 1rem;
          font-size: 0.95rem;
          font-weight: 600;
          color: #FFFFFF;
          background: #000000;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 0.25rem;
        }

        .lead-capture-button:hover {
          background: #1a1a1a;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .lead-capture-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .lead-capture-back {
          width: 100%;
          padding: 0.8rem 1rem;
          font-size: 0.9rem;
          font-weight: 500;
          color: #666666;
          background: transparent;
          border: 2px solid #E5E5E5;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .lead-capture-back:hover {
          border-color: #999999;
          color: #000000;
        }

        .lead-capture-error {
          color: #DC2626;
          font-size: 0.85rem;
          text-align: center;
          margin-top: -0.25rem;
        }

        .lead-capture-steps {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
        }

        .lead-capture-step {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #E5E5E5;
          transition: all 0.3s ease;
        }

        .lead-capture-step.active {
          background: #01B2D6;
          width: 24px;
          border-radius: 4px;
        }
      `}</style>

      <div className="lead-capture-container">
        <div className="lead-capture-steps">
          <div className={`lead-capture-step ${step === 1 ? 'active' : ''}`} />
          <div className={`lead-capture-step ${step === 2 ? 'active' : ''}`} />
        </div>

        {step === 1 && (
          <>
            <h2 className="lead-capture-title">Before we start...</h2>
            <p className="lead-capture-subtitle">
              Let's get to know each other
            </p>

            <div className="lead-capture-form">
              <input
                type="text"
                className="lead-capture-input"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleStep1Next)}
                autoFocus
                disabled={isSubmitting}
              />

              <input
                type="text"
                className="lead-capture-input"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleStep1Next)}
                disabled={isSubmitting}
              />

              {error && <div className="lead-capture-error">{error}</div>}

              <button
                className="lead-capture-button"
                onClick={handleStep1Next}
                disabled={isSubmitting}
              >
                Next →
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="lead-capture-title">Great! One more thing...</h2>
            <p className="lead-capture-subtitle">
              What's your email address?
            </p>

            <div className="lead-capture-form">
              <input
                type="email"
                className="lead-capture-input"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleStep2Submit)}
                autoFocus
                disabled={isSubmitting}
              />

              {error && <div className="lead-capture-error">{error}</div>}

              <button
                className="lead-capture-button"
                onClick={handleStep2Submit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Starting Chat...' : 'Start Chat'}
              </button>

              <button
                className="lead-capture-back"
                onClick={() => {
                  setStep(1)
                  setError('')
                }}
                disabled={isSubmitting}
              >
                ← Back
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
