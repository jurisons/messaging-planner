import countriesData from '../data/countries.json'
import useCasesData from '../data/use-cases.json'

export type CountryCode = keyof typeof countriesData
export type UseCaseId = keyof typeof useCasesData
export type ChannelId = 'sms' | 'whatsapp' | 'rcs'

export interface PlanStep {
  week: string
  title: string
  description: string
  effort: 'low' | 'medium' | 'high'
  owner: 'your-team' | 'provider' | 'carrier' | 'regulator'
  blockers: string[]
}

export interface CountryPlan {
  country: (typeof countriesData)[CountryCode]
  countryCode: CountryCode
  recommendedChannel: ChannelId
  alternativeChannels: ChannelId[]
  blockedChannels: { channel: ChannelId; reason: string }[]
  steps: PlanStep[]
  totalTimelineDays: { min: number; max: number }
  estimatedCostPerMessage: { min: number; max: number }
  criticalGotchas: string[]
  complianceChecklist: string[]
  readinessScore: number // 0-100, how complex the setup is (lower = more complex)
}

export interface LaunchPlan {
  generatedAt: string
  useCase: (typeof useCasesData)[UseCaseId]
  countries: CountryPlan[]
  globalChecklist: string[]
  estimatedTotalOnboardingWeeks: { min: number; max: number }
  recommendedLaunchOrder: CountryCode[]
}

function getChannelAvailability(
  country: (typeof countriesData)[CountryCode],
  useCase: (typeof useCasesData)[UseCaseId],
  channelId: ChannelId
): { available: boolean; recommended: boolean; reason?: string } {
  const ch = country.channels[channelId]

  if (!ch || !ch.available) {
    return {
      available: false,
      recommended: false,
      reason: ch?.notes?.[0] ?? `${channelId.toUpperCase()} not available in ${country.name}`
    }
  }

  // Special case: WhatsApp marketing blocked in US
  if (channelId === 'whatsapp' && useCase.id === 'marketing') {
    const notes = ch.notes ?? []
    const paused = notes.some((n: string) => n.toLowerCase().includes('paused') || n.toLowerCase().includes('blocked'))
    if (paused) {
      return {
        available: false,
        recommended: false,
        reason: notes[0] ?? 'WhatsApp marketing not available'
      }
    }
  }

  const preferred = useCase.preferred_channels_order
  const isRecommended = preferred[0] === channelId

  return { available: true, recommended: isRecommended }
}

