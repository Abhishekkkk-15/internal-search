"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Save,
  Check,
  Settings,
  Cpu,
  Sliders,
  Database,
  Building,
  Globe,
  Key,
  Layers,
  Bot,
  SlidersHorizontal,
} from "lucide-react";
import { useNexusStore } from "../../lib/store";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Zod client validation schema definition
const settingsSchema = z.object({
  organizationName: z
    .string()
    .min(2, "Organization name must be at least 2 characters"),
  timezone: z.string().min(1, "Please specify an operational timezone"),
  language: z.string().min(1, "Please select a display interface language"),
  llmProvider: z.enum(["openai", "anthropic", "local"]),
  apiKey: z
    .string()
    .min(
      8,
      "API Key must be at least 8 characters long for downstream encryption",
    ),
  tools: z.object({
    jira: z.boolean(),
    slack: z.boolean(),
    notion: z.boolean(),
    drive: z.boolean(),
  }),
  retentionDays: z
    .number()
    .min(1, "Retention period must be at least 1 day")
    .max(365, "Retention cap is 365 days"),
  vectorStrategy: z.string(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {

  const { data: session } = useSession();
  const organizationId = session?.user?.organizationId || 'org_default';
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<
    "general" | "model" | "tools" | "memory"
  >("general");
  const [showToast, setShowToast] = useState(false);

  // 1. Fetch real settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['orgSettings', organizationId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/organization/settings`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'X-Organization-Id': organizationId
        }
      });
      if (!res.ok) throw new Error('Failed to fetch settings');
      return res.json();
    },
    enabled: !!session?.accessToken
  });

  // 2. Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (values: SettingsFormValues) => {
      const res = await fetch(`${API_BASE}/organization/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
          'X-Organization-Id': organizationId
        },
        body: JSON.stringify({
          name: values.organizationName,
          timezone: values.timezone,
          language: values.language,
          llmProvider: values.llmProvider,
          retentionDays: values.retentionDays
        })
      });
      if (!res.ok) throw new Error('Failed to update settings');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgSettings'] });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
    }
  });

  // Initialize Form context
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      organizationName: "",
      timezone: "America/Los_Angeles",
      language: "en-US",
      llmProvider: "openai",
      apiKey: "sk-proj-nexus-enterprise-mock-key-v2",
      tools: {
        jira: true,
        slack: true,
        notion: false,
        drive: true,
      },
      retentionDays: 90,
      vectorStrategy: "cosine_hybrid",
    },
  });

  // Sync form with fetched data
  useEffect(() => {
    if (settings) {
      reset({
        organizationName: settings.name,
        timezone: settings.timezone,
        language: settings.language,
        llmProvider: settings.llmProvider as any,
        apiKey: "sk-proj-nexus-enterprise-mock-key-v2", // Keep mock for now
        tools: { jira: true, slack: true, notion: false, drive: true },
        retentionDays: settings.retentionDays,
        vectorStrategy: "cosine_hybrid",
      });
    }
  }, [settings, reset]);

  // Watch selected provider to prepopulate placeholder strings dynamically
  const watchedProvider = watch("llmProvider");

  useEffect(() => {
    if (watchedProvider === "openai") {
      setValue("apiKey", "sk-proj-nexus-enterprise-mock-key-v2", {
        shouldValidate: true,
      });
    } else if (watchedProvider === "anthropic") {
      setValue("apiKey", "sk-ant-api03-nexus-mock-credential", {
        shouldValidate: true,
      });
    } else {
      setValue("apiKey", "local-llama3-weights-bypass-token", {
        shouldValidate: true,
      });
    }
  }, [watchedProvider, setValue]);

  // Handle Form submittal payload processing
  const onSubmit = async (data: SettingsFormValues) => {
    updateMutation.mutate(data);
  };

  const tabs = [
    { id: "general", label: "General Identity", icon: Settings },
    { id: "model", label: "LLM Orchestrator", icon: Cpu },
    { id: "tools", label: "Automation Tools", icon: SlidersHorizontal },
    { id: "memory", label: "Memory & Tensors", icon: Database },
  ] as const;

  return (
    <div className="space-y-6 pb-12 relative">
      {/* Toast popup absolute banner */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl border border-slate-800 dark:border-slate-100">
            <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 dark:text-emerald-600">
              <Check className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-bold">Configurations Synchronized</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                Zustand persistent storage updated.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header layout */}
      <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tenant Control Plane</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          System Preferences & Safety
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
          Configure multi-modal model selection endpoints, operational
          timezones, action dispatch tool boundaries, and retention buffers
          validated client-side with full Zod static typing.
        </p>
      </div>

      {/* Tabs framework selection list */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/40 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md overflow-x-auto">
        {tabs.map((tb) => {
          const Icon = tb.icon;
          const isActive = activeTab === tb.id;
          return (
            <button
              key={tb.id}
              type="button"
              onClick={() => setActiveTab(tb.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                isActive ?
                  "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs border border-slate-200/40 dark:border-slate-800/40"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}>
              <Icon className="w-3.5 h-3.5" />
              <span>{tb.label}</span>
            </button>
          );
        })}
      </div>

      {/* Primary HTML Form orchestrator wrapper */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl min-h-[350px]">
          {/* GENERAL TAB CONTENT VIEW */}
          {activeTab === "general" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6 max-w-xl">
              <div className="space-y-1 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Workspace General Identity
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Controls header branding and global prompt telemetry prefix
                  targets.
                </p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Building className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Organization Name</span>
                </label>
                <input
                  type="text"
                  {...register("organizationName")}
                  placeholder="e.g. Acme Corp internal"
                  className="w-full bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
                {errors.organizationName && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1">
                    {errors.organizationName.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Globe className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Timezone Baseline</span>
                  </label>
                  <select
                    {...register("timezone")}
                    className="w-full bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors">
                    <option value="America/Los_Angeles">
                      Pacific Time (US & Canada)
                    </option>
                    <option value="America/New_York">
                      Eastern Time (US & Canada)
                    </option>
                    <option value="Europe/London">London (GMT / BST)</option>
                    <option value="Asia/Tokyo">Tokyo Standard Time</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Interface Language</span>
                  </label>
                  <select
                    {...register("language")}
                    className="w-full bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors">
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Español (Spain)</option>
                    <option value="fr-FR">Français (France)</option>
                    <option value="de-DE">Deutsch (Germany)</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* MODEL TAB CONTENT VIEW */}
          {activeTab === "model" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6 max-w-xl">
              <div className="space-y-1 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  LLM Provider Selection
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Routes natural inputs through upstream neural processing
                  networks.
                </p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Bot className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Primary LLM Orchestrator Engine</span>
                </label>
                <div className="grid grid-cols-3 gap-3 pt-1">
                  {(["openai", "anthropic", "local"] as const).map((prov) => {
                    const isSel = watchedProvider === prov;
                    return (
                      <label
                        key={prov}
                        className={`p-3 rounded-xl border text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
                          isSel ?
                            "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold shadow-2xs"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 text-slate-600 dark:text-slate-400"
                        }`}>
                        <input
                          type="radio"
                          value={prov}
                          {...register("llmProvider")}
                          className="sr-only"
                        />
                        <span className="text-xs uppercase tracking-wide">
                          {prov}
                        </span>
                        <span className="text-[9px] text-slate-400 font-normal">
                          {prov === "openai" ?
                            "GPT-4o Streaming"
                          : prov === "anthropic" ?
                            "Claude 3.5 Sonnet"
                          : "Local Llama-3"}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Encrypted API Token</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 font-normal">
                    Stored locally in persistence boundary
                  </span>
                </label>
                <input
                  type="text"
                  {...register("apiKey")}
                  className="w-full bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                {errors.apiKey && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1">
                    {errors.apiKey.message}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* TOOLS TAB CONTENT VIEW */}
          {activeTab === "tools" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6 max-w-xl">
              <div className="space-y-1 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Action & Automation Tool Boundaries
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Grant or restrict Nexus Assistant&apos;s ability to trigger
                  external side-effects autonomously.
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-start justify-between gap-4 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20 cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Create Jira Tickets
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Enables agent to generate workflow action items
                      automatically from summarized text blocks.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    {...register("tools.jira")}
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </label>

                <label className="flex items-start justify-between gap-4 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20 cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Send Slack Summaries
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Authorizes direct broadcast messages to mapped internal
                      channels on completion of search sweeps.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    {...register("tools.slack")}
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </label>

                <label className="flex items-start justify-between gap-4 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20 cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Update Notion References
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Permits appending extracted table matrix parameters back
                      directly to synchronized Notion rows.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    {...register("tools.notion")}
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </label>

                <label className="flex items-start justify-between gap-4 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20 cursor-pointer hover:bg-slate-50 transition-colors opacity-70">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Google Drive Buffer Read-only
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Enforced strictly via short-lived scoped service
                      credentials. Permanent read/write disabled.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    {...register("tools.drive")}
                    disabled
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-not-allowed"
                  />
                </label>
              </div>
            </motion.div>
          )}

          {/* MEMORY TAB CONTENT VIEW */}
          {activeTab === "memory" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6 max-w-xl">
              <div className="space-y-1 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Vector Storage & Memory Tensors
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage temporal retention parameters for continuous semantic
                  similarity calculations.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Conversation History Retention</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">
                    {watch("retentionDays")} Days
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="365"
                  {...register("retentionDays", { valueAsNumber: true })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>1 Day</span>
                  <span>90 Days</span>
                  <span>365 Days</span>
                </div>
                {errors.retentionDays && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1">
                    {errors.retentionDays.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Database className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Vector Metric Similarity Optimization</span>
                </label>
                <select
                  {...register("vectorStrategy")}
                  className="w-full bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors">
                  <option value="cosine_hybrid">
                    Cosine Hybrid Distance (Recommended)
                  </option>
                  <option value="dot_product">
                    Dot Product Vectors (Maximum speed)
                  </option>
                  <option value="euclidean">Euclidean L2 Metric Matrix</option>
                </select>
              </div>
            </motion.div>
          )}
        </div>

        {/* Global Save triggers footer partition */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isDirty ?
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                Unsaved changes detected. Commit settings below.
              </span>
            : <span>
                All active parameters synced with Zustand storage client.
              </span>
            }
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50">
            {isSubmitting ?
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving Buffer...</span>
              </>
            : <>
                <Save className="w-4 h-4" />
                <span>Save Configuration</span>
              </>
            }
          </button>
        </div>
      </form>
    </div>
  );
}
