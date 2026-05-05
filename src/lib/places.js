import { supabase } from './supabase'

const PLACE_FIELDS = 'id, name, type, address, description, stages, child_friendly_features, lat, lng, created_at'

export async function getPlaces() {
  const { data, error } = await supabase
    .from('places')
    .select(PLACE_FIELDS)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function submitPlace(place) {
  const { data, error } = await supabase
    .from('places')
    .insert([{ ...place, created_at: new Date().toISOString() }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function submitTip(placeId, tipText, displayName) {
  const { data, error } = await supabase
    .from('tips')
    .insert([{ place_id: placeId, tip_text: tipText, display_name: displayName || null }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getTipsForPlace(placeId) {
  const { data, error } = await supabase
    .from('tips')
    .select('id, tip_text, display_name, created_at')
    .eq('place_id', placeId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getPlaceById(id) {
  const { data, error } = await supabase
    .from('places')
    .select(PLACE_FIELDS)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}