function buildStepsForChannel(
  country: (typeof countriesData)[CountryCode],
  channelId: ChannelId,
  useCase: (typeof useCasesData)[UseCaseId]
): PlanStep[] {
  const ch = country.channels[channelId]
  if (!ch || !ch.available) return []

  const steps: PlanStep[] = []
  const reg = ch.registration_required ?? false
  const timeline = ch.registration_timeline_days as [number, number] | undefined
  const minDays = timeline?.[0] ?? 1
  const maxDays = timeline?.[1] ?? 7

  // Step 1: Business verification / account setup
  steps.push({
    week: 'Week 1',
    title: `Set up ${channelId.toUpperCase()} sender account`,
    description:
      channelId === 'whatsapp'
        ? `Create a Meta Business Account and WhatsApp Business Account (WABA). You'll need your business legal name, address, website, and a dedicated phone number.`
        : channelId === 'rcs'
        ? `Register an RCS agent (sender profile) with Google RBM and submit for carrier approval. You'll need brand assets, use case description, and sample messages.`
        : `Configure your SMS sender — alphanumeric ID (your brand name) or shortcode — with your messaging provider (e.g. Messente).`,
    effort: 'low',
    owner: 'your-team',
    blockers: ['Dedicated phone number (WhatsApp)', 'Brand assets ready', 'Legal entity confirmed']
  })

  // Step 2: Registration (if required)
  if (reg && ch.registration_body) {
    const body = ch.registration_body as string
    steps.push({
      week: minDays <= 7 ? 'Week 1' : 'Week 1–2',
      title: `Register with ${body}`,
      description: buildRegistrationDescription(country, channelId, body, useCase),
      effort: minDays > 14 ? 'high' : 'medium',
      owner: 'carrier',
      blockers: buildRegistrationBlockers(country, channelId)
    })
  }

  // Step 3: Compliance / consent setup
  steps.push({
    week: reg ? (maxDays > 14 ? 'Week 2–3' : 'Week 2') : 'Week 1',
    title: 'Build consent and opt-in flow',
    description: buildConsentDescription(country, useCase),
    effort: 'medium',
    owner: 'your-team',
    blockers: buildConsentBlockers(country, useCase)
  })

  // Step 4: Template / content approval (WhatsApp + RCS)
  if (channelId === 'whatsapp' || channelId === 'rcs') {
    steps.push({
      week: reg ? (maxDays > 14 ? 'Week 3' : 'Week 2') : 'Week 2',
      title: `Get ${channelId === 'whatsapp' ? 'message templates' : 'RCS agent'} approved`,
      description:
        channelId === 'whatsapp'
          ? `Submit message templates to Meta for approval. Marketing templates require a clear value proposition and must not be overly promotional in language. Approval typically takes 24–72 hours but can take longer for first submissions.`
          : `Submit your RCS agent for review by Google and the relevant carriers in ${country.name}. Include sample messages, your brand logo, and use case description. This is the longest single step.`,
      effort: 'medium',
      owner: 'provider',
      blockers: ['Finalised message copy', 'Brand logo (PNG, square)', 'Sample messages prepared']
    })
  }

  // Step 5: Integration / API setup
  steps.push({
    week: reg ? (maxDays > 21 ? 'Week 4' : 'Week 3') : 'Week 2',
    title: 'Integrate API and test',
    description: `Connect your platform to the messaging API. Send test messages to internal numbers. Verify delivery receipts, opt-out handling, and content rendering across devices. Run a small pilot (100–500 sends) before full launch.`,
    effort: 'medium',
    owner: 'your-team',
    blockers: ['Development resource available', 'Test phone numbers in country']
  })

  // Step 6: Go live
  const launchWeek = calculateLaunchWeek(reg, maxDays)
  steps.push({
    week: launchWeek,
    title: 'Soft launch and monitor',
    description: `Send to a limited segment (5–10% of list) first. Monitor delivery rates, opt-out rates, and complaint rates closely for the first 48 hours. If delivery rate drops below 95% or opt-outs spike, pause and investigate before scaling.`,
    effort: 'low',
    owner: 'your-team',
    blockers: []
  })

  return steps
}

function buildRegistrationDescription(
  country: (typeof countriesData)[CountryCode],
  channelId: ChannelId,
  body: string,
  useCase: (typeof useCasesData)[UseCaseId]
): string {
  const countryCode = Object.entries(countriesData).find(([, v]) => v === country)?.[0]

  if (channelId === 'sms') {
    if (countryCode === 'US') {
      return `Register your brand and campaign on The Campaign Registry (TCR). You'll need: legal business name, EIN, website, use case description, opt-in method, and sample messages. TCR registration takes 1–5 business days; carrier vetting is separate and can take 1–3 additional weeks.`
    }
    if (countryCode === 'IN') {
      return `Register on a TRAI DLT platform (Airtel DLT, JioConnect, Vodafone DLT, or BSNL DLT). You must register: (1) your entity, (2) your sender header (alphanumeric ID), and (3) every message template individually. All three must be approved before you can send any message.`
    }
    if (countryCode === 'SG') {
      return `Register your sender ID on Singapore's SSIR (SMS Sender ID Registry) via IMDA. Without registration, your messages will be flagged as 'Likely-SCAM' by all Singapore carriers. Registration takes 3–5 business days.`
    }
    return `Submit sender ID registration to ${body}. Your messaging provider (e.g. Messente) will handle submission on your behalf — you provide business details, use case, and sample messages.`
  }

  if (channelId === 'whatsapp') {
    return `Complete Meta Business Verification. You'll need your business Facebook page, legal business documents, and a phone number that is NOT currently active on WhatsApp. Verification review takes 3–14 business days.`
  }

  if (channelId === 'rcs') {
    return `Submit RCS agent registration to ${body}. This involves Google RBM review plus separate carrier-level approval in ${country.name}. Total timeline is ${country.channels.rcs?.registration_timeline_days?.[0] ?? 14}–${country.channels.rcs?.registration_timeline_days?.[1] ?? 45} days. Prepare: brand logo, verified business website, use case description, and 5 sample messages.`
  }

  return `Complete registration with ${body}.`
}

