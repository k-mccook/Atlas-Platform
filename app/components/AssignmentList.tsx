'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

type Assignment = {
  id: string
  property_address: string
  client_name: string
  status: string
  due_date: string | null
}

export default function AssignmentList() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAssignments = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setAssignments([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('assignments')
        .select('id, property_address, client_name, status, due_date')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })

      if (!error) {
        setAssignments(data ?? [])
      } else {
        setAssignments([])
      }

      setLoading(false)
    }

    void loadAssignments()
  }, [])

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Recent Assignments</h2>
          <p className="text-sm text-slate-600">Your latest loan assignments at a glance.</p>
        </div>

        <Link
          href="/assignments/new"
          className="inline-flex items-center justify-center rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
        >
          New Assignment
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-10 text-sm text-slate-600">
          Loading assignments...
        </div>
      ) : assignments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">
          No assignments yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {assignments.map((assignment) => (
            <Link
              key={assignment.id}
              href={`/assignments/${assignment.id}`}
              className="group flex cursor-pointer flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {assignment.property_address}
                  </h3>
                  <p className="text-sm text-slate-600">{assignment.client_name}</p>
                </div>

                <div className="flex flex-col gap-2 sm:items-end">
                  <span className="inline-flex w-fit rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-700">
                    {assignment.status}
                  </span>
                  <p className="text-sm text-slate-500">
                    {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date'}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
