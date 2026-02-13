"use client"

import { supabase } from "@/lib/supabase"
import { BookmarkIcon } from "@heroicons/react/24/outline"

export default function Home() {
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-8">

          {/* Logo + Title */}
          <div className="flex items-center gap-2 mb-6">
            <BookmarkIcon className="w-6 h-6 text-slate-900" />
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Smart Bookmark App
            </h1>
          </div>

          {/* Description */}
          <p className="text-slate-600 text-sm mb-8 leading-relaxed">
            Save and organize your favorite links in one simple, clean workspace.
            Access them anywhere, anytime.
          </p>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium py-2.5 rounded-md transition"
          >
            Sign in with Google
          </button>

        </div>

        {/* Footer Text */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Secure authentication powered by Google
        </p>
      </div>
    </div>
  )
}
