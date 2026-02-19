"use client";

import * as React from "react";
import { SignUp } from "@clerk/nextjs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DriverAuthForm } from "@/components/auth/DriverAuthForm";
import { Building2, Truck } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Action Auto
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dealer" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="dealer" className="gap-1.5">
              <Building2 className="size-4" />
              Dealer
            </TabsTrigger>
            <TabsTrigger value="driver" className="gap-1.5">
              <Truck className="size-4" />
              Driver
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dealer">
            <div className="flex justify-center">
              <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
            </div>
          </TabsContent>

          <TabsContent value="driver">
            <Card className="border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="size-4 text-emerald-500" />
                  Driver Account
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Log in or create your driver account.
                </p>
              </CardHeader>
              <CardContent>
                <DriverAuthForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
