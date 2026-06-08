'use client'

import { useState } from 'react'
import countriesData from '../data/countries.json'
import useCasesData from '../data/use-cases.json'
import { generatePlan, type CountryCode, type UseCaseId, type LaunchPlan } from '../lib/planner'

const COUNTRIES = Object.entries(countriesData) as [CountryCode, (typeof countriesData)[CountryCode]][]
const USE_CASES = Object.entries(useCasesData) as [UseCaseId, (typeof useCasesData)[UseCaseId]][]

const CHANNEL_COLORS: Record<string, string> = {
  sms: 'bg-blue-100 text-blue-800 border-blue-200',
  whatsapp: 'bg-green-100 text-green-800 border-green-200',
  rcs: 'bg-purple-100 text-purple-800 border-purple-200',
}

const CHANNEL_LABELS: Record<string, string> = {
  sms: 'SMS',
  whatsapp: 'WhatsApp',
  rcs: 'RCS',
}

const EFFORT_COLORS: Record<string, string> = {
  low: 'bg-green-50 text-green-700',
  medium: 'bg-amber-50 text-amber-700',
  high: 'bg-red-50 text-red-700',
}

const OWNER_LABELS: Record<string, string> = {
  'your-team': 'Your team',
  provider: 'Messente',
  carrier: 'Carrier / Regulator',
  regulator: 'Regulator',
}

