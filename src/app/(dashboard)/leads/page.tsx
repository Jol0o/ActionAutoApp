"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLeads, Lead } from "@/hooks/useLeads"
import { Mail, Phone, Car, Calendar, Plus } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

const statusColors: Record<string, string> = {
  'New': 'bg-blue-100 text-blue-800',
  'Contacted': 'bg-yellow-100 text-yellow-800',
  'Appointment Set': 'bg-green-100 text-green-800',
  'Closed': 'bg-gray-100 text-gray-800',
}

export default function LeadsPage() {
  const { leads, isLoading, updateLeadStatus, refetch } = useLeads()
  const { getToken } = useAuth()
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [newStatus, setNewStatus] = React.useState<string>('')
  
  // Create inquiry form state
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [createForm, setCreateForm] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    year: '',
    make: '',
    model: '',
    comments: '',
  })
  const [isCreating, setIsCreating] = React.useState(false)
  const [createError, setCreateError] = React.useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = React.useState(false)

  const handleStatusChange = (status: string) => {
    if (selectedLead) {
      updateLeadStatus({ id: selectedLead._id, status })
      setSelectedLead(null)
      setIsDetailOpen(false)
    }
  }

  const openDetail = (lead: Lead) => {
    setSelectedLead(lead)
    setNewStatus(lead.status)
    setIsDetailOpen(true)
  }

  const handleCreateInquiry = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setCreateError(null)
    setCreateSuccess(false)
    
    try {
      const token = await getToken()
      const payload = {
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        email: createForm.email,
        phone: createForm.phone,
        vehicle: {
          year: createForm.year,
          make: createForm.make,
          model: createForm.model,
        },
        comments: createForm.comments,
        source: 'Manual Entry (Test)',
        status: 'New',
      }
      
      console.log('[Frontend] Sending inquiry data:', payload)
      
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      console.log('[Frontend] Response:', { status: response.status, data })

      if (response.ok) {
        // Reset form and close dialog
        setCreateForm({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          year: '',
          make: '',
          model: '',
          comments: '',
        })
        setCreateSuccess(true)
        
        // Close after 2 seconds
        setTimeout(() => {
          setIsCreateOpen(false)
          setCreateSuccess(false)
        }, 2000)
        
        // Refresh leads
        setTimeout(() => refetch(), 500)
      } else {
        setCreateError(data.message || 'Failed to create inquiry')
      }
    } catch (error) {
      console.error('[Frontend] Error creating inquiry:', error)
      setCreateError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsCreating(false)
    }
  }

  const stats = React.useMemo(() => {
    return {
      total: leads.length,
      new: leads.filter((l: Lead) => l.status === 'New').length,
      contacted: leads.filter((l: Lead) => l.status === 'Contacted').length,
      appointmentSet: leads.filter((l: Lead) => l.status === 'Appointment Set').length,
      closed: leads.filter((l: Lead) => l.status === 'Closed').length,
    }
  }, [leads])

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header with Explanation */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Customer Inquiries</h1>
          <p className="text-muted-foreground mt-1">
            All customer inquiries and leads come to this central location when customers submit inquiries via email or your website. Manage and track them all in one place.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} size="lg" className="gap-2 whitespace-nowrap">
          <Plus className="h-4 w-4" />
          Create Test Inquiry
        </Button>
      </div>

      {/* Statistics with Explanations */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Inquiry Status Overview</h2>
          <p className="text-sm text-muted-foreground">
            These cards show how many inquiries are in each stage of your sales process. Track your pipeline and see which inquiries need attention.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">All Inquiries</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Total inquiries in system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New</CardTitle>
              <Mail className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.new}</div>
              <p className="text-xs text-muted-foreground mt-1">Just received, need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contacted</CardTitle>
              <Phone className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.contacted}</div>
              <p className="text-xs text-muted-foreground mt-1">You reached out to customer</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Apt. Scheduled</CardTitle>
              <Calendar className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.appointmentSet}</div>
              <p className="text-xs text-muted-foreground mt-1">Appointment confirmed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Closed</CardTitle>
              <Car className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.closed}</div>
              <p className="text-xs text-muted-foreground mt-1">Deal closed or lost</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Leads List */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Inquiry List</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Click on any inquiry to view complete details, including customer contact information and vehicle details. From there, you can update the status or add notes.
          </p>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Loading inquiries...</p>
            </CardContent>
          </Card>
        ) : leads.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">No inquiries yet</p>
              <p className="text-sm text-muted-foreground">Click the Create Test Inquiry button to create a sample, or customer inquiries will appear here automatically when they submit forms or emails.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {leads.map((lead: Lead) => (
              <Card key={lead._id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openDetail(lead)}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-semibold">
                            {lead.firstName} {lead.lastName}
                          </p>
                          <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                            <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:underline">
                              <Mail className="h-3 w-3" />
                              {lead.email}
                            </a>
                            <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:underline">
                              <Phone className="h-3 w-3" />
                              {lead.phone}
                            </a>
                          </div>
                        </div>
                      </div>
                      {lead.vehicle?.make && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <Car className="h-3 w-3" />
                          {lead.vehicle.year} {lead.vehicle.make} {lead.vehicle.model}
                        </div>
                      )}
                      {lead.comments && (
                        <p className="text-sm text-muted-foreground mt-2">{lead.comments}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={statusColors[lead.status] || 'bg-gray-100'}>
                        {lead.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedLead?.firstName} {selectedLead?.lastName}
            </DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Email</p>
                <a href={`mailto:${selectedLead.email}`} className="text-blue-600 hover:underline">
                  {selectedLead.email}
                </a>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Phone</p>
                <a href={`tel:${selectedLead.phone}`} className="text-blue-600 hover:underline">
                  {selectedLead.phone}
                </a>
              </div>
              {selectedLead.vehicle?.make && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Vehicle</p>
                  <p>
                    {selectedLead.vehicle.year} {selectedLead.vehicle.make} {selectedLead.vehicle.model}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Comments</p>
                <p className="text-sm">{selectedLead.comments || 'No comments'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">Status</p>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Appointment Set">Appointment Set</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleStatusChange(newStatus)}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Inquiry Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Test Inquiry</DialogTitle>
            <DialogDescription>
              Fill in customer details to create a sample inquiry for testing.
            </DialogDescription>
          </DialogHeader>

          {/* Test Disclaimer Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-900">
              <strong>ℹ️ For Testing Only:</strong> This creates a sample inquiry in your system. 
              In production, real customer inquiries will be automatically forwarded from your email account. 
              This test feature helps you see how the system works before connecting email integration.
            </p>
          </div>

          {/* Success Message */}
          {createSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-900">
                ✅ Test inquiry created successfully! It should appear in your list in a moment...
              </p>
            </div>
          )}

          {/* Error Message */}
          {createError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-900">
                <strong>Error:</strong> {createError}
              </p>
            </div>
          )}

          <form onSubmit={handleCreateInquiry} className="space-y-4">
            {createSuccess ? (
              <div className="py-8 text-center">
                <p className="text-lg font-semibold text-green-600 mb-2">✅ Success!</p>
                <p className="text-muted-foreground">Test inquiry created. Closing...</p>
              </div>
            ) : (
              <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={createForm.firstName}
                  onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={createForm.lastName}
                  onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="555-0123"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                required
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Vehicle Information (Optional)</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    placeholder="2023"
                    value={createForm.year}
                    onChange={(e) => setCreateForm({ ...createForm, year: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="make">Make</Label>
                  <Input
                    id="make"
                    placeholder="Toyota"
                    value={createForm.make}
                    onChange={(e) => setCreateForm({ ...createForm, make: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    placeholder="Camry"
                    value={createForm.model}
                    onChange={(e) => setCreateForm({ ...createForm, model: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="comments">Comments/Notes</Label>
              <Textarea
                id="comments"
                placeholder="Add any notes about this inquiry..."
                value={createForm.comments}
                onChange={(e) => setCreateForm({ ...createForm, comments: e.target.value })}
                rows={3}
              />
            </div>
              </>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsCreateOpen(false)
                setCreateError(null)
              }}>
                Cancel
              </Button>
              {!createSuccess && (
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Inquiry'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
