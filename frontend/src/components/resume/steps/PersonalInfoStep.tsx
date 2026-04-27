import { User, Mail, Phone, MapPin, Globe, Link2 } from 'lucide-react';
import Input from '../../ui/Input';
import type { PersonalInfo } from '../types';

interface PersonalInfoStepProps { data: PersonalInfo; onChange: (d: PersonalInfo) => void; }

export default function PersonalInfoStep({ data, onChange }: PersonalInfoStepProps) {
  const set = (field: keyof PersonalInfo, value: string) => onChange({ ...data, [field]: value });

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>Personal Information</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Your basic contact details</p>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Full Name" placeholder="Sachin Rao Mandhiya" value={data.name} onChange={e => set('name', e.target.value)} icon={User} fullWidth />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Input label="Email" type="email" placeholder="you@example.com" value={data.email} onChange={e => set('email', e.target.value)} icon={Mail} fullWidth />
          <Input label="Phone" type="tel" placeholder="+91 98765 43210" value={data.phone} onChange={e => set('phone', e.target.value)} icon={Phone} fullWidth />
        </div>

        <Input label="Location" placeholder="Bangalore, India" value={data.location} onChange={e => set('location', e.target.value)} icon={MapPin} fullWidth />
        <Input label="Link2" placeholder="Link2.com/in/yourname" value={data.Link2} onChange={e => set('Link2', e.target.value)} icon={Link2} fullWidth helperText="Optional" />
        <Input label="Website / Portfolio" placeholder="yoursite.com" value={data.website} onChange={e => set('website', e.target.value)} icon={Globe} fullWidth helperText="Optional" />
      </div>
    </div>
  );
}
