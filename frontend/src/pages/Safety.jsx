import React, { useState, useEffect, useCallback } from 'react';
import {
  getEmergencyContacts,
  updateEmergencyContacts,
  getSafetyAlerts,
  resolveAlert,
  createIncidentReport,
  getIncidentReports,
} from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import {
  ShieldCheck, UserPlus, Trash2, Phone, Plus, AlertTriangle,
  Bell, FileWarning, CheckCircle, MapPin,
} from 'lucide-react';
import { toast } from 'sonner';

const SAFETY_TIPS = [
  'All DoorGuard trainers pass a background and identity check before joining.',
  'Share your session details with a friend or family member beforehand.',
  'Use the in-app Check-In when your trainer arrives and Check-Out when you finish.',
  'Keep the red SOS button handy — it alerts your emergency contacts instantly.',
  'Trust your instincts. If something feels off, end the session and report it.',
];

const Safety = () => {
  const [contacts, setContacts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [report, setReport] = useState({ concern_type: 'safety', description: '' });
  const [submittingReport, setSubmittingReport] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [c, a, r] = await Promise.all([
        getEmergencyContacts(),
        getSafetyAlerts(),
        getIncidentReports(),
      ]);
      setContacts(c.data.contacts || []);
      setAlerts(a.data || []);
      setReports(r.data || []);
    } catch (e) {
      console.error('Failed to load safety data', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const addContact = () =>
    setContacts([...contacts, { name: '', phone: '', relationship: '' }]);

  const updateContact = (i, field, value) => {
    const next = [...contacts];
    next[i] = { ...next[i], [field]: value };
    setContacts(next);
  };

  const removeContact = (i) => setContacts(contacts.filter((_, idx) => idx !== i));

  const saveContacts = async () => {
    const valid = contacts.filter((c) => c.name.trim() && c.phone.trim());
    setSaving(true);
    try {
      await updateEmergencyContacts(valid);
      setContacts(valid);
      toast.success('Emergency contacts saved');
    } catch (e) {
      toast.error('Failed to save contacts');
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await resolveAlert(id);
      toast.success('Alert marked resolved');
      loadAll();
    } catch (e) {
      toast.error('Failed to update alert');
    }
  };

  const submitReport = async () => {
    if (!report.description.trim()) {
      toast.error('Please describe what happened');
      return;
    }
    setSubmittingReport(true);
    try {
      await createIncidentReport(report);
      toast.success('Report submitted to our Trust & Safety team');
      setReport({ concern_type: 'safety', description: '' });
      loadAll();
    } catch (e) {
      toast.error('Failed to submit report');
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] py-8 px-4 sm:px-6 lg:px-8" data-testid="safety-page">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center gap-3">
          <ShieldCheck className="w-9 h-9 text-[#C0A062]" />
          <div>
            <h1 className="text-3xl font-bold text-white">Safety Center</h1>
            <p className="text-zinc-400">Your trust & safety controls for in-home training</p>
          </div>
        </div>

        <Tabs defaultValue="contacts" className="w-full">
          <TabsList className="bg-zinc-800/50 border border-zinc-700 mb-6 flex-wrap h-auto">
            <TabsTrigger value="contacts" className="data-[state=active]:bg-[#C0A062] data-[state=active]:text-black" data-testid="tab-contacts">
              Emergency Contacts
            </TabsTrigger>
            <TabsTrigger value="report" className="data-[state=active]:bg-[#C0A062] data-[state=active]:text-black" data-testid="tab-report">
              Report a Concern
            </TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-[#C0A062] data-[state=active]:text-black" data-testid="tab-alerts">
              Alert History
            </TabsTrigger>
            <TabsTrigger value="tips" className="data-[state=active]:bg-[#C0A062] data-[state=active]:text-black" data-testid="tab-tips">
              Safety Tips
            </TabsTrigger>
          </TabsList>

          {/* Emergency Contacts */}
          <TabsContent value="contacts">
            <div className="bg-[#18181B] border border-zinc-800 rounded-lg p-6">
              <p className="text-zinc-400 mb-6 text-sm">
                These people are instantly notified with your location when you press the red SOS button.
              </p>
              <div className="space-y-4">
                {contacts.length === 0 && (
                  <p className="text-zinc-500 text-center py-6">No emergency contacts yet. Add one below.</p>
                )}
                {contacts.map((c, i) => (
                  <div key={i} className="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end" data-testid={`contact-row-${i}`}>
                    <div>
                      <Label className="text-zinc-300 text-xs">Name</Label>
                      <Input value={c.name} onChange={(e) => updateContact(i, 'name', e.target.value)} placeholder="Jane Doe" className="mt-1 bg-zinc-800/50 border-zinc-700 text-white" data-testid={`contact-name-${i}`} />
                    </div>
                    <div>
                      <Label className="text-zinc-300 text-xs">Phone</Label>
                      <Input value={c.phone} onChange={(e) => updateContact(i, 'phone', e.target.value)} placeholder="+1 555 123 4567" className="mt-1 bg-zinc-800/50 border-zinc-700 text-white" data-testid={`contact-phone-${i}`} />
                    </div>
                    <div>
                      <Label className="text-zinc-300 text-xs">Relationship</Label>
                      <Input value={c.relationship || ''} onChange={(e) => updateContact(i, 'relationship', e.target.value)} placeholder="Sister" className="mt-1 bg-zinc-800/50 border-zinc-700 text-white" data-testid={`contact-rel-${i}`} />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeContact(i)} className="text-red-400 hover:bg-red-500/10" data-testid={`remove-contact-${i}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 mt-6">
                <Button variant="outline" onClick={addContact} className="border-zinc-700 text-zinc-200 hover:bg-white/5" data-testid="add-contact-btn">
                  <UserPlus className="w-4 h-4 mr-2" /> Add Contact
                </Button>
                <Button onClick={saveContacts} disabled={saving} className="btn-primary" data-testid="save-contacts-btn">
                  {saving ? 'Saving...' : 'Save Contacts'}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Report a Concern */}
          <TabsContent value="report">
            <div className="bg-[#18181B] border border-zinc-800 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2 text-[#C0A062]">
                <FileWarning className="w-5 h-5" />
                <h2 className="text-lg font-bold text-white">Report an Incident</h2>
              </div>
              <p className="text-zinc-400 text-sm">
                Reports are confidential and reviewed by our Trust & Safety team.
              </p>
              <div>
                <Label className="text-zinc-300">Type of concern</Label>
                <Select value={report.concern_type} onValueChange={(v) => setReport({ ...report, concern_type: v })}>
                  <SelectTrigger className="mt-2 bg-zinc-800/50 border-zinc-700 text-white" data-testid="report-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#18181B] border-zinc-800">
                    <SelectItem value="safety">Safety / Feeling unsafe</SelectItem>
                    <SelectItem value="conduct">Inappropriate conduct</SelectItem>
                    <SelectItem value="no_show">Trainer no-show</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-300">What happened?</Label>
                <Textarea value={report.description} onChange={(e) => setReport({ ...report, description: e.target.value })} placeholder="Describe the situation in as much detail as you can..." className="mt-2 bg-zinc-800/50 border-zinc-700 text-white min-h-[120px]" data-testid="report-description" />
              </div>
              <Button onClick={submitReport} disabled={submittingReport} className="btn-primary" data-testid="submit-report-btn">
                {submittingReport ? 'Submitting...' : 'Submit Report'}
              </Button>

              {reports.length > 0 && (
                <div className="pt-4 border-t border-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-300 mb-3">Your past reports</h3>
                  <div className="space-y-2">
                    {reports.map((r) => (
                      <div key={r.id} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg" data-testid={`report-${r.id}`}>
                        <span className="text-zinc-300 text-sm capitalize">{r.concern_type.replace('_', ' ')}</span>
                        <Badge className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 capitalize">{r.status.replace('_', ' ')}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Alert History */}
          <TabsContent value="alerts">
            <div className="bg-[#18181B] border border-zinc-800 rounded-lg p-6">
              {alerts.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400">No emergency alerts triggered. Good — keep it that way!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((a) => (
                    <div key={a.id} className="flex items-start justify-between p-4 bg-zinc-800/30 rounded-lg" data-testid={`alert-${a.id}`}>
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                        <div>
                          <p className="text-white font-medium">SOS Alert</p>
                          <p className="text-zinc-400 text-sm">{new Date(a.created_at).toLocaleString()}</p>
                          {a.message && <p className="text-zinc-300 text-sm mt-1">"{a.message}"</p>}
                          {(a.latitude && a.longitude) && (
                            <p className="text-zinc-500 text-xs mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {a.latitude.toFixed(4)}, {a.longitude.toFixed(4)}
                            </p>
                          )}
                          <p className="text-zinc-500 text-xs mt-1">{a.notified_contacts?.length || 0} contact(s) notified</p>
                        </div>
                      </div>
                      {a.status === 'active' ? (
                        <Button size="sm" variant="outline" onClick={() => handleResolve(a.id)} className="border-green-500/30 text-green-400 hover:bg-green-500/10" data-testid={`resolve-${a.id}`}>
                          Mark Safe
                        </Button>
                      ) : (
                        <Badge className="bg-green-500/10 text-green-400 border border-green-500/20">
                          <CheckCircle className="w-3 h-3 mr-1" /> Resolved
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Safety Tips */}
          <TabsContent value="tips">
            <div className="bg-[#18181B] border border-zinc-800 rounded-lg p-6">
              <ul className="space-y-4">
                {SAFETY_TIPS.map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-zinc-300">
                    <ShieldCheck className="w-5 h-5 text-[#C0A062] mt-0.5 shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Safety;
