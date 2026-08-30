import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'groq-api-mock',
        configureServer(server) {
          server.middlewares.use('/api/generate-review', async (req, res, next) => {
            if (req.method !== 'POST') return next()
            
            // Read body
            let bodyStr = ''
            req.on('data', chunk => bodyStr += chunk.toString())
            req.on('end', async () => {
              try {
                const body = JSON.parse(bodyStr)
                const { food, enjoyedMost, customText, service, recommend } = body

                console.log('[Review API] Request received')
                const apiKey = env.GROQ_API_KEY
                if (!apiKey) {
                  res.statusCode = 500
                  res.end(JSON.stringify({ error: 'Server misconfiguration: Missing API key' }))
                  return
                }

                const model = env.GROQ_MODEL || 'openai/gpt-oss-20b'
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
                const apiRes = await fetch(url, {
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
                
                console.log(`[Review API] Groq status: ${apiRes.status}`)

                if (!apiRes.ok) {
                  const errText = await apiRes.text()
                  console.error('Groq API Error:', errText)
                  res.statusCode = 502
                  res.end(JSON.stringify({ error: 'Failed to generate review' }))
                  return
                }

                const data = (await apiRes.json()) as any
                console.log('[Review API] Raw Groq response:', JSON.stringify(data, null, 2))
                const reviewText = data.choices?.[0]?.message?.content || ''

                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ review: reviewText.trim() }))
              } catch (e) {
                console.error('Proxy Error:', e)
                res.statusCode = 500
                res.end(JSON.stringify({ error: 'Something went wrong while creating your review. Please try again.' }))
              }
            })
          })
        }
      }
    ],
  }
})
