/**
 * Compatibility layer: re-exports Supabase-backed implementations
 * using the same `base44` named export so existing imports still work.
 *
 * Old: import { base44 } from '@/api/base44Client';
 *      base44.entities.User.filter(...)
 *      base44.auth.me()
 *
 * Now backed by Supabase instead of Base44 SDK.
 */

import { supabase } from './supabaseClient';
import { entities } from './entities';

export const base44 = {
  entities,

  auth: {
    /**
     * Get the current authenticated user.
     * Returns user metadata matching Base44's auth.me() shape.
     */
    async me() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) throw error || new Error('Not authenticated');

      const meta = user.user_metadata || {};
      return {
        id: user.id,
        email: user.email,
        first_name: meta.first_name || meta.full_name?.split(' ')[0] || '',
        last_name: meta.last_name || meta.full_name?.split(' ').slice(1).join(' ') || '',
        full_name: meta.full_name || `${meta.first_name || ''} ${meta.last_name || ''}`.trim(),
        avatar_url: meta.avatar_url || meta.picture || '',
        role: 'guest',
      };
    },

    /**
     * Redirect to Google OAuth login.
     * Base44 called: base44.auth.redirectToLogin(returnPath)
     */
    async redirectToLogin(returnPath) {
      const redirectTo = `${window.location.origin}${returnPath || '/'}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) throw error;
    },

    /**
     * Sign out the current user.
     * Base44 called: base44.auth.logout(redirectUrl)
     */
    async logout(redirectUrl) {
      await supabase.auth.signOut();
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    },

    /**
     * Update current user's metadata.
     * Base44 called: base44.auth.updateMe({ first_name, last_name, ... })
     */
    async updateMe(updates) {
      const { error } = await supabase.auth.updateUser({
        data: updates,
      });
      if (error) throw error;
    },
  },

  appLogs: {
    /**
     * Log user activity (navigation tracking).
     * Base44 called: base44.appLogs.logUserInApp(pageName)
     * Now a no-op — can be replaced with proper analytics later.
     */
    logUserInApp() {
      // No-op: Base44 app logging removed.
    },
  },
};