function buildRegistrationBlockers(
  country: (typeof countriesData)[CountryCode],
  channelId: ChannelId
): string[] {
  const base = ['Legal business name and address', 'Business website (must be live)', 'Use case description written']

  if (channelId === 'sms') {
    const code = Object.entries(countriesData).find(([, v]) => v === country)?.[0]
    if (code === 'US') return [...base, 'EIN / Tax ID', 'Sample messages (2–3)', 'Opt-in method documented']
    if (code === 'IN') return [...base, 'Indian business registration', 'All message templates finalised (required before any send)', 'DLT platform account created']
    if (code === 'SG') return [...base, 'Singapore business entity (UEN)', 'Dedicated sender name decided']
  }

  if (channelId === 'whatsapp') {
    return ['Facebook Business page', 'Phone number not in WhatsApp app', ...base, 'Business verification documents (varies by country)']
  }

  if (channelId === 'rcs') {
    return [...base, 'Brand logo (1024×1024 PNG)', '5 sample messages ready', 'Dedicated phone number']
  }

  return base
}

function buildConsentDescription(
  country: (typeof countriesData)[CountryCode],
  useCase: (typeof useCasesData)[UseCaseId]
): string {
  const framework = country.compliance.framework
  const needsDouble = useCase.requires_double_optin?.includes(
    Object.entries(countriesData).find(([, v]) => v === country)?.[0] ?? ''
  )

  if (needsDouble) {
    return `${country.name} requires double opt-in (DOI) for marketing messages under ${framework}. Build a two-step consent flow: (1) initial opt-in (form/checkbox), (2) confirmation SMS or email. Store timestamped consent records — these must be producible on request by ${country.compliance.regulator}.`
  }

  if (useCase.id === 'otp') {
    return `OTP messages are treated as transactional — explicit marketing consent is not required, but users must have agreed to your terms of service which include authentication messaging. Document this in your T&Cs. Ensure you have a clear opt-out path even for OTP (${useCase.id === 'otp' ? 'less critical but good practice' : 'required'}).`
  }

  return `${country.name} requires explicit opt-in under ${framework}. Build a clear consent mechanism — checkbox at signup, explicit SMS keyword opt-in, or equivalent. Store opt-in timestamp, source, and opt-in text used. ${country.compliance.regulator} may request this data. Honour opt-outs within 24 hours.`
}

function buildConsentBlockers(
  country: (typeof countriesData)[CountryCode],
  useCase: (typeof useCasesData)[UseCaseId]
): string[] {
  if (useCase.id === 'otp') {
    return ['Terms of service updated to mention authentication messaging']
  }
  return [
    'Opt-in copy written and reviewed',
    'Consent storage implemented (timestamp + source)',
    'Opt-out mechanism live (STOP keyword)',
    useCase.requires_double_optin?.includes(Object.entries(countriesData).find(([, v]) => v === country)?.[0] ?? '')
      ? 'Double opt-in flow built and tested'
      : 'Opt-in flow live on your platform'
  ]
}

function calculateLaunchWeek(registrationRequired: boolean, maxDays: number): string {
  if (!registrationRequired) return 'Week 2'
  if (maxDays <= 7) return 'Week 2'
  if (maxDays <= 14) return 'Week 3'
  if (maxDays <= 30) return 'Week 4–5'
  return 'Week 6–8'
}

function calculateReadinessScore(country: (typeof countriesData)[CountryCode], channelId: ChannelId): number {
  const ch = country.channels[channelId]
  if (!ch || !ch.available) return 0

  let score = 100
  const reg = ch.registration_required ?? false
  const timeline = ch.registration_timeline_days as [number, number] | undefined
  const maxDays = timeline?.[1] ?? 7
  const gotchas = (ch.gotchas as string[] | undefined) ?? []

  if (reg) score -= 20
  if (maxDays > 14) score -= 10
  if (maxDays > 30) score -= 10
  if (gotchas.length > 2) score -= 10
  if (gotchas.some((g: string) => g.toUpperCase().includes('CRITICAL'))) score -= 20

  return Math.max(10, score)
}

