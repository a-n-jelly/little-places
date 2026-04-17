import { supabase } from './supabase'

/**
 * Fetch all places, optionally filtered by stages and child_friendly_features tags.
 */
export async function getPlaces({ stages = [], child_friendly_features = [] } = {}) {
  let query = supabase
    .from('places')
    .select('*')
    .order('created_at', { ascending: false })

  if (stages.length > 0) {
    query = query.overlaps('stages', stages)
  }

  if (child_friendly_features.length > 0) {
    query = query.contains('child_friendly_features', child_friendly_features)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

/**
 * Search places by keyword across name, description, type, and tags.
 */
export async function searchPlaces(keyword) {
  if (!keyword?.trim()) return getPlaces()

  const { data, error } = await supabase
    .from('places')
    .select('*')
    .or(
      `name.ilike.%${keyword}%,description.ilike.%${keyword}%,type.ilike.%${keyword}%`
    )
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Submit a new place. Embedding is handled by background job.
 */
export async function submitPlace(place) {
  const { data, error } = await supabase
    .from('places')
    .insert([
      {
        ...place,
        embedding_status: 'pending',
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Fetch a single place by ID.
 */
export async function getPlaceById(id) {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}
