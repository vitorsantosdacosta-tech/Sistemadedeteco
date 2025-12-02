import * as kv from './kv_store.tsx';

export class Alert {
  async createAlert(userId: string, deviceId: string, type: string, message: string, severity: 'low' | 'medium' | 'high' = 'medium') {
    try {
      const alertId = `alert:${userId}:${Date.now()}`;
      const timestamp = new Date().toISOString();

      const alertData = {
        id: alertId,
        user_id: userId,
        device_id: deviceId,
        type,
        message,
        severity,
        timestamp,
        read: false,
        acknowledged: false,
        trigger_conditions: this.getTriggerConditions(type)
      };

      await kv.set(alertId, alertData);
      
      // Also store in user's active alerts
      const userAlertsKey = `user_alerts:${userId}`;
      const userAlerts = await kv.get(userAlertsKey) || [];
      userAlerts.push(alertData);
      await kv.set(userAlertsKey, userAlerts);

      console.log(`Alert created: ${type} for user ${userId} on device ${deviceId}`);
      return { success: true, alert: alertData };
    } catch (error) {
      console.log(`Create alert error: ${error}`);
      return { success: false, error: 'Failed to create alert' };
    }
  }

  async getUserAlerts(userId: string, includeRead: boolean = false) {
    try {
      const userAlertsKey = `user_alerts:${userId}`;
      const alerts = await kv.get(userAlertsKey) || [];
      
      const filteredAlerts = includeRead ? alerts : alerts.filter(alert => !alert.read);
      
      // Sort by timestamp (newest first)
      filteredAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return { success: true, alerts: filteredAlerts };
    } catch (error) {
      console.log(`Get user alerts error: ${error}`);
      return { success: false, error: 'Failed to retrieve user alerts' };
    }
  }

  async markAlertAsRead(userId: string, alertId: string) {
    try {
      const alert = await kv.get(alertId);
      if (!alert || alert.user_id !== userId) {
        return { success: false, error: 'Alert not found or unauthorized' };
      }

      alert.read = true;
      alert.read_at = new Date().toISOString();
      await kv.set(alertId, alert);

      // Update in user's alerts list
      const userAlertsKey = `user_alerts:${userId}`;
      const userAlerts = await kv.get(userAlertsKey) || [];
      const updatedAlerts = userAlerts.map(a => a.id === alertId ? alert : a);
      await kv.set(userAlertsKey, updatedAlerts);

      return { success: true, alert };
    } catch (error) {
      console.log(`Mark alert as read error: ${error}`);
      return { success: false, error: 'Failed to mark alert as read' };
    }
  }

  async acknowledgeAlert(userId: string, alertId: string) {
    try {
      const alert = await kv.get(alertId);
      if (!alert || alert.user_id !== userId) {
        return { success: false, error: 'Alert not found or unauthorized' };
      }

      alert.acknowledged = true;
      alert.acknowledged_at = new Date().toISOString();
      await kv.set(alertId, alert);

      // Update in user's alerts list
      const userAlertsKey = `user_alerts:${userId}`;
      const userAlerts = await kv.get(userAlertsKey) || [];
      const updatedAlerts = userAlerts.map(a => a.id === alertId ? alert : a);
      await kv.set(userAlertsKey, updatedAlerts);

      return { success: true, alert };
    } catch (error) {
      console.log(`Acknowledge alert error: ${error}`);
      return { success: false, error: 'Failed to acknowledge alert' };
    }
  }

  async checkTriggers(deviceId: string, metricData: any) {
    try {
      // Get all users who have access to this device
      const deviceUsersKey = `device_users:${deviceId}`;
      const deviceUsers = await kv.get(deviceUsersKey) || [];

      const alerts = [];

      for (const userId of deviceUsers) {
        const userSettings = await kv.get(`user:${userId}`);
        if (!userSettings || !userSettings.settings.notifications_enabled) {
          continue;
        }

        // Check for various trigger conditions
        const triggerChecks = [
          this.checkPresenceAlert(metricData, userSettings.settings),
          this.checkInactivityAlert(deviceId, userSettings.settings),
          this.checkSignalLossAlert(metricData, userSettings.settings),
          this.checkUnauthorizedPresence(metricData, userSettings.settings)
        ];

        for (const trigger of triggerChecks) {
          if (trigger.shouldAlert) {
            const alert = await this.createAlert(
              userId,
              deviceId,
              trigger.type,
              trigger.message,
              trigger.severity
            );
            if (alert.success) {
              alerts.push(alert.alert);
            }
          }
        }
      }

      return { success: true, alerts_created: alerts.length, alerts };
    } catch (error) {
      console.log(`Check triggers error: ${error}`);
      return { success: false, error: 'Failed to check alert triggers' };
    }
  }

  private checkPresenceAlert(metricData: any, userSettings: any) {
    const threshold = userSettings.alert_threshold || 50;
    const confidenceLevel = metricData.confidence_level || 0;

    if (metricData.presence_detected && confidenceLevel > threshold) {
      return {
        shouldAlert: true,
        type: 'presence_detected',
        message: `Presença detectada com ${confidenceLevel}% de confiança`,
        severity: 'medium' as const
      };
    }

    return { shouldAlert: false };
  }

  private checkInactivityAlert(deviceId: string, userSettings: any) {
    // This would check for unusual inactivity patterns
    // For now, simplified implementation
    return { shouldAlert: false };
  }

  private checkSignalLossAlert(metricData: any, userSettings: any) {
    const rssi = metricData.rssi || -100;
    
    if (rssi < -90) {
      return {
        shouldAlert: true,
        type: 'signal_loss',
        message: 'Sinal Wi-Fi fraco ou perdido no sensor',
        severity: 'high' as const
      };
    }

    return { shouldAlert: false };
  }

  private checkUnauthorizedPresence(metricData: any, userSettings: any) {
    // Check for presence during unusual hours (example: between 2-5 AM)
    const hour = new Date().getHours();
    
    if (metricData.presence_detected && (hour >= 2 && hour <= 5)) {
      return {
        shouldAlert: true,
        type: 'unauthorized_presence',
        message: 'Presença detectada em horário incomum (2:00-5:00)',
        severity: 'high' as const
      };
    }

    return { shouldAlert: false };
  }

  private getTriggerConditions(type: string) {
    const conditions = {
      presence_detected: 'Confidence level above threshold',
      signal_loss: 'RSSI below -90 dBm',
      unauthorized_presence: 'Presence detected between 2-5 AM',
      inactivity: 'No movement detected for extended period'
    };

    return conditions[type] || 'Unknown trigger condition';
  }

  async getAlertHistory(userId: string, days: number = 30) {
    try {
      const userAlertsKey = `user_alerts:${userId}`;
      const alerts = await kv.get(userAlertsKey) || [];
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const recentAlerts = alerts.filter(alert => 
        new Date(alert.timestamp) >= cutoffDate
      );

      // Group by type for statistics
      const alertStats = recentAlerts.reduce((stats, alert) => {
        stats[alert.type] = (stats[alert.type] || 0) + 1;
        return stats;
      }, {});

      return { 
        success: true, 
        history: recentAlerts,
        statistics: alertStats,
        total_alerts: recentAlerts.length
      };
    } catch (error) {
      console.log(`Get alert history error: ${error}`);
      return { success: false, error: 'Failed to retrieve alert history' };
    }
  }
}