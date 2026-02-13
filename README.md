Smart Bookmark App

A modern full stack bookmark manager built using Next.js (App Router) and Supabase.

This project was developed as part of a Fullstack/GenAI screening task to demonstrate authentication handling, database security, real-time updates, and production deployment.

Live Demo

Live URL:


Tech Stack

Frontend: Next.js (App Router)
Language: TypeScript (Strict Mode)
Backend / Database: Supabase (PostgreSQL)
Authentication: Supabase Auth (Google OAuth)
Realtime: Supabase Realtime Subscriptions
Styling: Tailwind CSS (Flex-based responsive layout)
Deployment: Vercel

Features Implemented

Google OAuth authentication (no email/password flow)

Add bookmarks (Title + URL with automatic HTTPS formatting)

Delete bookmarks

Real-time updates (no manual refresh required)

Bookmarks are private per authenticated user

Dashboard route protection

Fully responsive UI (mobile + desktop)

Live production deployment on Vercel

Strict TypeScript (no usage of any)

How It Works

Users authenticate via Google OAuth using Supabase Auth.

Supabase generates a secure session.

Each bookmark is stored in the database with the associated user_id.

All database queries filter bookmarks using the authenticated user's ID.

The dashboard checks authentication on load and redirects unauthenticated users.

A real-time subscription listens for database changes and updates the UI instantly.

The app is deployed on Vercel with secure environment variables.

Users can only access and manage their own bookmarks.

Database Structure

Table: bookmarks

Column	Type	Description
id	uuid	Primary Key
title	text	Bookmark title
url	text	Bookmark URL
user_id	uuid	Linked to authenticated user
created_at	timestamp	Creation time

Row Level Security (RLS) ensures that users can only access their own bookmarks.

Route Protection Strategy

The dashboard verifies authentication on mount:

const { data } = await supabase.auth.getUser()


If no session exists:

router.replace("/")


On sign out:

Session is cleared

User is redirected to the homepage

Back navigation to the dashboard is prevented

Responsive UI Design

Flex-based layout

Mobile-first design

Form stacks vertically on small screens

Horizontal layout on larger screens

Proper truncation for long URLs

Clean SaaS-style interface

Real-Time Updates

Supabase Realtime channel listens to database changes:

supabase
  .channel("bookmarks-changes")
  .on("postgres_changes", ...)


Whenever a bookmark is added or deleted:

The UI updates instantly

No page refresh is required

Challenges Faced and Solutions
1. Google OAuth Redirect Issues (Localhost vs Production)

Authentication worked locally but failed in production.

Root Cause:

Incorrect redirect URLs

Supabase site URL misconfiguration

Google Cloud OAuth settings mismatch

Solution:

Updated Supabase Site URL to the Vercel production domain

Added production domain in Google Cloud OAuth settings

Configured correct callback URLs

Updated redirectTo dynamically using window.location.origin

2. Environment Variables Not Working on Vercel

After deployment, Supabase connection failed.

Root Cause:
Environment variables were not configured in Vercel.

Solution:
Added the following environment variables in Vercel:

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY


Then redeployed the application.

3. Dashboard Route Was Publicly Accessible

Users could manually enter /dashboard in the browser.

Solution:

Checked authentication inside useEffect

Redirected unauthenticated users to the homepage

Used router.replace() to prevent history navigation

4. OAuth Redirecting to Root Instead of Dashboard

After login, users were redirected to / instead of /dashboard.

Solution:

Configured redirectTo correctly inside signInWithOAuth

Ensured callback URL was added in Supabase settings

Verified production domain configuration

Key Learnings

This project strengthened my understanding of:

OAuth flow in production environments

Supabase authentication and RLS policies

Next.js App Router client-side route protection

Real-time database subscriptions

Environment configuration for deployment

Debugging authentication across different environments

Secure full-stack deployment on Vercel

Author

Sai Sathwik Samudram
Full Stack Developer
Interested in building scalable and secure web applications.