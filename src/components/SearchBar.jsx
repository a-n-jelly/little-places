export default function SearchBar({ value, onChange }) {
  return (
    <div className="relative" data-testid="search-bar">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder='Search places… e.g. "soft play" or "café with nursing room"'
        aria-label="Search places"
        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
      />
    </div>
  )
}
