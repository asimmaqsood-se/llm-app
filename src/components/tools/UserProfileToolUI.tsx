"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { useState } from "react";
import { User, ChevronRight, CheckCircle2 } from "lucide-react";

type UserProfileArgs = {
  reason?: string;
  fields?: string[];
};

type UserProfileResult = {
  name: string;
  age: string;
  occupation: string;
  goals: string;
};

export const UserProfileToolUI = makeAssistantToolUI<UserProfileArgs, UserProfileResult>({
  toolName: "collect_user_profile",
  render: ({ args, result, addResult }) => {
    // If result already exists, show summary
    if (result) {
      return (
        <div className="my-3 rounded-xl border border-emerald-200 bg-linear-to-br from-emerald-50 to-teal-50 p-4 max-w-sm">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-800">Profile collected ✓</span>
          </div>
          <div className="space-y-1.5">
            {Object.entries(result).map(([key, val]) => (
              <div key={key} className="flex gap-2 text-sm">
                <span className="text-emerald-600 capitalize font-medium w-20 shrink-0">{key}:</span>
                <span className="text-emerald-900">{val}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Otherwise render the form — must be a separate component to use hooks
    return <ProfileForm args={args} addResult={addResult!} />;
  },
});

function ProfileForm({
  args,
  addResult,
}: {
  args: UserProfileArgs;
  addResult: (result: UserProfileResult) => void;
}) {
  const [form, setForm] = useState({ name: "", age: "", occupation: "", goals: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: keyof typeof form, val: string) => {
    setForm((f) => ({ ...f, [field]: val }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Required";
    if (!form.age.trim() || isNaN(Number(form.age))) newErrors.age = "Enter a valid age";
    if (!form.occupation.trim()) newErrors.occupation = "Required";
    if (!form.goals.trim()) newErrors.goals = "Required";
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    // This sends the form data back to the LLM as the tool result
    addResult({
      name: form.name.trim(),
      age: form.age.trim(),
      occupation: form.occupation.trim(),
      goals: form.goals.trim(),
    });
  };

  return (
    <div className="my-3 rounded-xl border border-blue-200 bg-linear-to-br from-blue-50 to-indigo-50 p-4 max-w-sm w-full">
      <div className="flex items-center gap-2 mb-1">
        <div className="p-1.5 rounded-lg bg-blue-100">
          <User className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-900">Tell me about yourself</p>
          {args?.reason && (
            <p className="text-xs text-blue-500">{args.reason}</p>
          )}
        </div>
      </div>

      <div className="space-y-3 mt-4">
        <Field label="Your name" error={errors.name}>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Alex Johnson"
            className={inputCls(!!errors.name)}
          />
        </Field>

        <Field label="Age" error={errors.age}>
          <input
            value={form.age}
            onChange={(e) => set("age", e.target.value)}
            placeholder="e.g. 28"
            type="number"
            min={1}
            max={120}
            className={inputCls(!!errors.age)}
          />
        </Field>

        <Field label="Occupation" error={errors.occupation}>
          <input
            value={form.occupation}
            onChange={(e) => set("occupation", e.target.value)}
            placeholder="e.g. Software Engineer"
            className={inputCls(!!errors.occupation)}
          />
        </Field>

        <Field label="What are your goals?" error={errors.goals}>
          <textarea
            value={form.goals}
            onChange={(e) => set("goals", e.target.value)}
            placeholder="e.g. Learn AI development, build SaaS products..."
            rows={2}
            className={inputCls(!!errors.goals) + " resize-none"}
          />
        </Field>
      </div>

      <button
        onClick={handleSubmit}
        className="mt-4 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
      >
        Submit <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-blue-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

const inputCls = (hasError: boolean) =>
  `w-full text-sm px-3 py-2 rounded-lg border bg-white outline-none transition-colors
  ${hasError
    ? "border-red-300 focus:border-red-500"
    : "border-blue-200 focus:border-blue-500"
  }`;