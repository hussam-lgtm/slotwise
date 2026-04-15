'use client'

import { Plus, Trash2, GripVertical, X } from 'lucide-react'
import type { BookingQuestion, QuestionType } from '@/types'

interface Props {
  questions: Omit<BookingQuestion, 'id' | 'booking_link_id' | 'created_at'>[]
  onChange: (questions: Omit<BookingQuestion, 'id' | 'booking_link_id' | 'created_at'>[]) => void
}

export default function QuestionBuilder({ questions, onChange }: Props) {
  function addQuestion() {
    onChange([...questions, { label: '', type: 'text', options: [], required: false, position: questions.length }])
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
    updateQuestion(index, { options: [...(questions[index].options ?? []), ''] })
  }

  function updateOption(qIndex: number, oIndex: number, value: string) {
    const options = [...(questions[qIndex].options ?? [])]
    options[oIndex] = value
    updateQuestion(qIndex, { options })
  }

  function removeOption(qIndex: number, oIndex: number) {
    updateQuestion(qIndex, { options: (questions[qIndex].options ?? []).filter((_, i) => i !== oIndex) })
  }

  const inputCls = "w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-gray-400"

  return (
    <div className="space-y-3">
      {questions.map((q, i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
          <div className="flex items-start gap-2">
            <GripVertical size={14} className="text-gray-300 mt-2.5 shrink-0" />
            <div className="flex-1 space-y-3">
              <input value={q.label} onChange={e => updateQuestion(i, { label: e.target.value })}
                placeholder="Question e.g. What's your company size?"
                className={inputCls} />
              <div className="flex items-center gap-3">
                <select value={q.type}
                  onChange={e => updateQuestion(i, { type: e.target.value as QuestionType, options: e.target.value === 'multiple_choice' ? [''] : [] })}
                  className="px-2 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/20">
                  <option value="text">Text answer</option>
                  <option value="multiple_choice">Multiple choice</option>
                </select>
                <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={q.required}
                    onChange={e => updateQuestion(i, { required: e.target.checked })}
                    className="accent-black rounded" />
                  Required
                </label>
              </div>

              {q.type === 'multiple_choice' && (
                <div className="space-y-2 pl-1">
                  {(q.options ?? []).map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <span className="text-gray-300 text-xs">•</span>
                      <input value={opt} onChange={e => updateOption(i, oi, e.target.value)}
                        placeholder={`Option ${oi + 1}`}
                        className="flex-1 px-2 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black/20" />
                      <button type="button" onClick={() => removeOption(i, oi)} className="text-gray-300 hover:text-red-400 transition-colors">
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addOption(i)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors">
                    <Plus size={12} /> Add option
                  </button>
                </div>
              )}
            </div>
            <button type="button" onClick={() => removeQuestion(i)} className="text-gray-300 hover:text-red-400 transition-colors mt-0.5">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}

      <button type="button" onClick={addQuestion}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors border border-dashed border-gray-300 hover:border-gray-400 rounded-lg px-4 py-2.5 w-full justify-center">
        <Plus size={14} /> Add question
      </button>
    </div>
  )
}
