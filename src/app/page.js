export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <div className="max-w-xl text-center">
        <h1 className="text-5xl font-bold mb-4">
          Ultrle AI
        </h1>
        <p className="text-x1 text-gray-400 mb-4">
          Upload your lecture slides. Get a personalised study plan, summaries, and practice questions in minutes.
        </p>
        <p className="text-sm text-gray-600 mb-8">
          Built for students.
        </p>
        <a href="/upload" className="bg-white text-black font-semibold px-8 py-3 rounded-full hover:bg-gray-200">
          Get Started Free
        </a>
      </div>
    </main>
  );
}