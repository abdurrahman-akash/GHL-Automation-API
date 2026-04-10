"use client";

import { useState } from "react";
import { useDuplicateCheck } from "@/hooks/useDuplicateCheck";
import { toErrorMessage } from "@/lib/axios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type DuplicateErrors = {
  email?: string;
  phone?: string;
  form?: string;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validate(email: string, phone: string): DuplicateErrors {
  const errors: DuplicateErrors = {};

  if (!email.trim() && !phone.trim()) {
    errors.form = "Provide at least one value: email or phone.";
    return errors;
  }

  if (email.trim() && !isValidEmail(email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  if (phone.trim() && phone.trim().replace(/[^0-9]/g, "").length < 7) {
    errors.phone = "Please enter a valid phone number.";
  }

  return errors;
}

export function DuplicateCheckForm() {
  const duplicateCheckMutation = useDuplicateCheck();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<DuplicateErrors>({});

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate(email, phone);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    duplicateCheckMutation.mutate({
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
    });
  };

  return (
    <Card>
      <CardTitle>Test Duplicate Detection</CardTitle>
      <CardDescription className="mt-2">
        Submit an email and/or phone number to check whether the contact already exists for your tenant.
      </CardDescription>

      <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
        <Input
          id="email"
          label="Email"
          name="email"
          type="email"
          placeholder="test@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
        />

        <Input
          id="phone"
          label="Phone"
          name="phone"
          type="tel"
          placeholder="+1 415 555 0100"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          error={errors.phone}
        />

        {errors.form ? <p className="sm:col-span-2 text-sm text-rose-600">{errors.form}</p> : null}

        <div className="sm:col-span-2 flex items-center gap-3">
          <Button type="submit" isLoading={duplicateCheckMutation.isPending}>
            {duplicateCheckMutation.isPending ? "Checking..." : "Check Duplicate"}
          </Button>
        </div>
      </form>

      {duplicateCheckMutation.isError ? (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {toErrorMessage(duplicateCheckMutation.error)}
        </p>
      ) : null}

      {duplicateCheckMutation.data ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card className="border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email status</p>
            <div className="mt-2">
              <Badge variant={duplicateCheckMutation.data.email === "duplicate" ? "duplicate" : "unique"}>
                {duplicateCheckMutation.data.email}
              </Badge>
            </div>
          </Card>

          <Card className="border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone status</p>
            <div className="mt-2">
              <Badge variant={duplicateCheckMutation.data.phone === "duplicate" ? "duplicate" : "unique"}>
                {duplicateCheckMutation.data.phone}
              </Badge>
            </div>
          </Card>
        </div>
      ) : null}
    </Card>
  );
}
