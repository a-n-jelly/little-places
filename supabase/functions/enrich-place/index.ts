// Edge function: enrich-place
// Called fire-and-forget from SubmitPlaceForm after a new place is saved.
// Fetches the place + its tips, calls Gemini 2.0 Flash with Google Search grounding,
// and writes description + child_friendly_features back to the places table.

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {
    const { place_id, feature_vocab } = await req.json()

    if (!place_id) {
      return new Response(JSON.stringify({ error: 'place_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch place
    const placeRes = await fetch(
      `${supabaseUrl}/rest/v1/places?id=eq.${place_id}&select=id,name,type,address,child_friendly_features`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    )
    const places = await placeRes.json()
    if (!places.length) {
      return new Response(JSON.stringify({ error: 'place not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const place = places[0]

    // Fetch tips
    const tipsRes = await fetch(
      `${supabaseUrl}/rest/v1/tips?place_id=eq.${place_id}&select=tip_text&order=created_at.desc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    )
    const tips: { tip_text: string }[] = await tipsRes.json()

    const vocab: string[] = Array.isArray(feature_vocab) ? feature_vocab : []

    const prompt = `You are helping a parent-focused Seattle family directory. Given this place, return JSON with two fields:

1. "description": 2–3 sentences. First describe what the place is and what it offers. Then explain specifically why it is good for families and kids.
2. "child_friendly_features": an array of features from this list that apply: [${vocab.join(', ')}]

Place: ${place.name} (${place.type})${place.address ? ` at ${place.address}` : ''}
${tips.length ? `Community tips:\n${tips.map((t) => `- ${t.tip_text}`).join('\n')}` : '(No tips yet — use Google Search to find real details about this place.)'}

Return only valid JSON with keys "description" and "child_friendly_features". No markdown, no extra text.`

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tools: [{ google_search: {} }],
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {},
        }),
      }
    )

    const geminiData = await geminiRes.json()

    if (!geminiRes.ok) {
      console.error('Gemini error:', JSON.stringify(geminiData))
      return new Response(JSON.stringify({ error: 'Gemini request failed' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const cleanText = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    let parsed: { description?: string; child_friendly_features?: string[] }
    try {
      parsed = JSON.parse(cleanText)
    } catch {
      console.error('Failed to parse Gemini response:', cleanText)
      return new Response(JSON.stringify({ error: 'invalid Gemini response' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const existingFeatures: string[] = place.child_friendly_features ?? []
    const derivedFeatures: string[] = parsed.child_friendly_features ?? []
    const mergedFeatures = [...new Set([...existingFeatures, ...derivedFeatures])]

    await fetch(`${supabaseUrl}/rest/v1/places?id=eq.${place_id}`, {
      method: 'PATCH',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        description: parsed.description ?? null,
        child_friendly_features: mergedFeatures,
      }),
    })

    return new Response(
      JSON.stringify({ ok: true, description: parsed.description, features: mergedFeatures }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('enrich-place error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
