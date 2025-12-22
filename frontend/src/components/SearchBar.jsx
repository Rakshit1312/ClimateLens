export default function SearchBar({ value, onChange, onSearch }) {
  const gold = '#ffd700';
  return (
    <div className="flex gap-2 w-full">
      <input
        type="text"
        placeholder="Search city..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-2xl bg-gray-900 border border-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-500 shadow-md transition-all font-serif text-lg text-yellow-100 placeholder-yellow-200"
        style={{borderColor: gold, color: gold}}
      />
      <button
        onClick={onSearch}
        className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 rounded-2xl font-bold shadow-md transition-all text-gray-900 border border-yellow-700"
        style={{borderColor: gold}}
      >
        Search
      </button>
    </div>
  );
}
