import { redirect } from 'next/navigation'

// The root of the dashboard group redirects to /dashboard
export default function DashboardGroupRoot() {
  redirect('/dashboard')
}
