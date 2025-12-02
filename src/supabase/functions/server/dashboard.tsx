import { Metrics } from './metrics.tsx';
import { Alert } from './alert.tsx';
import * as kv from './kv_store.tsx';

export class Dashboard {
  private metrics: Metrics;
  private alert: Alert;

  constructor() {
    this.metrics = new Metrics();
    this.alert = new Alert();
  }

  async getDashboardData(userId: string, deviceId?: string, period: string = '24h') {
    try {
      // Get user's devices if no specific device is provided
      const userDevices = await this.getUserDevices(userId);
      const targetDevices = deviceId ? [deviceId] : userDevices;

      if (targetDevices.length === 0) {
        return {
          success: true,
          dashboard: {
            devices: [],
            alerts: [],
            summary: {
              total_devices: 0,
              active_alerts: 0,
              total_detections: 0,
              average_confidence: 0
            }
          }
        };
      }

      // Get metrics for all devices
      const allMetrics = [];
      const deviceSummaries = [];

      for (const device of targetDevices) {
        const deviceMetrics = await this.metrics.getMetrics(device);
        const deviceAnalytics = await this.metrics.getAnalytics(device, period);
        const latestMetric = await this.metrics.getLatestMetrics(device);

        if (deviceMetrics.success && deviceMetrics.metrics) {
          allMetrics.push(...deviceMetrics.metrics);
        }

        deviceSummaries.push({
          device_id: device,
          status: latestMetric.success ? 'online' : 'offline',
          latest_data: latestMetric.success ? latestMetric.metric : null,
          analytics: deviceAnalytics.success ? deviceAnalytics.analytics : null
        });
      }

      // Get recent alerts
      const alertsResponse = await this.alert.getUserAlerts(userId, true);
      const recentAlerts = alertsResponse.success ? alertsResponse.alerts.slice(0, 10) : [];

      // Calculate summary statistics
      const summary = this.calculateSummary(allMetrics, recentAlerts, deviceSummaries);

      // Generate chart data
      const chartData = this.generateChartData(allMetrics, period);

      return {
        success: true,
        dashboard: {
          devices: deviceSummaries,
          alerts: recentAlerts,
          summary,
          charts: chartData,
          period
        }
      };
    } catch (error) {
      console.log(`Get dashboard data error: ${error}`);
      return { success: false, error: 'Failed to retrieve dashboard data' };
    }
  }

  async getUserDevices(userId: string) {
    try {
      const userDevicesKey = `user_devices:${userId}`;
      const devices = await kv.get(userDevicesKey) || [];
      return devices;
    } catch (error) {
      console.log(`Get user devices error: ${error}`);
      return [];
    }
  }

  async addUserDevice(userId: string, deviceId: string, deviceName: string, location: string) {
    try {
      // Add device to user's device list
      const userDevicesKey = `user_devices:${userId}`;
      const userDevices = await kv.get(userDevicesKey) || [];
      
      if (!userDevices.includes(deviceId)) {
        userDevices.push(deviceId);
        await kv.set(userDevicesKey, userDevices);
      }

      // Add user to device's user list
      const deviceUsersKey = `device_users:${deviceId}`;
      const deviceUsers = await kv.get(deviceUsersKey) || [];
      
      if (!deviceUsers.includes(userId)) {
        deviceUsers.push(userId);
        await kv.set(deviceUsersKey, deviceUsers);
      }

      // Store device information
      const deviceInfo = {
        id: deviceId,
        name: deviceName,
        location,
        owner_id: userId,
        created_at: new Date().toISOString(),
        status: 'active'
      };
      
      await kv.set(`device:${deviceId}`, deviceInfo);

      return { success: true, device: deviceInfo };
    } catch (error) {
      console.log(`Add user device error: ${error}`);
      return { success: false, error: 'Failed to add device' };
    }
  }

  private calculateSummary(metrics: any[], alerts: any[], devices: any[]) {
    const activeAlerts = alerts.filter(alert => !alert.acknowledged).length;
    const totalDetections = metrics.filter(metric => metric.presence_detected).length;
    const averageConfidence = metrics.length > 0 
      ? metrics.reduce((sum, metric) => sum + metric.confidence_level, 0) / metrics.length 
      : 0;
    
    const onlineDevices = devices.filter(device => device.status === 'online').length;

    return {
      total_devices: devices.length,
      online_devices: onlineDevices,
      active_alerts: activeAlerts,
      total_detections: totalDetections,
      average_confidence: Math.round(averageConfidence * 100) / 100,
      last_update: new Date().toISOString()
    };
  }

