"use client"

import { useEffect, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { FinanceApplicationData } from '@/lib/schemas/finance-schema'

interface UseFinancePersistenceProps {
  form: UseFormReturn<FinanceApplicationData>
  vehicleId: string
  storageKey?: string
}

export function useFinancePersistence({ 
  form, 
  vehicleId, 
  storageKey = 'action-auto-finance-app' 
}: UseFinancePersistenceProps) {
  const [isReady, setIsReady] = useState(false)
  
  const key = `${storageKey}-${vehicleId}`

  // Load from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(key)
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        // SSN should not be persisted for security
        if (parsedData.personal) {
          delete parsedData.personal.ssn
        }
        form.reset(parsedData)
      } catch (e) {
        console.error('Failed to load persisted finance app data', e)
      }
    }
    setIsReady(true)
  }, [key, form])

  // Save to localStorage on change (debounced manually via watch subscription)
  useEffect(() => {
    if (!isReady) return

    const subscription = form.watch((value) => {
      // Don't save SSN
      const dataToSave = { ...value }
      if (dataToSave.personal) {
        dataToSave.personal = { ...dataToSave.personal, ssn: '' }
      }
      localStorage.setItem(key, JSON.stringify(dataToSave))
    })

    return () => subscription.unsubscribe()
  }, [key, form, isReady])

  const clearPersistence = () => {
    localStorage.removeItem(key)
  }

  return { isReady, clearPersistence }
}
