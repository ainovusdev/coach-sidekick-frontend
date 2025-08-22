'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Save, Settings } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

export function CoachingPreferenceSettings() {
  const [preference, setPreference] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchPreference()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPreference = async () => {
    setLoading(true)
    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to manage your preferences',
          variant: 'destructive',
        })
        return
      }

      // Fetch the preference directly using Supabase client
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('coaching_preference')
        .eq('id', session.user.id)
        .single()

      if (error) {
        console.error('Error fetching preference:', error)
        if (error.code !== 'PGRST116') { // Not a "no rows" error
          toast({
            title: 'Error',
            description: 'Failed to load coaching preference',
            variant: 'destructive',
          })
        }
      } else {
        setPreference(profile?.coaching_preference || '')
      }
    } catch (error) {
      console.error('Error fetching coaching preference:', error)
      toast({
        title: 'Error',
        description: 'Failed to load coaching preference',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const savePreference = async () => {
    setSaving(true)
    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to save your preferences',
          variant: 'destructive',
        })
        return
      }

      // Update the preference directly using Supabase client
      const { error } = await supabase
        .from('profiles')
        .update({ 
          coaching_preference: preference,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id)

      if (error) {
        console.error('Error saving preference:', error)
        toast({
          title: 'Error',
          description: error.message || 'Failed to save coaching preference',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Success',
          description: 'Coaching preference saved successfully',
        })
      }
    } catch (error) {
      console.error('Error saving coaching preference:', error)
      toast({
        title: 'Error',
        description: 'Failed to save coaching preference',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Coaching Preference
        </CardTitle>
        <CardDescription>
          Define your coaching style and preferences. This will be used to personalize AI suggestions during your coaching sessions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Your Coaching Style & Preferences
              </label>
              <Textarea
                value={preference}
                onChange={(e) => setPreference(e.target.value)}
                placeholder="Example: I prefer a direct, action-oriented coaching style. I focus on helping clients identify concrete steps and measurable outcomes. I value accountability and clear commitments. I like to challenge limiting beliefs while maintaining a supportive environment..."
                className="min-h-[150px]"
              />
              <p className="text-xs text-muted-foreground">
                Include details about your coaching philosophy, preferred approaches, areas of focus, and any specific methodologies you follow.
              </p>
            </div>
            <Button
              onClick={savePreference}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Preference
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}