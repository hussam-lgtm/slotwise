'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical, X } from 'lucide-react'
import type { BookingQuestion, QuestionType } from '@/types'

interface Props {
  questions: Omit<BookingQuestion, 'id' | 'booking_link_id' | 'created_at'>[]
  onChange: (questions: Omit<BookingQuestion, 'id' | 'booking_link_id' | 'created_at'>[]) => void
}

export default function QuestionBuilder({ questions, onChange }: Props) {
  function addQuestion() {
    onChange([...questions, {
      label: '',
      type: 'text',
      options: [],
      required: false,
      position: questions.length,
    }])
  }

  function updateQuestion(index: number, updates: Partial<typeof questions[0]>) {
    const next = [...questions]
    next[index] = { ...next[index], ...updates }
    onChange(next)
  }

  function removeQuestion(index: number) {
    onChange(questions.filter((_, i) => i !== index))
  }

  function addOption(index: number) {
    const q = questions[index]
    updateQuestion(index, { options: [...(q.options ?? []), ''] })
  }

  function updateOption(qIndex: number, oIndex: number, value: string) {
    const options = [...(questions[qIndex].options ?? [])]
    options[oIndex] = value
    updateQuestion(qIndex, { options })
  }

  function removeOption(qIndex: number, oIndex: number) {
    const options = (questions[qIndex].options ?? []).filter((_, i) => i !== oIndex)
    updateQuestion(qIndex, { options })
  }

  return (
    <div className="space-y-3">
      {questions.map((q, i) => (
        <div key={i} className="border border-zinc-700 rounded-lg p-4 space-y-3 bg-zinc-900">
          <div className="flex items-start gap-2">
            <GripVertical size={14} className="text-zinc-600 mt-2.5 shrink-0" />
            <div className="flex-1 space-y-3">
              {/* Label */}
              <input
                value={q.label}
                onChange={e => updateQuestion(i, { label: e.target.value })}
                placeholder="Question label e.g. What's your company size?"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
              />

              {/* Type + required */}
              <div className="flex items-center gap-3">
                <select
                  value={q.type}
                  onChange={e => updateQuestion(i, { type: e.target.value as QuestionType, options: e.target.value === 'multiple_choice' ? [''] : [] })}
                  className="px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  <option value="text">Text answer</option>
                  <option value="multiple_choice">Multiple choice</option>
                </select>
                <label className="flex items-center gap-1.5 text-sm text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={q.required}
                    onChange={e => updateQuestion(i, { required: e.target.checked })}
                    className="rounded"
                  />
                  Required
                </label>
              </div>

              {/* Options for multiple choice */}
              {q.type === 'multiple_choice' && (
                <div className="space-y-2 pl-1">
                  {(q.options ?? []).map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <span className="text-zinc-600 text-xs">•</span>
                      <input
                        value={opt}
                        onChange={e => updateOption(i, oi, e.target.value)}
                        placeholder={`Option ${oi + 1}`}
                        className="flex-1 px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/20"
                      />
                      <button type="button" onClick={() => removeOption(i, oi)} className="text-zinc-600 hover:text-zinc-400">
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addOption(i)}
                    className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <Plus size={12} /> Add option
                  </button>
                </div>
              )}
            </div>
            <button type="button" onClick={() => removeQuestion(i)} className="text-zinc-600 hover:text-red-400 transition-colors mt-0.5">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addQuestion}
        className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors border border-dashed border-zinc-700 hover:border-zinc-500 rounded-lg px-4 py-2.5 w-full justify-center"
      >
        <Plus size={14} /> Add question
      </button>
    </div>
  )
}
