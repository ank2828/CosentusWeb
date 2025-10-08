'use client'

import { useEffect, useRef, useState } from 'react'
import type { LeadData } from '@/hooks/useSessionManager'

interface HubSpotFormProps {
  onSubmit: (leadData: LeadData) => Promise<void>
  companyName?: string
}

declare global {
  interface Window {
    hbspt: any
  }
}

export default function HubSpotForm({
  onSubmit,
  companyName = 'Cosentus',
}: HubSpotFormProps) {
  const formContainerRef = useRef<HTMLDivElement>(null)
  const hasInitialized = useRef(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    console.log('Starting HubSpot form initialization...')

    // Use the exact loading method from the embed code
    const script = document.createElement('script')
    script.src = 'https://js-na2.hsforms.net/forms/embed/242934396.js'
    script.defer = true

    script.onload = () => {
      console.log('HubSpot embed script loaded')

      // Give the script time to initialize
      setTimeout(() => {
        if (formContainerRef.current) {
          console.log('Setting up form container')

          // Use HubSpot's frame-based approach
          formContainerRef.current.className = 'hs-form-frame'
          formContainerRef.current.setAttribute('data-region', 'na2')
          formContainerRef.current.setAttribute('data-form-id', '90945e4f-977b-4985-b91c-5f97be3b609b')
          formContainerRef.current.setAttribute('data-portal-id', '242934396')

          // Trigger HubSpot's form initialization
          if (window.hbspt?.forms) {
            console.log('Using hbspt.forms.create')
            window.hbspt.forms.create({
              region: 'na2',
              portalId: '242934396',
              formId: '90945e4f-977b-4985-b91c-5f97be3b609b',
              target: '#hubspot-form-container',
              onFormReady: function() {
                console.log('Form ready!')
                setIsLoading(false)
              },
              onFormSubmitted: function(data: any) {
                console.log('Form submitted!', data)
                // Extract from submission data
                const submittedData = data?.submissionValues || data?.data || {}

                if (submittedData.firstname && submittedData.lastname && submittedData.email) {
                  onSubmit({
                    firstName: submittedData.firstname,
                    lastName: submittedData.lastname,
                    email: submittedData.email,
                  })
                }
              }
            })
          } else {
            console.log('hbspt.forms not available, waiting for auto-initialization')
            setIsLoading(false)
          }
        }
      }, 500)
    }

    script.onerror = () => {
      console.error('Failed to load HubSpot script')
      setError('Failed to load form. Please refresh the page.')
      setIsLoading(false)
    }

    document.body.appendChild(script)

    return () => {
      // Cleanup is handled by HubSpot
    }
  }, [onSubmit])

  return (
    <>
      <style jsx>{`
        .hubspot-form-wrapper {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100%;
          width: 100%;
          padding: 2rem 1.5rem;
          overflow-y: auto;
        }

        .hubspot-form-title {
          font-size: 1.35rem;
          font-weight: 700;
          color: #000000;
          margin-bottom: 0.5rem;
          text-align: center;
        }

        .hubspot-form-subtitle {
          font-size: 0.9rem;
          color: #666666;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        :global(#hubspot-form-container) {
          width: 100%;
        }

        :global(.hs-form) {
          width: 100% !important;
        }

        :global(.hs-form-field) {
          margin-bottom: 1rem !important;
        }

        :global(.hs-form-field label) {
          display: none !important;
        }

        :global(.hs-input) {
          width: 100% !important;
          padding: 0.8rem 0.9rem !important;
          font-size: 0.9rem !important;
          border: 2px solid #E5E5E5 !important;
          border-radius: 10px !important;
          outline: none !important;
          transition: all 0.2s ease !important;
          font-family: inherit !important;
        }

        :global(.hs-input:focus) {
          border-color: #01B2D6 !important;
          box-shadow: 0 0 0 3px rgba(1, 178, 214, 0.1) !important;
        }

        :global(.hs-button) {
          width: 100% !important;
          padding: 0.8rem 1rem !important;
          font-size: 0.95rem !important;
          font-weight: 600 !important;
          color: #FFFFFF !important;
          background: #000000 !important;
          border: none !important;
          border-radius: 10px !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          margin-top: 0.25rem !important;
        }

        :global(.hs-button:hover) {
          background: #1a1a1a !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
        }

        :global(.hs-error-msgs) {
          color: #DC2626 !important;
          font-size: 0.85rem !important;
          margin-top: 0.25rem !important;
        }

        :global(.submitted-message) {
          display: none !important;
        }
      `}</style>

      <div className="hubspot-form-wrapper">
        <h2 className="hubspot-form-title">Before we start...</h2>
        <p className="hubspot-form-subtitle">
          Let&apos;s get to know each other
        </p>
        {error && (
          <div style={{color: '#DC2626', marginBottom: '1rem', textAlign: 'center'}}>
            {error}
          </div>
        )}
        {isLoading && (
          <div style={{color: '#666', marginBottom: '1rem', textAlign: 'center'}}>
            Loading form...
          </div>
        )}
        <div ref={formContainerRef} id="hubspot-form-container"></div>
      </div>
    </>
  )
}
