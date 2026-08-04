'use client'
import DocumentManager from '../../components/DocumentManager';
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'

type Assignment = {
  id: string
  property_address: string
  city: string | null
  state: string | null
  zip_code: string | null
  status: string | null
  client_name: string | null
  borrower_name: string | null
  loan_type: string | null
  form_type: string | null
  due_date: string | null
  created_by: string | null
}

export default function AssignmentDetailPage() {
  const params = useParams<{ id: string }>()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAssignment = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setAssignment(null)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', params.id)
        .eq('created_by', user.id)
        .maybeSingle()

      if (!error) {
        setAssignment(data)
      } else {
        setAssignment(null)
      }

      setLoading(false)
    }

    void loadAssignment()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-10 text-slate-800 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-slate-600">Loading assignment...</p>
        </div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-10 text-slate-800 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Assignment not found.</h1>
        </div>
      </div>
    )
  }

  const details = [
    ['City', assignment.city || '—'],
    ['State ZIP', `${assignment.state || '—'} ${assignment.zip_code || ''}`.trim()],
    ['Status', assignment.status || '—'],
    ['Client Name', assignment.client_name || '—'],
    ['Borrower Name', assignment.borrower_name || '—'],
    ['Loan Type', assignment.loan_type || '—'],
    ['Form Type', assignment.form_type || '—'],
    ['Due Date', assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : '—'],
  ]

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-600">Atlas</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                {assignment.property_address}
              </h1>
            </div>
            <span className="inline-flex w-fit rounded-full bg-cyan-100 px-3 py-1 text-sm font-semibold text-cyan-700">
              {assignment.status || 'New'}
            </span>
          </div>

          <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:grid-cols-2">
            {details.map(([label, value]) => (
              <div key={label} className="space-y-1">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="text-base font-semibold text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <DocumentManager assignmentId={assignment.id} />

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Notes</h2>
            <p className="mt-4 text-sm text-slate-600">No notes yet.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Ask Atlas</h2>
            <p className="mt-4 text-sm text-slate-600">This AI assistant will analyze this assignment.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Actions</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Edit Assignment
              </button>
              <button
                type="button"
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Delete Assignment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
