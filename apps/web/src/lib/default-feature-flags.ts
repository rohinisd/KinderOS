/** Default flags seeded on the feature-flags admin page (idempotent upsert). */
export const DEFAULT_FEATURE_FLAG_DEFINITIONS: {
  key: string
  label: string
  description: string
}[] = [
  {
    key: 'ai_reports',
    label: 'AI progress reports',
    description: 'AI-assisted drafts and insights for teacher reports',
  },
  {
    key: 'transport_module',
    label: 'Transport module',
    description: 'Routes, stops, and student transport assignments',
  },
  {
    key: 'admissions_crm',
    label: 'Admissions CRM',
    description: 'Lead pipeline, follow-ups, and conversion tracking',
  },
]

export function labelForFeatureFlagKey(
  key: string,
  definitions: typeof DEFAULT_FEATURE_FLAG_DEFINITIONS
): { label: string; description: string } {
  const found = definitions.find((d) => d.key === key)
  if (found) return { label: found.label, description: found.description }
  return {
    label: key.replace(/_/g, ' '),
    description: 'Custom feature flag',
  }
}
