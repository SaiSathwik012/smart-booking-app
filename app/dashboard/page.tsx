"use client"
export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import {
  BookmarkIcon,
  TrashIcon,
  LinkIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline"
import { Toaster, toast } from "react-hot-toast"

type Bookmark = {
  id: string
  title: string
  url: string
  user_id: string
  created_at?: string
}

type BookmarkInsert = {
  title: string
  url: string
  user_id: string
}

type AuthUser = {
  id: string
  email?: string | null
}

export default function Dashboard() {
  const router = useRouter()
  const supabase = getSupabaseClient()

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [user, setUser] = useState<AuthUser | null>(null)
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    const loadData = async () => {
      const { data } = await supabase.auth.getUser()
      const currentUser = data.user

      if (!currentUser) {
        router.replace("/")
        return
      }

      setUser({
        id: currentUser.id,
        email: currentUser.email,
      })

      const { data: bookmarksData, error } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })

      if (error) toast.error("Failed to load bookmarks")

      setBookmarks((bookmarksData as Bookmark[]) || [])
      setLoading(false)

      channel = supabase
        .channel("bookmarks-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookmarks",
            filter: `user_id=eq.${currentUser.id}`,
          },
          async () => {
            const { data } = await supabase
              .from("bookmarks")
              .select("*")
              .eq("user_id", currentUser.id)
              .order("created_at", { ascending: false })

            setBookmarks((data as Bookmark[]) || [])
          }
        )
        .subscribe()
    }

    loadData()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace("/")
  }

  const addBookmark = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!user || !title.trim() || !url.trim()) {
      toast.error("Please fill in both fields")
      return
    }

    let formattedUrl = url
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      formattedUrl = `https://${url}`
    }

    setSubmitting(true)

    const newBookmark: BookmarkInsert = {
      title: title.trim(),
      url: formattedUrl,
      user_id: user.id,
    }

    const { error } = await supabase
      .from("bookmarks")
      .insert([newBookmark])

    if (error) {
      toast.error("Failed to add bookmark")
    } else {
      toast.success("Bookmark added")
      setTitle("")
      setUrl("")
    }

    setSubmitting(false)
  }

  const deleteBookmark = async (id: string, bookmarkTitle: string) => {
    if (!confirm(`Delete "${bookmarkTitle}"?`)) return

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id)

    if (error) toast.error("Failed to delete bookmark")
    else toast.success("Bookmark deleted")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Toaster position="top-right" />

      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookmarkIcon className="w-5 h-5 text-slate-900" />
            <h1 className="text-xl font-semibold text-slate-900">
              Smart Bookmark App
            </h1>
          </div>

          <button
            onClick={handleSignOut}
            className="text-sm text-slate-600 hover:text-slate-900 transition"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
        <form onSubmit={addBookmark}>
          <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col gap-4 sm:flex-row">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-md"
            />

            <div className="relative flex-1">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-md"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-slate-900 text-white px-6 py-2 rounded-md"
            >
              {submitting ? "Adding..." : "Add"}
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-3">
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="bg-white border border-slate-200 rounded-lg px-5 py-4 flex justify-between items-center"
            >
              <div className="flex-1 min-w-0">
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-slate-900 hover:underline truncate flex items-center gap-1"
                >
                  {bookmark.title}
                  <ArrowTopRightOnSquareIcon className="w-4 h-4 text-slate-400 shrink-0" />
                </a>
                <p className="text-sm text-slate-500 truncate">
                  {bookmark.url.replace(/^https?:\/\//, "")}
                </p>
              </div>

              <button
                onClick={() =>
                  deleteBookmark(bookmark.id, bookmark.title)
                }
                className="p-2 hover:bg-slate-100 rounded-md"
              >
                <TrashIcon className="w-4 h-4 text-slate-500 hover:text-red-500 transition" />
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