  private generateChartData(metrics: any[], period: string) {
    if (metrics.length === 0) {
      return {
        hourly_activity: [],
        confidence_trend: [],
        detection_timeline: []
      };
    }

    // Sort metrics by timestamp
    const sortedMetrics = metrics.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Generate hourly activity chart
    const hourlyActivity = this.generateHourlyActivity(sortedMetrics);
    
    // Generate confidence trend chart
    const confidenceTrend = this.generateConfidenceTrend(sortedMetrics);
    
    // Generate detection timeline
    const detectionTimeline = this.generateDetectionTimeline(sortedMetrics);

    return {
      hourly_activity: hourlyActivity,
      confidence_trend: confidenceTrend,
      detection_timeline: detectionTimeline
    };
  }

  private generateHourlyActivity(metrics: any[]) {
    const hourlyData = new Array(24).fill(0).map((_, hour) => ({
      hour,
      detections: 0,
      confidence: 0,
      count: 0
    }));

    metrics.forEach(metric => {
      const hour = new Date(metric.timestamp).getHours();
      if (metric.presence_detected) {
        hourlyData[hour].detections++;
      }
      hourlyData[hour].confidence += metric.confidence_level;
      hourlyData[hour].count++;
    });

    return hourlyData.map(data => ({
      hour: `${data.hour}:00`,
      detections: data.detections,
      average_confidence: data.count > 0 ? Math.round((data.confidence / data.count) * 100) / 100 : 0
    }));
  }

  private generateConfidenceTrend(metrics: any[]) {
    const now = new Date();
    const intervals = [];

    // Create 12 intervals (every 2 hours for 24h, or adjust based on period)
    for (let i = 11; i >= 0; i--) {
      const intervalStart = new Date(now.getTime() - (i + 1) * 2 * 60 * 60 * 1000);
      const intervalEnd = new Date(now.getTime() - i * 2 * 60 * 60 * 1000);
      
      const intervalMetrics = metrics.filter(metric => {
        const metricTime = new Date(metric.timestamp);
        return metricTime >= intervalStart && metricTime < intervalEnd;
      });

      const avgConfidence = intervalMetrics.length > 0
        ? intervalMetrics.reduce((sum, m) => sum + m.confidence_level, 0) / intervalMetrics.length
        : 0;

      intervals.push({
        time: intervalEnd.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        confidence: Math.round(avgConfidence * 100) / 100,
        detections: intervalMetrics.filter(m => m.presence_detected).length
      });
    }

    return intervals;
  }

  private generateDetectionTimeline(metrics: any[]) {
    return metrics
      .filter(metric => metric.presence_detected)
      .slice(-20) // Last 20 detections
      .map(metric => ({
        timestamp: metric.timestamp,
        time: new Date(metric.timestamp).toLocaleTimeString('pt-BR'),
        confidence: metric.confidence_level,
        device_id: metric.device_id,
        location: metric.room_location || 'Desconhecido'
      }));
  }

  async getDetailedMetrics(userId: string, deviceId: string, startDate: string, endDate: string) {
    try {
      // Verify user has access to this device
      const userDevices = await this.getUserDevices(userId);
      if (!userDevices.includes(deviceId)) {
        return { success: false, error: 'Unauthorized access to device' };
      }

      const metricsResponse = await this.metrics.getMetrics(deviceId, startDate, endDate);
      if (!metricsResponse.success) {
        return metricsResponse;
      }

      const analytics = await this.metrics.getAnalytics(deviceId, '24h');
      
      return {
        success: true,
        metrics: metricsResponse.metrics,
        analytics: analytics.success ? analytics.analytics : null,
        device_id: deviceId,
        period: { start: startDate, end: endDate }
      };
    } catch (error) {
      console.log(`Get detailed metrics error: ${error}`);
      return { success: false, error: 'Failed to retrieve detailed metrics' };
    }
  }
}