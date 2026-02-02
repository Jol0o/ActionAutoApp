"use client"

import * as React from "react"
import { X, Plus, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"

interface GuestEmailInputProps {
  emails: string[];
  onChange: (emails: string[]) => void;
}

export function GuestEmailInput({ emails, onChange }: GuestEmailInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleAddEmail = () => {
    const trimmedEmail = inputValue.trim().toLowerCase();
    
    if (!trimmedEmail) {
      setError("Please enter an email address");
      return;
    }
    
    if (!validateEmail(trimmedEmail)) {
      setError("Please enter a valid email address");
      return;
    }
    
    if (emails.includes(trimmedEmail)) {
      setError("This email has already been added");
      return;
    }
    
    onChange([...emails, trimmedEmail]);
    setInputValue("");
    setError(null);
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    onChange(emails.filter(email => email !== emailToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  return (
    <div className="space-y-2">
      <Label>Guest Emails (External)</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder="guest@example.com"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError(null);
            }}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddEmail}
          className="gap-2"
        >
          <Plus className="size-4" />
          Add
        </Button>
      </div>
      
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
      
      {emails.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {emails.map((email) => (
            <Badge key={email} variant="secondary" className="gap-1 pr-1">
              <Mail className="size-3" />
              {email}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-0.5 hover:bg-transparent"
                onClick={() => handleRemoveEmail(email)}
              >
                <X className="size-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
      
      <p className="text-xs text-muted-foreground">
        External guests will receive email invitations and can add the event to their calendar
      </p>
    </div>
  );
}