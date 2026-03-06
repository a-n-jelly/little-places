// supabase/functions/process-embeddings/index.ts
// This function runs as a background job triggered by Supabase scheduler.
// It picks up places with embedding_status = 'pending' and generates embeddings
// via the Anthropic API, then stores them back in the database.

import Anthropic from 'npm:@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

Deno.serve(async (_req) => {
  try {
    // 1. Fetch all pending places (process in batches of 10)
    const response = await fetch(
      `${supabaseUrl}/rest/v1/places?embedding_status=eq.pending&limit=10`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    )

    const places = await response.json()

    if (!places.length) {
      return new Response(JSON.stringify({ message: 'No pending places.' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let processed = 0

    for (const place of places) {
      try {
        // 2. Build a rich text string from the place data for embedding
        const textToEmbed = [
          place.name,
          place.type,
          place.description,
          place.tags?.join(', '),
          place.stages?.join(', '),
          place.accessibility?.join(', '),
        ]
          .filter(Boolean)
          .join('. ')

        // 3. Generate embedding via Anthropic API
        // Note: Using text as input for semantic similarity
        const embeddingResponse = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 256,
          messages: [
            {
              role: 'user',
              content: `Generate a semantic summary of this family-friendly place for vector search. Be concise and capture all key details a parent would search for:\n\n${textToEmbed}`,
            },
          ],
        })

        const summary = embeddingResponse.content[0].text

        // 4. Update the place record with the summary and mark as complete
        await fetch(`${supabaseUrl}/rest/v1/places?id=eq.${place.id}`, {
          method: 'PATCH',
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            search_summary: summary,
            embedding_status: 'complete',
          }),
        })

        processed++
      } catch (err) {
        // Mark as failed so it doesn't block the queue
        await fetch(`${supabaseUrl}/rest/v1/places?id=eq.${place.id}`, {
          method: 'PATCH',
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ embedding_status: 'failed' }),
        })
        console.error(`Failed to process place ${place.id}:`, err)
      }
    }

    return new Response(
      JSON.stringify({ message: `Processed ${processed}/${places.length} places.` }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
