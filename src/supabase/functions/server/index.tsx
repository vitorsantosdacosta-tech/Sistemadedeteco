import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { User } from "./user.tsx";
import { Metrics } from "./metrics.tsx";
import { Alert } from "./alert.tsx";
import { Dashboard } from "./dashboard.tsx";

const app = new Hono();

// Initialize classes
const user = new User();
const metrics = new Metrics();
const alert = new Alert();
const dashboard = new Dashboard();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper function to verify authorization
async function requireAuth(c: any) {
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return c.json({ error: 'Authorization token required' }, 401);
  }
  
  const verification = await user.verifyToken(accessToken);
  if (!verification.success) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
  
  return verification.user;
}

// Health check endpoint
app.get("/make-server-1c1f7a09/health", (c) => {
  return c.json({ status: "ok" });
});

// User routes
app.post("/make-server-1c1f7a09/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    const result = await user.signup(email, password, name);
    return c.json(result, result.success ? 201 : 400);
  } catch (error) {
    console.log(`Signup endpoint error: ${error}`);
    return c.json({ error: "Invalid request" }, 400);
  }
});

app.get("/make-server-1c1f7a09/user/profile", async (c) => {
  const authUser = await requireAuth(c);
  if (!authUser.id) return authUser; // This is the error response
  
  const result = await user.getUserInfo(authUser.id);
  return c.json(result, result.success ? 200 : 404);
});

app.put("/make-server-1c1f7a09/user/settings", async (c) => {
  const authUser = await requireAuth(c);
  if (!authUser.id) return authUser;
  
  try {
    const settings = await c.req.json();
    const result = await user.updateUserSettings(authUser.id, settings);
    return c.json(result, result.success ? 200 : 400);
  } catch (error) {
    console.log(`Update settings error: ${error}`);
    return c.json({ error: "Invalid request" }, 400);
  }
});

// Metrics routes
app.post("/make-server-1c1f7a09/metrics", async (c) => {
  try {
    const { device_id, data } = await c.req.json();
    const result = await metrics.captureData(device_id, data);
    
    // Check for alert triggers after capturing data
    if (result.success) {
      await alert.checkTriggers(device_id, data);
    }
    
    return c.json(result, result.success ? 201 : 400);
  } catch (error) {
    console.log(`Capture metrics error: ${error}`);
    return c.json({ error: "Invalid request" }, 400);
  }
});

app.get("/make-server-1c1f7a09/metrics/:deviceId", async (c) => {
  const authUser = await requireAuth(c);
  if (!authUser.id) return authUser;
  
  const deviceId = c.req.param('deviceId');
  const startDate = c.req.query('start_date');
  const endDate = c.req.query('end_date');
  
  const result = await metrics.getMetrics(deviceId, startDate, endDate);
  return c.json(result, result.success ? 200 : 404);
});

app.get("/make-server-1c1f7a09/metrics/:deviceId/latest", async (c) => {
  const authUser = await requireAuth(c);
  if (!authUser.id) return authUser;
  
  const deviceId = c.req.param('deviceId');
  const result = await metrics.getLatestMetrics(deviceId);
  return c.json(result, result.success ? 200 : 404);
});

app.get("/make-server-1c1f7a09/analytics/:deviceId", async (c) => {
  const authUser = await requireAuth(c);
  if (!authUser.id) return authUser;
  
  const deviceId = c.req.param('deviceId');
  const period = c.req.query('period') || '24h';
  
  const result = await metrics.getAnalytics(deviceId, period);
  return c.json(result, result.success ? 200 : 404);
});

// Alert routes
app.get("/make-server-1c1f7a09/alerts", async (c) => {
  const authUser = await requireAuth(c);
  if (!authUser.id) return authUser;
  
  const includeRead = c.req.query('include_read') === 'true';
  const result = await alert.getUserAlerts(authUser.id, includeRead);
  return c.json(result, result.success ? 200 : 404);
});

app.put("/make-server-1c1f7a09/alerts/:alertId/read", async (c) => {
  const authUser = await requireAuth(c);
  if (!authUser.id) return authUser;
  
  const alertId = c.req.param('alertId');
  const result = await alert.markAlertAsRead(authUser.id, alertId);
  return c.json(result, result.success ? 200 : 404);
});

app.put("/make-server-1c1f7a09/alerts/:alertId/acknowledge", async (c) => {
  const authUser = await requireAuth(c);
  if (!authUser.id) return authUser;
  
  const alertId = c.req.param('alertId');
  const result = await alert.acknowledgeAlert(authUser.id, alertId);
  return c.json(result, result.success ? 200 : 404);
});

app.get("/make-server-1c1f7a09/alerts/history", async (c) => {
  const authUser = await requireAuth(c);
  if (!authUser.id) return authUser;
  
  const days = parseInt(c.req.query('days') || '30');
  const result = await alert.getAlertHistory(authUser.id, days);
  return c.json(result, result.success ? 200 : 404);
});

// Dashboard routes
app.get("/make-server-1c1f7a09/dashboard", async (c) => {
  const authUser = await requireAuth(c);
  if (!authUser.id) return authUser;
  
  const deviceId = c.req.query('device_id');
  const period = c.req.query('period') || '24h';
  
  const result = await dashboard.getDashboardData(authUser.id, deviceId, period);
  return c.json(result, result.success ? 200 : 500);
});

app.post("/make-server-1c1f7a09/devices", async (c) => {
  const authUser = await requireAuth(c);
  if (!authUser.id) return authUser;
  
  try {
    const { device_id, device_name, location } = await c.req.json();
    const result = await dashboard.addUserDevice(authUser.id, device_id, device_name, location);
    return c.json(result, result.success ? 201 : 400);
  } catch (error) {
    console.log(`Add device error: ${error}`);
    return c.json({ error: "Invalid request" }, 400);
  }
});

app.get("/make-server-1c1f7a09/devices", async (c) => {
  const authUser = await requireAuth(c);
  if (!authUser.id) return authUser;
  
  const devices = await dashboard.getUserDevices(authUser.id);
  return c.json({ success: true, devices });
});

app.get("/make-server-1c1f7a09/metrics/:deviceId/detailed", async (c) => {
  const authUser = await requireAuth(c);
  if (!authUser.id) return authUser;
  
  const deviceId = c.req.param('deviceId');
  const startDate = c.req.query('start_date') || new Date(Date.now() - 24*60*60*1000).toISOString();
  const endDate = c.req.query('end_date') || new Date().toISOString();
  
  const result = await dashboard.getDetailedMetrics(authUser.id, deviceId, startDate, endDate);
  return c.json(result, result.success ? 200 : 404);
});

Deno.serve(app.fetch);