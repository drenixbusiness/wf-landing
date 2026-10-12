import Link from 'next/link';
import type { LeadKind } from '@/lib/leads';

// Optional, unchecked-by-default SMS opt-in, kept separate from Terms/Privacy acceptance
// (A2P 10DLC / CTIA). The visible wording must match SMS_CONSENT in lib/leads.ts.
export default function SmsConsent({ kind, checked, onChange }: { kind: LeadKind; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="consent-box" data-sms-consent="">
      <label className="check">
        <input type="checkbox" name="sms_consent" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        {kind === 'application' ? (
          <span>
            Yes, I agree to receive recurring automated text messages from <strong>Wildfire Express LLC</strong> at the mobile number
            provided about my driver application, interview scheduling, onboarding and job-related updates. Consent is not a condition
            of employment or of submitting this application. Message frequency varies. Message &amp; data rates may apply.
            Reply <strong>HELP</strong> for help or <strong>STOP</strong> to opt out at any time. See our{' '}
            <Link href="/privacy" target="_blank">Privacy Policy</Link> and <Link href="/terms#sms" target="_blank">SMS Terms</Link>.
          </span>
        ) : (
          <span>
            Yes, I agree to receive text messages from <strong>Wildfire Express LLC</strong> at the phone number provided in reply to this
            inquiry, including recruiting and customer-care follow-ups. Consent is not a condition of any purchase or employment. Message
            frequency varies. Message &amp; data rates may apply. Reply <strong>HELP</strong> for help or <strong>STOP</strong> to opt
            out. See our <Link href="/privacy" target="_blank">Privacy Policy</Link> and{' '}
            <Link href="/terms#sms" target="_blank">SMS Terms</Link>.
          </span>
        )}
      </label>
    </div>
  );
}
