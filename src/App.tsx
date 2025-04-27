export default function App() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-4xl mb-8">Text Display App</h1>
      <div className="space-y-4">
        <a
          href="/lyrics"
          className="block px-6 py-3 bg-blue-600 rounded hover:bg-blue-700"
        >
          View Lyrics
        </a>
        <a
          href="/verses"
          className="block px-6 py-3 bg-blue-600 rounded hover:bg-blue-700"
        >
          View Verses
        </a>
      </div>
    </div>
  );
}