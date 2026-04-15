import { useState, useEffect, useMemo } from 'react'
import { getPlaces, searchPlaces } from '../lib/places'

export function usePlaces() {
  const [allPlaces, setAllPlaces]         = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)
  const [search, setSearch]               = useState('')
  const [selectedStages, setSelectedStages]   = useState([])
  const [selectedAccess, setSelectedAccess]   = useState([])
  const [selectedTypes, setSelectedTypes]     = useState([])

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const data = await getPlaces()
      setAllPlaces(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Load all places on mount
  useEffect(() => {
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Client-side filtering
  const filtered = useMemo(() => {
    let results = allPlaces

    if (search.trim()) {
      const q = search.toLowerCase()
      results = results.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.type?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      )
    }

    if (selectedStages.length > 0) {
      results = results.filter((p) =>
        selectedStages.some((s) => p.stages?.includes(s))
      )
    }

    if (selectedAccess.length > 0) {
      results = results.filter((p) =>
        selectedAccess.every((a) => p.accessibility?.includes(a))
      )
    }

    if (selectedTypes.length > 0) {
      results = results.filter((p) => selectedTypes.includes(p.type))
    }

    return results
  }, [allPlaces, search, selectedStages, selectedAccess, selectedTypes])

  function toggleStage(id) {
    setSelectedStages((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  function toggleAccess(id) {
    setSelectedAccess((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  function toggleType(type) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  function addPlace(place) {
    setAllPlaces((prev) => [place, ...prev])
  }

  return {
    places: filtered,
    allPlaces,
    loading,
    error,
    load,
    search,
    setSearch,
    selectedStages,
    selectedAccess,
    selectedTypes,
    toggleStage,
    toggleAccess,
    toggleType,
    addPlace,
  }
}