export default function PlannerPage() {
  const [selectedCountries, setSelectedCountries] = useState<CountryCode[]>([])
  const [selectedUseCase, setSelectedUseCase] = useState<UseCaseId | null>(null)
  const [plan, setPlan] = useState<LaunchPlan | null>(null)
  const [activeCountryTab, setActiveCountryTab] = useState<CountryCode | null>(null)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showGotchas, setShowGotchas] = useState<Record<string, boolean>>({})

  function toggleCountry(code: CountryCode) {
    setSelectedCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : prev.length < 8 ? [...prev, code] : prev
    )
    setPlan(null)
  }

  function handleGenerate() {
    if (!selectedUseCase || selectedCountries.length === 0) return
    const p = generatePlan(selectedCountries, selectedUseCase)
    setPlan(p)
    setActiveCountryTab(selectedCountries[0])
    setTimeout(() => {
      document.getElementById('plan-output')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    // In production: POST to your email capture endpoint
    console.log('Lead email:', email, 'Plan countries:', selectedCountries, 'Use case:', selectedUseCase)
  }

  const activePlan = plan?.countries.find((p) => p.countryCode === activeCountryTab)
  const regions = [...new Set(COUNTRIES.map(([, c]) => c.region))]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <span className="font-semibold text-gray-900">Messente</span>
              <span className="text-gray-400 mx-2">·</span>
              <span className="text-gray-600 text-sm">Messaging Launch Planner</span>
            </div>
          </div>
          <a href="https://messente.com" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            messente.com →
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-sm font-medium px-4 py-2 rounded-full mb-6 border border-brand-100">
            <span>🗺️</span> 15 countries · 3 channels · free tool
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
            Your messaging launch plan,<br />country by country
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Select your target countries and use case. Get a step-by-step launch plan with registration timelines, compliance checklist, and the gotchas nobody else tells you about.
          </p>
        </div>

        {/* Step 1: Use case */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-full bg-brand-600 text-white text-sm font-bold flex items-center justify-center">1</div>
            <h2 className="text-lg font-semibold text-gray-900">What are you sending?</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {USE_CASES.map(([id, uc]) => (
              <button
                key={id}
                onClick={() => { setSelectedUseCase(id); setPlan(null) }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedUseCase === id
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-2">{uc.icon}</div>
                <div className="font-medium text-gray-900 text-sm">{uc.label}</div>
                <div className="text-xs text-gray-500 mt-1 leading-relaxed">{uc.description}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Step 2: Countries */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-full bg-brand-600 text-white text-sm font-bold flex items-center justify-center">2</div>
            <h2 className="text-lg font-semibold text-gray-900">Select your target countries</h2>
            <span className="text-sm text-gray-400">({selectedCountries.length}/8 selected)</span>
          </div>

          {regions.map((region) => (
            <div key={region} className="mb-6">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{region}</div>
              <div className="flex flex-wrap gap-2">
                {COUNTRIES.filter(([, c]) => c.region === region).map(([code, country]) => {
                  const selected = selectedCountries.includes(code)
                  const disabled = !selected && selectedCountries.length >= 8
                  return (
                    <button
                      key={code}
                      onClick={() => toggleCountry(code)}
                      disabled={disabled}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border font-medium text-sm transition-all ${
                        selected
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : disabled
                          ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-lg leading-none">{country.flag}</span>
                      <span>{country.name}</span>
                      {selected && (
                        <svg className="w-3.5 h-3.5 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </section>

        {/* Generate button */}
        <div className="flex justify-center mb-16">
          <button
            onClick={handleGenerate}
            disabled={!selectedUseCase || selectedCountries.length === 0}
            className="inline-flex items-center gap-3 px-8 py-4 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-all text-lg shadow-sm disabled:shadow-none"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Generate my launch plan
          </button>
        </div>

        {/* Plan output */}
        {plan && (
          <div id="plan-output">
            {/* Summary bar */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {plan.useCase.icon} {plan.useCase.label} launch plan
                  </h2>
                  <p className="text-gray-500 text-sm">
                    {plan.countries.length} {plan.countries.length === 1 ? 'country' : 'countries'} ·{' '}
                    {plan.estimatedTotalOnboardingWeeks.min}–{plan.estimatedTotalOnboardingWeeks.max} weeks to fully live
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-500 font-medium">Easiest to launch first:</span>
                  {plan.recommendedLaunchOrder.map((code) => {
                    const c = countriesData[code]
                    return (
                      <span key={code} className="inline-flex items-center gap-1 text-sm bg-gray-100 px-2.5 py-1 rounded-lg">
                        {c.flag} {c.name}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Country tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
              {plan.countries.map((cp) => (
                <button
                  key={cp.countryCode}
                  onClick={() => setActiveCountryTab(cp.countryCode)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium text-sm whitespace-nowrap transition-all ${
                    activeCountryTab === cp.countryCode
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span>{cp.country.flag}</span>
                  <span>{cp.country.name}</span>
                  <span className={`w-2 h-2 rounded-full ${cp.readinessScore >= 70 ? 'bg-green-400' : cp.readinessScore >= 50 ? 'bg-amber-400' : 'bg-red-400'}`} />
                </button>
              ))}
            </div>

            {/* Active country plan */}
            {activePlan && (
              <div className="space-y-6">
                {/* Country header */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-4xl">{activePlan.country.flag}</span>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">{activePlan.country.name}</h3>
                          <p className="text-gray-500 text-sm">{activePlan.country.region}</p>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed max-w-xl">{activePlan.country.market_notes}</p>
                    </div>
                    <div className="space-y-2 text-sm min-w-[200px]">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Recommended channel</span>
                        <span className={`px-2.5 py-0.5 rounded-md border text-xs font-semibold ${CHANNEL_COLORS[activePlan.recommendedChannel]}`}>
                          {CHANNEL_LABELS[activePlan.recommendedChannel]}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Setup time</span>
                        <span className="font-medium text-gray-900">
                          {Math.ceil(activePlan.totalTimelineDays.min / 7)}–{Math.ceil(activePlan.totalTimelineDays.max / 7)} weeks
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Cost per message</span>
                        <span className="font-medium text-gray-900">
                          ${activePlan.estimatedCostPerMessage.min.toFixed(3)}–${activePlan.estimatedCostPerMessage.max.toFixed(3)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Setup complexity</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className={`w-4 h-1.5 rounded-full ${i <= Math.ceil((100 - activePlan.readinessScore) / 20) ? 'bg-amber-400' : 'bg-gray-200'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Alternative channels */}
                  {activePlan.alternativeChannels.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap pt-4 border-t border-gray-100">
                      <span className="text-xs text-gray-400 font-medium">Also available:</span>
                      {activePlan.alternativeChannels.map((ch) => (
                        <span key={ch} className={`px-2 py-0.5 rounded border text-xs font-medium ${CHANNEL_COLORS[ch]}`}>
                          {CHANNEL_LABELS[ch]}
                        </span>
                      ))}
                      {activePlan.blockedChannels.map(({ channel, reason }) => (
                        <span key={channel} className="px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-400 text-xs line-through" title={reason}>
                          {CHANNEL_LABELS[channel]}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Critical gotchas */}
                {activePlan.criticalGotchas.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                    <button
                      className="w-full flex items-center justify-between"
                      onClick={() => setShowGotchas((prev) => ({ ...prev, [activePlan.countryCode]: !prev[activePlan.countryCode] }))}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div className="text-left">
                          <div className="font-semibold text-amber-900">
                            {activePlan.criticalGotchas.filter((g) => g.toUpperCase().includes('CRITICAL')).length > 0
                              ? '⛔ Critical issues to know before you start'
                              : `${activePlan.criticalGotchas.length} things that catch most senders in ${activePlan.country.name}`}
                          </div>
                          <div className="text-amber-700 text-sm">These are the gotchas competitors don't document</div>
                        </div>
                      </div>
                      <svg className={`w-5 h-5 text-amber-600 transition-transform ${showGotchas[activePlan.countryCode] !== false ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showGotchas[activePlan.countryCode] !== false && (
                      <ul className="mt-4 space-y-2">
                        {activePlan.criticalGotchas.map((gotcha, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                            <span className="mt-0.5 text-amber-500 flex-shrink-0">
                              {gotcha.toUpperCase().includes('CRITICAL') ? '⛔' : '→'}
                            </span>
                            <span>{gotcha}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Launch steps */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h4 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Step-by-step launch plan
                  </h4>
                  <div className="space-y-0">
                    {activePlan.steps.map((step, i) => (
                      <div key={i} className={`relative flex gap-4 pb-8 ${i < activePlan.steps.length - 1 ? 'step-connector' : ''}`}>
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-50 border-2 border-brand-200 flex items-center justify-center text-sm font-bold text-brand-600 z-10 bg-white">
                          {i + 1}
                        </div>
                        <div className="flex-1 pt-1.5 min-w-0">
                          <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                            <div>
                              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{step.week}</span>
                              <h5 className="font-semibold text-gray-900 text-sm mt-0.5">{step.title}</h5>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${EFFORT_COLORS[step.effort]}`}>
                                {step.effort === 'low' ? 'Simple' : step.effort === 'medium' ? 'Some effort' : 'Complex'}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-medium">
                                {OWNER_LABELS[step.owner]}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm leading-relaxed mb-3">{step.description}</p>
                          {step.blockers.length > 0 && (
                            <div>
                              <div className="text-xs font-medium text-gray-400 mb-1.5">You'll need:</div>
                              <div className="flex flex-wrap gap-1.5">
                                {step.blockers.map((b, bi) => (
                                  <span key={bi} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    {b}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compliance checklist */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Compliance checklist — {activePlan.country.name}
                  </h4>
                  <div className="space-y-2">
                    {activePlan.complianceChecklist.map((item, i) => (
                      <label key={i} className="flex items-start gap-3 cursor-pointer group">
                        <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Global checklist */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 mt-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
                Global checklist (all markets)
              </h4>
              <div className="space-y-2">
                {plan.globalChecklist.map((item, i) => (
                  <label key={i} className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Lead capture */}
            <div className="mt-8 bg-brand-600 rounded-2xl p-8 text-white text-center">
              {submitted ? (
                <div>
                  <div className="text-4xl mb-3">✅</div>
                  <h3 className="text-xl font-bold mb-2">Plan sent to your inbox</h3>
                  <p className="text-brand-200">We'll also send you a free PDF version. A Messente expert will reach out to help you get live faster.</p>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-bold mb-2">Get this plan as a PDF + expert review</h3>
                  <p className="text-brand-200 mb-6 text-sm">
                    We'll send you a formatted PDF of this plan plus a free 30-min call with a Messente messaging expert who has launched in all these markets.
                  </p>
                  <form onSubmit={handleSubmit} className="flex gap-3 max-w-md mx-auto">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="flex-1 px-4 py-3 rounded-xl text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white"
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 bg-white text-brand-700 font-semibold rounded-xl hover:bg-brand-50 transition-colors text-sm whitespace-nowrap"
                    >
                      Send my plan
                    </button>
                  </form>
                  <p className="text-brand-300 text-xs mt-3">No spam. One email with your plan + optional follow-up.</p>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-16 border-t border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between flex-wrap gap-4 text-sm text-gray-400">
          <div>
            Built by <a href="https://messente.com" className="text-gray-600 hover:text-gray-900">Messente</a> · Business messaging infrastructure since 2014
          </div>
          <div className="flex items-center gap-4">
            <span>Data current as of June 2026</span>
            <span>·</span>
            <a href="https://messente.com/terms" className="hover:text-gray-600">Terms</a>
            <span>·</span>
            <a href="https://messente.com/privacy" className="hover:text-gray-600">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
