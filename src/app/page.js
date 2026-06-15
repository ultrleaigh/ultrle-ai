export default function Home() {
  return (
    <main className="min-h-screen flex flex-col" style={{ background: "#0a0a0f", color: "white" }}>

      {/* Hero section */}
      <div className="flex flex-col items-center justify-center flex-1 px-4 py-24 text-center">

        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold" style={{ background: "#1e1530", color: "#a78bfa", border: "1px solid #3b1f6e" }}>
          ✦ AI-powered exam preparation
        </div>

        {/* Heading */}
        <h1 className="text-5xl font-bold mb-4 leading-tight" style={{ maxWidth: "600px" }}>
          Study smarter.<br />
          <span style={{ color: "#7c3aed" }}>Pass with confidence.</span>
        </h1>

        <p className="text-lg mb-3" style={{ color: "#9ca3af", maxWidth: "480px", lineHeight: "1.7" }}>
          Upload your lecture slides and Ultrle AI will teach you exactly what to focus on, then test you — all in minutes.
        </p>

        <p className="text-sm mb-10" style={{ color: "#4b5563" }}>
          Built for students at KNUST · UG · UCC · UDS · GIMPA
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          
          <a href="/signup"
            className="font-semibold px-8 py-3 rounded-full transition-all"
            style={{ background: "#7c3aed", color: "white" }}
          >
            Get Started Free
          </a>
          
          <a href="/login"
            className="font-semibold px-8 py-3 rounded-full transition-all"
            style={{ background: "#1a1a2e", color: "#a78bfa", border: "1px solid #3b1f6e" }}
          >
            Log In
          </a>
        </div>
      </div>

      {/* Features strip */}
      <div className="border-t px-4 py-12" style={{ borderColor: "#1f1f2e" }}>
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-2xl mb-2">📄</div>
            <h3 className="font-semibold mb-1 text-white">Upload your slides</h3>
            <p className="text-sm" style={{ color: "#6b7280" }}>PDF lecture notes and slides supported</p>
          </div>
          <div>
            <div className="text-2xl mb-2">🧠</div>
            <h3 className="font-semibold mb-1 text-white">AI teaches you</h3>
            <p className="text-sm" style={{ color: "#6b7280" }}>Get a full professor-style breakdown of your topics</p>
          </div>
          <div>
            <div className="text-2xl mb-2">✅</div>
            <h3 className="font-semibold mb-1 text-white">Get tested</h3>
            <p className="text-sm" style={{ color: "#6b7280" }}>MCQs and essay questions from your own notes</p>
          </div>
        </div>
      </div>

    </main>
  );
}