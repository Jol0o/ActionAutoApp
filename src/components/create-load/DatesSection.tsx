"use client"

import * as React from "react"
import { Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldRow } from "./FormField"
import { LoadDates } from "./types"

interface DatesSectionProps {
  value: LoadDates
  onChange: (updated: LoadDates) => void
}

export function DatesSection({ value, onChange }: DatesSectionProps) {
  const set = (key: keyof LoadDates) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => onChange({ ...value, [key]: e.target.value })

  return (
    <div className="space-y-3">
      <FieldRow>
        <Field label="First Available Date" required icon={Calendar}>
          <Input type="date" value={value.firstAvailable} onChange={set("firstAvailable")} className="h-9 text-sm" />
        </Field>
        <Field label="Pickup Deadline" icon={Calendar}>
          <Input type="date" value={value.pickupDeadline} onChange={set("pickupDeadline")} className="h-9 text-sm" />
        </Field>
      </FieldRow>

      <Field label="Delivery Deadline" icon={Calendar}>
        <Input type="date" value={value.deliveryDeadline} onChange={set("deliveryDeadline")} className="h-9 text-sm" />
      </Field>

      <Field label="Date Notes">
        <Textarea
          placeholder="Flexible on pickup window, must deliver before weekend…"
          value={value.notes}
          onChange={set("notes")}
          rows={2}
          className="text-sm resize-none"
        />
      </Field>
    </div>
  )
}
