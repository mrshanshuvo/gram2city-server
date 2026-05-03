import { Router } from "express";
import { usersCollection, auditCollection, settingsCollection } from "../db";
import { verifyFBToken, verifyAdmin } from "../middleware/auth";
import { AuditLog, SystemSettings } from "../types";

const router = Router();

// Apply Admin security to ALL routes in this file
router.use(verifyFBToken, verifyAdmin);

/**
 * @swagger
 * /admin/audit-logs:
 *   get:
 *     summary: View administrative audit logs
 *     tags: [Admin Panel]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Success" }
 */
router.get("/audit-logs", async (req, res) => {
  try {
    const logs = await auditCollection.find().sort({ timestamp: -1 }).limit(100).toArray();
    res.send({ success: true, logs });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to fetch logs" });
  }
});

/**
 * @swagger
 * /admin/settings:
 *   get:
 *     summary: Get global system settings
 *     tags: [Admin Panel]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "Success" }
 */
router.get("/settings", async (req, res) => {
  try {
    let settings = await settingsCollection.findOne({});
    
    if (!settings) {
      const defaultSettings: SystemSettings = {
        base_delivery_fee: 50,
        cost_per_kg: 20,
        rider_commission_percentage: 15,
        updated_at: new Date().toISOString(),
        updated_by: "system"
      };
      await settingsCollection.insertOne(defaultSettings);
      settings = defaultSettings;
    }
    
    res.send({ success: true, settings });
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error" });
  }
});

/**
 * @swagger
 * /admin/settings:
 *   patch:
 *     summary: Update global system settings
 *     tags: [Admin Panel]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               base_delivery_fee: { type: number, example: 50 }
 *               cost_per_kg: { type: number, example: 20 }
 *               rider_commission_percentage: { type: number, example: 15 }
 *     responses:
 *       200: { description: "Settings updated" }
 */
router.patch("/settings", async (req, res) => {
  const { base_delivery_fee, cost_per_kg, rider_commission_percentage } = req.body;
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
      updated_by: req.user.email
    };

    if (base_delivery_fee) updateData.base_delivery_fee = Number(base_delivery_fee);
    if (cost_per_kg) updateData.cost_per_kg = Number(cost_per_kg);
    if (rider_commission_percentage) updateData.rider_commission_percentage = Number(rider_commission_percentage);

    await settingsCollection.updateOne({}, { $set: updateData }, { upsert: true });

    const log: AuditLog = {
      admin_email: req.user.email as string,
      action: "UPDATE_SETTINGS",
      details: `Updated system settings: ${JSON.stringify(updateData)}`,
      timestamp: new Date().toISOString()
    };
    await auditCollection.insertOne(log);

    res.send({ success: true, message: "Settings updated and logged." });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to update settings" });
  }
});

/**
 * @swagger
 * /admin/users/{email}/status:
 *   patch:
 *     summary: Suspend or activate a user account
 *     tags: [Admin Panel]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ name: "email", in: "path", required: true, schema: { type: "string" } }]
 *     requestBody:
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [active, suspended] }
 *     responses:
 *       200: { description: "User status updated" }
 */
router.patch("/users/:email/status", async (req, res) => {
  const { email } = req.params;
  const { status } = req.body;
  try {
    await usersCollection.updateOne({ email }, { $set: { status } });

    const log: AuditLog = {
      admin_email: req.user.email as string,
      action: "USER_STATUS_CHANGE",
      target_id: email,
      details: `Changed user ${email} status to ${status}`,
      timestamp: new Date().toISOString()
    };
    await auditCollection.insertOne(log);

    res.send({ success: true, message: `User account ${status} successfully.` });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to update user status" });
  }
});

export default router;
