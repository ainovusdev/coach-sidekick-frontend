'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Toast, useToast } from '@/components/ui/toast';
import { PreferencesService } from '@/services/preferences.service';
import PageLayout from '@/components/layout/page-layout';
import { Loader2, Save } from 'lucide-react';

export default function PreferencesPage() {
  const router = useRouter();
  const { toast, showToast, closeToast } = useToast();
  const [preferences, setPreferences] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPreferences = async () => {
    try {
      const data = await PreferencesService.getPreferences();
      setPreferences(data.coaching_preferences || '');
    } catch (error) {
      showToast('Failed to load preferences', 'error');
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences.trim()) {
      showToast('Please enter your coaching preferences', 'error');
      return;
    }

    setSaving(true);
    try {
      await PreferencesService.updatePreferences({
        coaching_preferences: preferences.trim(),
      });
      showToast('Preferences saved successfully', 'success');
    } catch (error) {
      showToast('Failed to save preferences', 'error');
      console.error('Error saving preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Coaching Style & Preferences</h1>
        <p className="text-muted-foreground">
          Customize how AI suggestions align with your coaching approach
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Coaching Approach</CardTitle>
          <CardDescription>
            Describe your coaching style, methodology, and preferences. This will help AI provide suggestions aligned with your approach.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Textarea
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="Describe your coaching approach..."
              className="min-h-[300px] resize-none"
              maxLength={2000}
            />
            <div className="mt-2 text-sm text-muted-foreground text-right">
              {preferences.length}/2000 characters
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <p className="text-sm font-medium">Examples of what to include:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Your primary coaching methodology (GO LIVE, GROW, Co-Active, etc.)</li>
              <li>Your coaching style (directive, facilitative, transformational, etc.)</li>
              <li>Types of questions you prefer to ask</li>
              <li>Areas you focus on most (leadership, career, personal growth, etc.)</li>
              <li>Any specific approaches you want AI to consider</li>
              <li>What you want to avoid in your coaching</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Example Preference Descriptions:</h3>
            
            <div className="space-y-3">
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-sm italic">
                 {` "I follow the GO LIVE methodology with a focus on transformational coaching. 
                  I prefer asking powerful, open-ended questions that help clients discover 
                  their own solutions. My style is facilitative rather than directive. 
                  I emphasize emotional intelligence and self-awareness in my sessions."`}
                </p>
              </div>
              
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-sm italic">
                  {`"Executive coach specializing in leadership development. I use a direct, 
                  challenging approach combined with compassion. I focus on accountability, 
                  results, and sustainable behavior change. I often incorporate business 
                  strategy into my coaching conversations."`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !preferences.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

        {/* Toast Notification */}
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={closeToast} />
        )}
      </div>
    </PageLayout>
  );
}