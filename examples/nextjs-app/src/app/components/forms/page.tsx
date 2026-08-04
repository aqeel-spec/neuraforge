// @ts-nocheck
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
  Autocomplete,
  Slider,
  RangeSlider,
  ColorPicker,
  OtpInput,
  PhoneInput,
  SearchInput,
  TagInput,
  StarRating,
  SignaturePad,
} from "@neuraforge-ui/components/src/forms/index";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function FormsPage() {
  const [switchOn, setSwitchOn] = useState(false);
  const [volume, setVolume] = useState(50);
  const [priceRange, setPriceRange] = useState<[number, number]>([100, 750]);
  const [selectedColor, setSelectedColor] = useState("#6366f1");
  const [otpValue, setOtpValue] = useState("");
  const [phone, setPhone] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [tags, setTags] = useState<string[]>(["React", "TypeScript"]);
  const [rating, setRating] = useState(3);

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
          20 form components — text fields, selects, checkboxes, radios, switches, textareas,
          date pickers, file uploads, autocomplete, sliders, color pickers, OTP inputs, phone inputs,
          search, tags, ratings, and signature pads. All with validation, accessible labels, and error announcements.
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
          <div className="w-full space-y-4">
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
          expandable
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
          <div className="w-full">
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
          <div className="w-full space-y-3">
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
          <div className="w-full">
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
          <div className="w-full">
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
          <div className="w-full space-y-4">
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
          <div className="w-full">
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
          expandable
          code={`import { DatePicker } from "@neuraforge-ui/components/src/forms/index";

<DatePicker label="Start date" name="startDate" />`}
        >
          <div className="w-full">
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
          <div className="w-full">
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
          <div className="w-full">
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

      {/* Autocomplete */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="autocomplete"
          title="Autocomplete"
          description="Searchable input with suggestion list, keyboard navigation, and ARIA combobox"
          code={`import { Autocomplete } from "@neuraforge-ui/components/src/forms/index";

<Autocomplete
  label="Favorite fruit"
  name="fruit"
  options={[
    { value: "apple", label: "Apple" },
    { value: "banana", label: "Banana" },
    { value: "cherry", label: "Cherry" },
    { value: "grape", label: "Grape" },
    { value: "mango", label: "Mango" },
    { value: "orange", label: "Orange" },
    { value: "peach", label: "Peach" },
    { value: "strawberry", label: "Strawberry" },
  ]}
  placeholder="Search fruits..."
/>`}
        >
          <div className="w-full">
            <Autocomplete
              label="Favorite fruit"
              name="fruit"
              options={["Apple", "Banana", "Cherry", "Grape", "Mango", "Orange", "Peach", "Strawberry"]}
              placeholder="Search fruits..."
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* Slider */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="slider"
          title="Slider"
          description="Single-value range slider with label, step, and ARIA valuetext"
          code={`import { Slider } from "@neuraforge-ui/components/src/forms/index";

<Slider
  label="Volume"
  name="volume"
  min={0}
  max={100}
  step={1}
  value={volume}
  onChange={setVolume}
/>`}
        >
          <div className="w-full space-y-2">
            <Slider
              label="Volume"
              name="volume"
              min={0}
              max={100}
              step={1}
              value={volume}
              onChange={setVolume}
            />
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Current volume: {volume}%
            </p>
          </div>
        </ComponentPreview>
      </motion.div>

      {/* RangeSlider */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="range-slider"
          title="RangeSlider"
          description="Dual-thumb range slider for selecting a min/max range"
          code={`import { RangeSlider } from "@neuraforge-ui/components/src/forms/index";

<RangeSlider
  label="Price range"
  name="price"
  min={0}
  max={1000}
  step={10}
  value={priceRange}
  onChange={setPriceRange}
  formatValue={(v) => \`$\${v}\`}
/>`}
        >
          <div className="w-full space-y-2">
            <RangeSlider
              label="Price range"
              name="price"
              min={0}
              max={1000}
              step={10}
              value={priceRange}
              onChange={setPriceRange}
            />
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Selected: ${priceRange[0]} — ${priceRange[1]}
            </p>
          </div>
        </ComponentPreview>
      </motion.div>

      {/* ColorPicker */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="color-picker"
          title="ColorPicker"
          description="Color selection with preset swatches and custom hex input"
          code={`import { ColorPicker } from "@neuraforge-ui/components/src/forms/index";

<ColorPicker
  label="Brand color"
  name="brandColor"
  value={selectedColor}
  onChange={setSelectedColor}
  presets={["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#6366f1", "#a855f7"]}
/>`}
        >
          <div className="w-full">
            <ColorPicker
              label="Brand color"
              name="brandColor"
              value={selectedColor}
              onChange={setSelectedColor}
              presets={["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#6366f1", "#a855f7"]}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* OtpInput */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="otp-input"
          title="OtpInput"
          description="One-time password input with auto-advance, paste support, and ARIA"
          code={`import { OtpInput } from "@neuraforge-ui/components/src/forms/index";

<OtpInput
  label="Verification code"
  name="otp"
  length={6}
  value={otpValue}
  onChange={setOtpValue}
/>`}
        >
          <div className="w-full">
            <OtpInput
              length={6}
              value={otpValue}
              onChange={setOtpValue}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* PhoneInput */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="phone-input"
          title="PhoneInput"
          description="International phone input with country code selector and formatting"
          code={`import { PhoneInput } from "@neuraforge-ui/components/src/forms/index";

<PhoneInput
  label="Phone number"
  name="phone"
  value={phone}
  onChange={setPhone}
  defaultCountry="US"
/>`}
        >
          <div className="w-full">
            <PhoneInput
              label="Phone number"
              value={phone}
              onChange={setPhone}
              defaultCountry="US"
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* SearchInput */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="search-input"
          title="SearchInput"
          description="Search input with filter pills, clear button, and keyboard shortcuts"
          code={`import { SearchInput } from "@neuraforge-ui/components/src/forms/index";

<SearchInput
  label="Search components"
  name="search"
  value={searchQuery}
  onChange={setSearchQuery}
  placeholder="Search..."
  filters={[
    { value: "all", label: "All" },
    { value: "forms", label: "Forms" },
    { value: "layout", label: "Layout" },
    { value: "feedback", label: "Feedback" },
  ]}
/>`}
        >
          <div className="w-full">
            <SearchInput
              label="Search components"
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search..."
              filters={[
                { id: "all", label: "All", active: true },
                { id: "forms", label: "Forms", active: false },
                { id: "layout", label: "Layout", active: false },
                { id: "feedback", label: "Feedback", active: false },
              ]}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* TagInput */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="tag-input"
          title="TagInput"
          description="Tag entry with add/remove, keyboard support, and duplicate prevention"
          code={`import { TagInput } from "@neuraforge-ui/components/src/forms/index";

<TagInput
  label="Skills"
  name="skills"
  value={tags}
  onChange={setTags}
  placeholder="Add a skill..."
  maxTags={10}
/>`}
        >
          <div className="w-full">
            <TagInput
              label="Skills"
              tags={tags}
              onChange={setTags}
              placeholder="Add a skill..."
              maxTags={10}
            />
          </div>
        </ComponentPreview>
      </motion.div>

      {/* StarRating */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="star-rating"
          title="StarRating"
          description="Interactive star rating with keyboard navigation and ARIA"
          code={`import { StarRating } from "@neuraforge-ui/components/src/forms/index";

<StarRating
  label="Rate this component"
  name="rating"
  value={rating}
  onChange={setRating}
  max={5}
/>`}
        >
          <div className="w-full space-y-2">
            <StarRating
              label="Rate this component"
              value={rating}
              onChange={setRating}
              max={5}
            />
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              You rated: {rating} / 5 stars
            </p>
          </div>
        </ComponentPreview>
      </motion.div>

      {/* SignaturePad */}
      <motion.div variants={fadeUp}>
        <ComponentPreview
          id="signature-pad"
          title="SignaturePad"
          description="Canvas-based signature capture with clear, undo, and export to PNG/SVG"
          code={`import { SignaturePad } from "@neuraforge-ui/components/src/forms/index";

<SignaturePad
  label="Signature"
  name="signature"
  width={400}
  height={200}
  penColor="#1e293b"
  onSave={(dataUrl) => console.log(dataUrl)}
/>`}
        >
          <div className="w-full">
            <SignaturePad
              label="Signature"
              width={400}
              height={200}
              penColor="#1e293b"
              onChange={() => {}}
            />
          </div>
        </ComponentPreview>
      </motion.div>
    </motion.div>
  );
}
