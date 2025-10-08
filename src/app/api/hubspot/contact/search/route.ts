import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const hubspotToken = process.env.HUBSPOT_ACCESS_TOKEN

    if (!hubspotToken) {
      console.warn('HUBSPOT_ACCESS_TOKEN not configured')
      return NextResponse.json(
        { error: 'HubSpot not configured' },
        { status: 500 }
      )
    }

    // Search for contact by email using HubSpot CRM API
    const searchResponse = await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts/search`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hubspotToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'email',
                  operator: 'EQ',
                  value: email.toLowerCase(),
                },
              ],
            },
          ],
        }),
      }
    )

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text()
      console.error('HubSpot search error:', searchResponse.status, errorText)
      return NextResponse.json(
        { error: 'Failed to search contact' },
        { status: searchResponse.status }
      )
    }

    const searchData = await searchResponse.json()

    if (searchData.results && searchData.results.length > 0) {
      // Return the first matching contact's ID
      const contactId = searchData.results[0].id
      return NextResponse.json({ contactId })
    } else {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('Contact search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
