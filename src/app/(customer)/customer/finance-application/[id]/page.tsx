"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { FinanceApplicationFlow } from "@/components/finance/FinanceApplicationFlow"

export default function CustomerFinanceApplicationPage() {
  const params = useParams()
  const vehicleId = params.id as string

  return (
    <div className="mx-auto max-w-5xl">
       <FinanceApplicationFlow vehicleId={vehicleId} />
    </div>
  )
}
