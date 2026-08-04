"use client";

import React from "react";
import { ComponentPreview } from "@/components/component-preview";
import { TextField, Form } from "@neuraforge-ui/components/src/forms/index";

export default function FormsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Forms</h1>
        <p className="text-muted-foreground mt-2">
          Form components with validation, accessible labels, and error announcements.
        </p>
      </div>

      <ComponentPreview
        title="TextField"
        description="Labelled text input with validation and error messaging"
        code={`import { TextField } from "@neuraforge-ui/components";

<TextField label="Email" name="email" type="email" required />
<TextField label="Password" name="password" type="password" required />`}
      >
        <div className="w-full max-w-sm space-y-4">
          <TextField label="Email address" name="email" type="email" required />
          <TextField label="Password" name="password" type="password" required />
          <TextField label="Bio (optional)" name="bio" />
        </div>
      </ComponentPreview>

      <ComponentPreview
        title="Form"
        description="Form wrapper with submit handling and validation coordination"
        code={`import { Form, TextField } from "@neuraforge-ui/components";

<Form onSubmit={(data) => console.log(data)}>
  <TextField label="Name" name="name" required />
  <TextField label="Email" name="email" type="email" required />
  <button type="submit">Submit</button>
</Form>`}
      >
        <div className="w-full max-w-sm">
          <Form onSubmit={() => alert("Form submitted!")}>
            <TextField label="Full name" name="name" required />
            <TextField label="Email" name="email" type="email" required />
            <TextField label="Company" name="company" />
            <button
              type="submit"
              className="mt-4 w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create Account
            </button>
          </Form>
        </div>
      </ComponentPreview>
    </div>
  );
}
