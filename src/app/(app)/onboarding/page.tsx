'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Home, UserPlus, Plus } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'

type Step = 'choice' | 'create' | 'join' | 'done'

export default function OnboardingPage() {
  const { update } = useSession()
  const router = useRouter()
  const { addToast } = useToast()

  const [step, setStep] = useState<Step>('choice')
  const [houseName, setHouseName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [createdCode, setCreatedCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!houseName.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/house', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: houseName.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create house')
        setLoading(false)
        return
      }

      setCreatedCode(data.house.inviteCode)
      await update({ houseId: data.house.id, houseName: data.house.name })
      setStep('done')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteCode.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/house/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to join house')
        setLoading(false)
        return
      }

      await update({ houseId: data.house.id, houseName: data.house.name })
      addToast(`Welcome to ${data.house.name}!`)
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const stepIndex = step === 'choice' ? 0 : step === 'done' ? 2 : 1

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        {/* Steps indicator */}
        <div className="steps-indicator">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`step-dot ${i === stepIndex ? 'active' : ''}`} />
          ))}
        </div>

        {/* Step: Choice */}
        {step === 'choice' && (
          <div className="onboarding-step">
            <h2>Welcome to Together</h2>
            <p>Set up your accountability space. Would you like to create a new House or join an existing one?</p>

            <div className="onboarding-options">
              <button className="onboarding-option" onClick={() => setStep('create')}>
                <div className="flex items-center gap-md">
                  <Home size={24} style={{ color: 'var(--color-accent)' }} />
                  <div>
                    <h3>Create a House</h3>
                    <p>Start fresh and invite your partner</p>
                  </div>
                </div>
              </button>

              <button className="onboarding-option" onClick={() => setStep('join')}>
                <div className="flex items-center gap-md">
                  <UserPlus size={24} style={{ color: 'var(--color-accent)' }} />
                  <div>
                    <h3>Join a House</h3>
                    <p>Enter an invite code to join</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step: Create */}
        {step === 'create' && (
          <div className="onboarding-step">
            <h2>Name Your House</h2>
            <p>Give your shared space a name.</p>

            <form onSubmit={handleCreate} style={{ textAlign: 'left' }}>
              {error && <div className="auth-error mb-lg">{error}</div>}

              <div className="form-group mb-xl">
                <label htmlFor="house-name">House Name</label>
                <input
                  id="house-name"
                  type="text"
                  value={houseName}
                  onChange={(e) => setHouseName(e.target.value)}
                  placeholder="e.g., The Productivity House"
                  required
                  autoFocus
                  maxLength={50}
                />
              </div>

              <div className="flex gap-sm">
                <button type="button" className="btn btn-ghost" onClick={() => { setStep('choice'); setError('') }}>
                  Back
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                  {loading ? 'Creating...' : 'Create House'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step: Join */}
        {step === 'join' && (
          <div className="onboarding-step">
            <h2>Join a House</h2>
            <p>Enter the invite code shared by your partner.</p>

            <form onSubmit={handleJoin} style={{ textAlign: 'left' }}>
              {error && <div className="auth-error mb-lg">{error}</div>}

              <div className="form-group mb-xl">
                <label htmlFor="invite-code">Invite Code</label>
                <input
                  id="invite-code"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Enter 8-character code"
                  required
                  autoFocus
                  maxLength={8}
                  style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'monospace', fontSize: 'var(--font-size-lg)', textAlign: 'center' }}
                />
              </div>

              <div className="flex gap-sm">
                <button type="button" className="btn btn-ghost" onClick={() => { setStep('choice'); setError('') }}>
                  Back
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                  {loading ? 'Joining...' : 'Join House'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="onboarding-step">
            <h2>Your House is ready! 🏠</h2>
            <p>Invite one person to keep you accountable.</p>

            <div className="invite-code-display mb-xl">
              <p className="text-sm text-muted mb-md">Share this invite code:</p>
              <div className="invite-code">{createdCode}</div>
            </div>

            <button
              className="btn btn-secondary mb-lg w-full"
              onClick={async () => {
                await navigator.clipboard.writeText(createdCode)
                addToast('Code copied!')
              }}
            >
              Copy Invite Code
            </button>

            <button
              className="btn btn-primary w-full"
              onClick={() => { router.push('/dashboard'); router.refresh() }}
            >
              Go to Dashboard
            </button>

            <p className="text-sm text-muted mt-xl">
              You can always find your invite code on the House page.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