export function generatePlan(
  selectedCountries: CountryCode[],
  selectedUseCase: UseCaseId
): LaunchPlan {
  const useCase = useCasesData[selectedUseCase]
  const channelPreference = useCase.preferred_channels_order as ChannelId[]

  const countryPlans: CountryPlan[] = selectedCountries.map((code) => {
    const country = countriesData[code]

    const available: { channel: ChannelId; score: number }[] = []
    const blocked: { channel: ChannelId; reason: string }[] = []

    for (const ch of ['sms', 'whatsapp', 'rcs'] as ChannelId[]) {
      const result = getChannelAvailability(country, useCase, ch)
      if (result.available) {
        const prefIndex = channelPreference.indexOf(ch)
        available.push({ channel: ch, score: prefIndex === -1 ? 99 : prefIndex })
      } else if (result.reason) {
        blocked.push({ channel: ch, reason: result.reason })
      }
    }

    available.sort((a, b) => a.score - b.score)

    const recommended = available[0]?.channel ?? 'sms'
    const alternatives = available.slice(1).map((a) => a.channel)

    const steps = buildStepsForChannel(country, recommended, useCase)

    const regCh = country.channels[recommended]
    const timeline = (regCh as { registration_timeline_days?: [number, number] })?.registration_timeline_days
    const totalMin = (timeline?.[0] ?? 1) + 7
    const totalMax = (timeline?.[1] ?? 7) + 14

    const costRange = (regCh as { cost_per_message_usd?: [number, number] })?.cost_per_message_usd ?? [0.01, 0.05]

    const gotchas = [
      ...((regCh as { gotchas?: string[] })?.gotchas ?? []),
      ...((country.channels[alternatives[0] ?? 'sms'] as { gotchas?: string[] })?.gotchas ?? []).slice(0, 1)
    ].slice(0, 5)

    const complianceChecklist = [
      `Opt-in mechanism built (${country.compliance.opt_in_type.replace('_', ' ')})`,
      `Opt-out keyword configured: ${country.compliance.opt_out_keyword}`,
      `Consent records stored with timestamp and source`,
      `Regulator: ${country.compliance.regulator} — review their guidance`,
      `Framework: ${country.compliance.framework}`,
      ...(country.compliance.data_residency !== 'US preferred' && country.compliance.data_residency.includes('EU')
        ? ['Data residency: EU — ensure your SMS provider stores data in EU']
        : [])
    ]

    return {
      country,
      countryCode: code,
      recommendedChannel: recommended,
      alternativeChannels: alternatives,
      blockedChannels: blocked,
      steps,
      totalTimelineDays: { min: totalMin, max: totalMax },
      estimatedCostPerMessage: { min: costRange[0], max: costRange[1] },
      criticalGotchas: gotchas,
      complianceChecklist,
      readinessScore: calculateReadinessScore(country, recommended)
    }
  })

  // Sort recommended launch order: highest readiness score first (easiest)
  const recommendedLaunchOrder = [...selectedCountries].sort((a, b) => {
    const planA = countryPlans.find((p) => p.countryCode === a)
    const planB = countryPlans.find((p) => p.countryCode === b)
    return (planB?.readinessScore ?? 0) - (planA?.readinessScore ?? 0)
  })

  const maxTimeline = Math.max(...countryPlans.map((p) => p.totalTimelineDays.max))
  const minTimeline = Math.max(...countryPlans.map((p) => p.totalTimelineDays.min))

  const globalChecklist = [
    'Legal entity confirmed in each target market (or EU entity for EU markets)',
    'Dedicated phone numbers acquired per country/channel',
    'Messaging provider (e.g. Messente) account set up with API access',
    'Privacy policy updated to mention SMS/messaging',
    'Opt-out database shared across all channels (SMS opt-out ≠ automatic WhatsApp opt-out)',
    'Internal team trained on compliance obligations',
    'Monitoring dashboard configured (delivery rate, opt-out rate, complaint rate)',
  ]

  return {
    generatedAt: new Date().toISOString(),
    useCase,
    countries: countryPlans,
    globalChecklist,
    estimatedTotalOnboardingWeeks: {
      min: Math.ceil(minTimeline / 7),
      max: Math.ceil(maxTimeline / 7)
    },
    recommendedLaunchOrder
  }
}
