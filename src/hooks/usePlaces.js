import { useState, useEffect, useMemo } from 'react'
import { getPlaces } from '../lib/places'

export function usePlaces() {
  const [allPlaces, setAllPlaces] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [search, setSearch]       = useState('')

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const data = await getPlaces()
        setAllPlaces(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const places = useMemo(() => {
    if (!search.trim()) return allPlaces
    const q = search.toLowerCase()
    return allPlaces.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.type?.toLowerCase().includes(q) ||
      p.address?.toLowerCase().includes(q)
    )
  }, [allPlaces, search])

  function addPlace(place) {
    setAllPlaces(prev => [place, ...prev])
  }

  return { places, loading, error, search, setSearch, addPlace }
}
