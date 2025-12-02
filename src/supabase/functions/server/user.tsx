import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

export class User {
  private supabase;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
  }

  async signup(email: string, password: string, name: string) {
    try {
      const { data, error } = await this.supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: { name },
        // Automatically confirm the user's email since an email server hasn't been configured.
        email_confirm: true
      });

      if (error) {
        console.log(`Signup error: ${error.message}`);
        return { success: false, error: error.message };
      }

      // Store additional user info in KV store
      await kv.set(`user:${data.user.id}`, {
        id: data.user.id,
        email,
        name,
        created_at: new Date().toISOString(),
        settings: {
          notifications_enabled: true,
          alert_threshold: 50
        }
      });

      return { success: true, user: data.user };
    } catch (error) {
      console.log(`Signup exception: ${error}`);
      return { success: false, error: 'Internal server error during signup' };
    }
  }

  async getUserInfo(userId: string) {
    try {
      const userData = await kv.get(`user:${userId}`);
      if (!userData) {
        return { success: false, error: 'User not found' };
      }
      return { success: true, user: userData };
    } catch (error) {
      console.log(`Get user info error: ${error}`);
      return { success: false, error: 'Failed to retrieve user information' };
    }
  }

  async updateUserSettings(userId: string, settings: any) {
    try {
      const userData = await kv.get(`user:${userId}`);
      if (!userData) {
        return { success: false, error: 'User not found' };
      }

      const updatedUser = {
        ...userData,
        settings: { ...userData.settings, ...settings },
        updated_at: new Date().toISOString()
      };

      await kv.set(`user:${userId}`, updatedUser);
      return { success: true, user: updatedUser };
    } catch (error) {
      console.log(`Update user settings error: ${error}`);
      return { success: false, error: 'Failed to update user settings' };
    }
  }

  async verifyToken(accessToken: string) {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser(accessToken);
      if (error || !user) {
        return { success: false, error: 'Invalid token' };
      }
      return { success: true, user };
    } catch (error) {
      console.log(`Token verification error: ${error}`);
      return { success: false, error: 'Token verification failed' };
    }
  }
}