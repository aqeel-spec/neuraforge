"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ComponentPreview } from "@/components/component-preview";
import {
  TextField,
  Form,
  Select,
  Checkbox,
  CheckboxGroup,
  RadioGroup,
  Switch,
  Textarea,
  DatePicker,
  FileUpload,
} from "@neuraforge-ui/components/src/forms/index";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function FormsPage() {
  const [switchOn, setSwitchOn] = useState(false);

  // Handle hash-based navigation
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, []);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-10"
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">Forms</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-2 text-[15px] leading-relaxed max-w-2xl">
          10 form components — text fields, selects, checkboxes, radios, switches, textareas,
          date pickers, and file uploads. All with validation, accessible labels, and error announcements.
        </p>
      </motion.div>

      {/* TextField */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="text-field"
          title="TextField"
          description="Labelled text input with validation and error messaging"
          code={`import { TextField } from "@neuraforge-ui/components/src/forms/index";

<TextField label="Email" name="email" type="email" required />
<TextField label="Password" name="password" type="password" required />`}
        >
          <div className="w-full max-w-sm space-y-4">
            <TextField label="Email address" name="email" type="email" required />
            <TextField label="Password" name="password" type="password" required />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Select */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="select"
          title="Select"
          description="Accessible dropdown select with keyboard navigation and ARIA"
          code={`import { Select } from "@neuraforge-ui/components/src/forms/index";

<Select
  label="Framework"
  name="framework"
  options={[
    { value: "next", label: "Next.js" },
    { value: "remix", label: "Remix" },
    { value: "astro", label: "Astro" },
  ]}
/>`}
        >
          <div className="w-full max-w-sm">
            <Select
              label="Framework"
              name="framework"
              options={[
                { value: "next", label: "Next.js" },
                { value: "remix", label: "Remix" },
                { value: "astro", label: "Astro" },
                { value: "svelte", label: "SvelteKit" },
              ]}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Checkbox */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="checkbox"
          title="Checkbox"
          description="Single checkbox with label and description"
          code={`import { Checkbox } from "@neuraforge-ui/components/src/forms/index";

<Checkbox label="Accept terms and conditions" name="terms" />`}
        >
          <div className="w-full max-w-sm space-y-3">
            <Checkbox label="Accept terms and conditions" name="terms" />
            <Checkbox label="Send me marketing emails" name="marketing" />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* CheckboxGroup */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="checkbox-group"
          title="CheckboxGroup"
          description="Group of checkboxes with a shared legend and validation"
          code={`import { CheckboxGroup } from "@neuraforge-ui/components/src/forms/index";

<CheckboxGroup
  legend="Notifications"
  name="notifications"
  options={[
    { value: "email", label: "Email" },
    { value: "sms", label: "SMS" },
    { value: "push", label: "Push" },
  ]}
/>`}
        >
          <div className="w-full max-w-sm">
            <CheckboxGroup
              legend="Notification channels"
              name="notifications"
              options={[
                { value: "email", label: "Email notifications" },
                { value: "sms", label: "SMS alerts" },
                { value: "push", label: "Push notifications" },
              ]}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* RadioGroup */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="radio-group"
          title="RadioGroup"
          description="Exclusive-choice radio group with keyboard arrow navigation"
          code={`import { RadioGroup } from "@neuraforge-ui/components/src/forms/index";

<RadioGroup
  legend="Plan"
  name="plan"
  options={[
    { value: "free", label: "Free" },
    { value: "pro", label: "Pro — $19/mo" },
    { value: "enterprise", label: "Enterprise" },
  ]}
/>`}
        >
          <div className="w-full max-w-sm">
            <RadioGroup
              legend="Select plan"
              name="plan"
              options={[
                { value: "free", label: "Free" },
                { value: "pro", label: "Pro — $19/mo" },
                { value: "enterprise", label: "Enterprise — Custom" },
              ]}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Switch */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="switch"
          title="Switch"
          description="Toggle switch for boolean settings with ARIA switch role"
          code={`import { Switch } from "@neuraforge-ui/components/src/forms/index";

<Switch
  label="Dark mode"
  name="darkmode"
  checked={darkMode}
  onChange={setDarkMode}
/>`}
        >
          <div className="w-full max-w-sm space-y-4">
            <Switch label="Enable notifications" name="notifications" checked={switchOn} onChange={setSwitchOn} />
            <Switch label="Auto-save drafts" name="autosave" checked={true} onChange={() => {}} />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Textarea */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="textarea"
          title="Textarea"
          description="Multi-line text input with character count and auto-resize"
          code={`import { Textarea } from "@neuraforge-ui/components/src/forms/index";

<Textarea
  label="Description"
  name="description"
  placeholder="Tell us about your project..."
  maxLength={500}
/>`}
        >
          <div className="w-full max-w-sm">
            <Textarea
              label="Description"
              name="description"
              placeholder="Tell us about your project..."
              maxLength={500}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* DatePicker */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="date-picker"
          title="DatePicker"
          description="Calendar date picker with keyboard navigation and locale support"
          code={`import { DatePicker } from "@neuraforge-ui/components/src/forms/index";

<DatePicker label="Start date" name="startDate" />`}
        >
          <div className="w-full max-w-sm">
            <DatePicker label="Start date" name="startDate" />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* FileUpload */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="file-upload"
          title="FileUpload"
          description="Drag-and-drop file upload with progress and validation"
          code={`import { FileUpload } from "@neuraforge-ui/components/src/forms/index";

<FileUpload
  label="Upload avatar"
  accept="image/*"
  maxSize={5 * 1024 * 1024}
  onFiles={(files) => console.log(files)}
/>`}
        >
          <div className="w-full max-w-sm">
            <FileUpload
              label="Upload avatar"
              accept="image/*"
              maxSize={5 * 1024 * 1024}
              onFiles={() => {}}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Form */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="form"
          title="Form"
          description="Form wrapper with submit handling and validation coordination"
          code={`import { Form, TextField } from "@neuraforge-ui/components/src/forms/index";

<Form onSubmit={(data) => console.log(data)}>
  <TextField label="Name" name="name" required />
  <TextField label="Email" name="email" type="email" required />
  <button type="submit">Submit</button>
</Form>`}
        >
          <div className="w-full max-w-sm">
            <Form onSubmit={() => {}}>
              <TextField label="Full name" name="name" required />
              <TextField label="Email" name="email" type="email" required />
              <button
                type="submit"
                className="mt-4 w-full rounded-md bg-[hsl(var(--primary))] px-3 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90 transition-opacity"
              >
                Create Account
              </button>
            </Form>
          </div>
        </ComponentPreview>
      </motion.div>
    </motion.div>
  );
}
