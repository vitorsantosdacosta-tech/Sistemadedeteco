import * as kv from './kv_store.tsx';

export class Metrics {
  async captureData(deviceId: string, data: any) {
    try {
      const timestamp = new Date().toISOString();
      const metricId = `metric:${deviceId}:${Date.now()}`;
      
      const metricData = {
        id: metricId,
        device_id: deviceId,
        timestamp,
        rssi: data.rssi || -50,
        signal_strength: data.signal_strength || 0,
        presence_detected: data.presence_detected || false,
        confidence_level: data.confidence_level || 0,
        room_location: data.room_location || 'unknown',
        raw_data: data
      };

      await kv.set(metricId, metricData);
      
      // Also store latest data for quick access
      await kv.set(`latest:${deviceId}`, metricData);

      return { success: true, metric_id: metricId };
    } catch (error) {
      console.log(`Capture data error: ${error}`);
      return { success: false, error: 'Failed to capture sensor data' };
    }
  }

  async getMetrics(deviceId: string, startDate?: string, endDate?: string) {
    try {
      const prefix = `metric:${deviceId}:`;
      const metrics = await kv.getByPrefix(prefix);
      
      let filteredMetrics = metrics;
      
      if (startDate || endDate) {
        filteredMetrics = metrics.filter(metric => {
          const metricDate = new Date(metric.timestamp);
          const start = startDate ? new Date(startDate) : new Date('1970-01-01');
          const end = endDate ? new Date(endDate) : new Date();
          
          return metricDate >= start && metricDate <= end;
        });
      }

      // Sort by timestamp (newest first)
      filteredMetrics.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return { success: true, metrics: filteredMetrics };
    } catch (error) {
      console.log(`Get metrics error: ${error}`);
      return { success: false, error: 'Failed to retrieve metrics' };
    }
  }

  async getLatestMetrics(deviceId: string) {
    try {
      const latestData = await kv.get(`latest:${deviceId}`);
      if (!latestData) {
        return { success: false, error: 'No data found for device' };
      }
      return { success: true, metric: latestData };
    } catch (error) {
      console.log(`Get latest metrics error: ${error}`);
      return { success: false, error: 'Failed to retrieve latest metrics' };
    }
  }

  async processData(rawData: any) {
    try {
      // Process raw ESP32 WiFi sensing data
      const processedData = {
        presence_detected: this.detectPresence(rawData),
        confidence_level: this.calculateConfidence(rawData),
        signal_strength: this.normalizeSignalStrength(rawData.rssi),
        movement_detected: this.detectMovement(rawData)
      };

      return { success: true, processed_data: processedData };
    } catch (error) {
      console.log(`Process data error: ${error}`);
      return { success: false, error: 'Failed to process sensor data' };
    }
  }

  private detectPresence(data: any): boolean {
    // Simple presence detection based on RSSI changes
    const rssi = data.rssi || -100;
    const threshold = -70; // Adjustable threshold
    return rssi > threshold;
  }

  private calculateConfidence(data: any): number {
    // Calculate confidence based on signal stability and strength
    const rssi = data.rssi || -100;
    const baseConfidence = Math.max(0, (rssi + 100) / 50); // Normalize RSSI to 0-1
    return Math.min(100, baseConfidence * 100);
  }

  private normalizeSignalStrength(rssi: number): number {
    // Normalize RSSI to a 0-100 scale
    return Math.max(0, Math.min(100, (rssi + 100) * 2));
  }

  private detectMovement(data: any): boolean {
    // Simple movement detection (would need historical data for better accuracy)
    const rssiVariation = data.rssi_variation || 0;
    return Math.abs(rssiVariation) > 5;
  }

  async getAnalytics(deviceId: string, period: string = '24h') {
    try {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case '1h':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      const { success, metrics } = await this.getMetrics(deviceId, startDate.toISOString());
      
      if (!success || !metrics) {
        return { success: false, error: 'Failed to get metrics for analytics' };
      }

      const analytics = {
        total_detections: metrics.filter(m => m.presence_detected).length,
        average_confidence: metrics.reduce((sum, m) => sum + m.confidence_level, 0) / metrics.length || 0,
        peak_hours: this.calculatePeakHours(metrics),
        presence_percentage: (metrics.filter(m => m.presence_detected).length / metrics.length) * 100 || 0,
        data_points: metrics.length
      };

      return { success: true, analytics };
    } catch (error) {
      console.log(`Get analytics error: ${error}`);
      return { success: false, error: 'Failed to generate analytics' };
    }
  }

  private calculatePeakHours(metrics: any[]): number[] {
    const hourCounts = new Array(24).fill(0);
    
    metrics.forEach(metric => {
      if (metric.presence_detected) {
        const hour = new Date(metric.timestamp).getHours();
        hourCounts[hour]++;
      }
    });

    return hourCounts;
  }
}