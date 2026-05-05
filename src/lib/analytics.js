import posthog from 'posthog-js'

const key = import.meta.env.VITE_POSTHOG_KEY
const host = import.meta.env.VITE_POSTHOG_HOST ?? 'https://us.i.posthog.com'

export function initAnalytics() {
  if (!key) return
  posthog.init(key, {
    api_host: host,
    person_profiles: 'never',
    capture_pageview: false,
  })
}

export function track(event, props = {}) {
  if (!key) return
  posthog.capture(event, props)
}
