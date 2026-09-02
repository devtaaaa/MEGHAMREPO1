import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handle } from 'hono/cloudflare-pages'

type Bindings = {
  GROQ_API_KEY: string
  GROQ_MODEL?: string
}

const app = new Hono<{ Bindings: Bindings }>().basePath('/api')

app.use('/*', cors())

app.post('/generate-review', async (c) => {
  try {
    console.log('[Review API] Request received at:', c.req.url)
    const body = await c.req.json()
    const { food, enjoyedMost, customText, service, recommend } = body

    if (!food || !enjoyedMost || !service || !recommend) {
      return c.json({ error: 'Missing required fields' }, 400)
    }

    const apiKey = c.env.GROQ_API_KEY
    if (!apiKey) {
      return c.json({ error: 'Server misconfiguration: Missing API key' }, 500)
    }

    const model = c.env.GROQ_MODEL || 'openai/gpt-oss-20b'
    const url = 'https://api.groq.com/openai/v1/chat/completions'

    const systemPrompt = `You are a review-writing assistant.

Turn genuine customer-provided feedback into a short, natural first-person Google review.
Only use information provided by the customer.
Never invent dishes, staff names, prices, offers, events, experiences or facts.
Do not fabricate a customer's experience.
Do not mention AI.
Do not make the review sound like an advertisement.
Keep it natural and approximately 30–70 words.
Return ONLY the review text.`

    const userPrompt = `Business:
MEGHAM Restaurant
Haridwar, Uttarakhand

Customer answers:
Food: ${food}
Enjoyed most: ${enjoyedMost}
Specifics: ${customText || 'None provided'}
Service: ${service}
Recommend: ${recommend}`

    console.log('[Review API] Calling Groq')
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    })
    
    console.log(`[Review API] Groq status: ${response.status}`)

    if (!response.ok) {
      const errText = await response.text()
      console.error('Groq API Error:', errText)
      return c.json({ error: 'Failed to generate review' }, 502)
    }

    console.log('[Review API] Response received')
    const data = await response.json()
    const reviewText = data.choices?.[0]?.message?.content || ''

    if (!reviewText) {
       return c.json({ error: 'Received empty response from AI' }, 500)
    }

    return c.json({ review: reviewText.trim() })

  } catch (err) {
    console.error('Worker error:', err)
    return c.json({ error: 'Something went wrong while creating your review. Please try again.' }, 500)
  }
})

export default app
export const onRequest = handle(app)
