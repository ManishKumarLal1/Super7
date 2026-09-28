import { SignIn } from '@clerk/react';
import { Navigate } from 'react-router-dom';
import { Show } from '@clerk/react';

export function SignInPage() {
  return (
    <>
      <Show when="signed-in">
        <Navigate to="/contests" replace />
      </Show>

      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-6">
        {/* Ambient stadium glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.15),transparent_60%)]" />

        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative z-10 w-full max-w-md">
          <div className="mb-10 text-center">
            <div className="text-3xl font-bold tracking-tight text-white">
              SUPER<span className="text-emerald-400">7</span>
            </div>
            <p className="mt-3 text-sm text-white/50">
              Sign in to enter contests and draft your squad.
            </p>
          </div>

          <SignIn
            appearance={{
              variables: {
                colorPrimary: '#10b981',
                colorBackground: '#0a0a0a',
                colorText: '#ffffff',
                colorTextSecondary: 'rgba(255,255,255,0.6)',
                colorInputBackground: 'rgba(255,255,255,0.03)',
                colorInputText: '#ffffff',
                colorNeutral: '#ffffff',
                borderRadius: '0.75rem',
              },
              elements: {
                rootBox: 'w-full',
                card:
                  'bg-white/[0.02] border border-white/10 shadow-2xl backdrop-blur-xl',
                headerTitle: 'text-white',
                headerSubtitle: 'text-white/50',
                socialButtonsBlockButton:
                  'bg-white/5 border border-white/10 text-white hover:bg-white/10',
                socialButtonsBlockButtonText: 'text-white font-medium',
                formFieldLabel: 'text-white/70',
                formFieldInput:
                  'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 focus:border-emerald-400 focus:ring-emerald-400/20',
                formButtonPrimary:
                  'bg-emerald-400 text-black font-semibold hover:bg-emerald-300 normal-case',
                footerActionText: 'text-white/50',
                footerActionLink:
                  'text-emerald-400 hover:text-emerald-300 font-medium',
                dividerText: 'text-white/40',
                dividerLine: 'bg-white/10',
                identityPreviewText: 'text-white',
                identityPreviewEditButton: 'text-emerald-400',
                formFieldSuccessText: 'text-emerald-400',
                formFieldErrorText: 'text-red-400',
                alert: 'bg-red-500/10 border border-red-500/20 text-red-300',
                alertText: 'text-red-300',
                otpCodeFieldInput: 'bg-white/5 border-white/10 text-white',
              },
            }}
          />
        </div>
      </div>
    </>
  );
}