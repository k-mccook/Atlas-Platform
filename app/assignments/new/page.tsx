'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

const initialFormState = {
  propertyAddress: '',
  city: '',
  state: '',
  zipCode: '',
  clientName: '',
  borrowerName: '',
  loanType: '',
  formType: '',
  dueDate: '',
}

export default function NewAssignmentPage() {
  const router = useRouter()
  const [form, setForm] = useState(initialFormState)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleChange = (field: keyof typeof initialFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setErrorMessage('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setErrorMessage('Please sign in before creating an assignment.')
      setIsSaving(false)
      return
    }

    const { error } = await supabase.from('assignments').insert([
      {
        property_address: form.propertyAddress,
        city: form.city,
        state: form.state,
        zip: form.zipCode,
        client_name: form.clientName,
        borrower_name: form.borrowerName,
        loan_type: form.loanType,
        form_type: form.formType,
        due_date: form.dueDate,
        status: 'New',
        created_by: user.id,
      },
    ])

    if (error) {
      setErrorMessage('We could not save this assignment right now. Please try again.')
      setIsSaving(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl items-center justify-center">
        <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70 sm:p-10">
          <div className="mb-8 space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-600">
              Atlas
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">New Assignment</h1>
            <p className="text-sm text-slate-600">
              Capture the details for a new loan assignment in a few quick steps.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Property Address</span>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                  value={form.propertyAddress}
                  onChange={(event) => handleChange('propertyAddress', event.target.value)}
                  placeholder="123 Main Street"
                  required
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>City</span>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                  value={form.city}
                  onChange={(event) => handleChange('city', event.target.value)}
                  placeholder="Austin"
                  required
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>State</span>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                  value={form.state}
                  onChange={(event) => handleChange('state', event.target.value)}
                  placeholder="TX"
                  required
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>ZIP Code</span>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                  value={form.zipCode}
                  onChange={(event) => handleChange('zipCode', event.target.value)}
                  placeholder="78701"
                  required
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Client Name</span>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                  value={form.clientName}
                  onChange={(event) => handleChange('clientName', event.target.value)}
                  placeholder="Jordan Rivera"
                  required
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Borrower Name</span>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                  value={form.borrowerName}
                  onChange={(event) => handleChange('borrowerName', event.target.value)}
                  placeholder="Morgan Lee"
                  required
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Loan Type</span>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                  value={form.loanType}
                  onChange={(event) => handleChange('loanType', event.target.value)}
                  placeholder="Refinance"
                  required
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Form Type</span>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                  value={form.formType}
                  onChange={(event) => handleChange('formType', event.target.value)}
                  placeholder="1003"
                  required
                />
              </label>
            </div>

            <label className="block space-y-2 text-sm font-medium text-slate-700">
              <span>Due Date</span>
              <input
                type="date"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                value={form.dueDate}
                onChange={(event) => handleChange('dueDate', event.target.value)}
                required
              />
            </label>

            {errorMessage ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </div>
            ) : null}

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex min-w-40 items-center justify-center rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-400"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  'Save Assignment'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
