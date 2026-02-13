"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
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
  created_at: string
}

export default function Dashboard(): JSX.Element {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [title, setTitle] = useState<string>("")
  const [url, setUrl] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)

  const router = useRouter()

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    const loadData = async (): Promise<void> => {
      const { data } = await supabase.auth.getUser()
      const currentUser = data.user

      if (!currentUser) {
        router.replace("/")
        return
      }

      setUser({
        id: currentUser.id,
        email: currentUser.email ?? undefined,
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
  }, [router])

  const handleSignOut = async (): Promise<void> => {
    await supabase.auth.signOut()
    router.replace("/") // ensures no back navigation
  }

  const addBookmark = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
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

    const { error } = await supabase.from("bookmarks").insert([
      {
        title: title.trim(),
        url: formattedUrl,
        user_id: user.id,
      },
    ])

    if (error) {
      toast.error("Failed to add bookmark")
    } else {
      toast.success("Bookmark added")
      setTitle("")
      setUrl("")
    }

    setSubmitting(false)
  }

  const deleteBookmark = async (
    id: string,
    bookmarkTitle: string
  ): Promise<void> => {
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-600">Loading bookmarks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookmarkIcon className="w-5 h-5 text-slate-900" />
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
              Smart Bookmark App
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-sm text-slate-500 truncate max-w-[180px]">
              {user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="text-sm text-slate-600 hover:text-slate-900 transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-10">
        {/* Add Bookmark */}
        <form onSubmit={addBookmark} className="w-full">
          <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 flex flex-col gap-5">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
              Add Bookmark
            </h2>

            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTitle(e.target.value)
                }
                disabled={submitting}
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              />

              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUrl(e.target.value)
                  }
                  disabled={submitting}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-6 py-2.5 rounded-md transition whitespace-nowrap"
              >
                {submitting ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        </form>

        {/* Collection */}
        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
              Your Collection
            </h2>
            <span className="text-sm text-slate-500">
              {bookmarks.length} total
            </span>
          </div>

          {bookmarks.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium text-slate-900">
                Nothing saved yet
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                Add your first bookmark to start building your collection.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {bookmarks.map((bookmark: Bookmark) => (
                <div
                  key={bookmark.id}
                  className="bg-white border border-slate-200 rounded-lg px-4 sm:px-5 py-4 hover:border-slate-300 hover:-translate-y-[1px] transition-all duration-150 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0 border-l-2 border-slate-900 pl-4">
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-slate-900 hover:underline flex items-center gap-1 truncate"
                    >
                      {bookmark.title}
                      <ArrowTopRightOnSquareIcon className="w-4 h-4 text-slate-400 shrink-0" />
                    </a>

                    <p className="text-sm text-slate-500 truncate mt-1">
                      {bookmark.url.replace(/^https?:\/\//, "")}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      deleteBookmark(bookmark.id, bookmark.title)
                    }
                    className="p-2 hover:bg-slate-100 rounded-md transition shrink-0"
                  >
                    <TrashIcon className="w-4 h-4 text-slate-500 hover:text-red-500 transition" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
