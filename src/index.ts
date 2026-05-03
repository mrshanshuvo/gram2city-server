import "dotenv/config";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import admin from "firebase-admin";
import Stripe from "stripe";
import type {
  User,
  Parcel,
  Rider,
  Payment,
  Cashout,
  TrackingUpdate,
  Review,
  Notification,
} from "./types";

// ─── Env Validation ──────────────────────────────────────────────────────────
const REQUIRED_ENV = [
  "MONGODB_URI",
  "DB_NAME",
  "FB_SERVICE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_CURRENCY",
  "CLIENT_URL",
] as const;
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

const decodedBase64Key = Buffer.from(
  process.env.FB_SERVICE_KEY as string,
  "base64",
).toString("utf8");
const serviceAccount = JSON.parse(decodedBase64Key);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const client = new MongoClient(process.env.MONGODB_URI as string, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();

    const db = client.db(process.env.DB_NAME as string);
    const usersCollection = db.collection<User>("users");
    const parcelCollection = db.collection<Parcel>("parcels");
    const paymentCollection = db.collection<Payment>("payments");
    const ridersCollection = db.collection<Rider>("riders");
    const cashoutsCollection = db.collection<Cashout>("cashouts");
    const trackingCollection = db.collection<TrackingUpdate>("trackings");
    const reviewsCollection = db.collection<Review>("reviews");
    const notificationsCollection =
      db.collection<Notification>("notifications");

    // custom middlewares
    const verifyFBToken = async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).send({ success: false, message: "Unauthorized" });
        return;
      }
      const token = authHeader.split(" ")[1];
      if (!token) {
        res.status(401).send({ success: false, message: "Unauthorized" });
        return;
      }
      try {
        const decoded = await admin.auth().verifyIdToken(token);
        req.user = decoded;
        next();
      } catch (error) {
        console.error(error);
        res.status(401).send({ success: false, message: "Unauthorized" });
      }
    };

    // admin middleware
    const verifyAdmin = async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      const email = req.user.email;
      const user = await usersCollection.findOne({ email: email });
      if (user?.role !== "admin") {
        res.status(403).send({ success: false, message: "Forbidden" });
        return;
      }
      next();
    };

    // helper function for adding tracking updates
    const addTrackingUpdate = async (
      trackingId: string,
      status: string,
      details: string,
      location = "Primary Hub",
    ): Promise<void> => {
      try {
        await trackingCollection.insertOne({
          trackingId,
          status,
          details,
          location,
          time: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Failed to add tracking update:", error);
      }
    };

    // GET: All users
    app.get("/users/search", verifyFBToken, verifyAdmin, async (req, res) => {
      const emailQuery = req.query.email as string | undefined;

      if (!emailQuery)
        return res.status(400).send({ error: "Email query is required" });

      try {
        const users = await usersCollection
          .find({
            email: { $regex: emailQuery, $options: "i" }, // case-insensitive
          })
          .project({ email: 1, createdAt: 1, role: 1 }) // only necessary fields
          .limit(10)
          .toArray();

        res.send(users);
      } catch (error) {
        res.status(500).send({ error: "Internal Server Error" });
      }
    });

    // GET: User role
    app.get("/users/:email/role", verifyFBToken, async (req, res) => {
      const { email } = req.params;

      try {
        const user = await usersCollection.findOne(
          { email },
          { projection: { role: 1 } },
        );

        if (!user) {
          return res
            .status(404)
            .send({ success: false, message: "User not found" });
        }

        res.send({ success: true, role: user.role || "user" });
      } catch (error) {
        res
          .status(500)
          .send({ success: false, error: "Internal Server Error" });
      }
    });

    // PATCH: User role
    app.patch(
      "/users/:email/role",
      verifyFBToken,
      verifyAdmin,
      async (req, res) => {
        const { email } = req.params;
        const { role } = req.body;
        try {
          const result = await usersCollection.updateOne(
            { email },
            { $set: { role } },
          );
          res.send({ success: true, modifiedCount: result.modifiedCount });
        } catch (error) {
          res
            .status(500)
            .send({ success: false, error: "Failed to update role" });
        }
      },
    );

    // PATCH: User profile (Update name, photo, phone)
    app.patch("/users/:email", verifyFBToken, async (req, res) => {
      const { email } = req.params;
      const { name, photoURL, phone, address } = req.body;

      if (req.user.email !== email) {
        return res
          .status(403)
          .send({ success: false, message: "Unauthorized" });
      }

      try {
        const result = await usersCollection.updateOne(
          { email },
          { $set: { name, photoURL, phone, address } },
        );
        res.send({ success: true, modifiedCount: result.modifiedCount });
      } catch (error) {
        res
          .status(500)
          .send({ success: false, error: "Failed to update profile" });
      }
    });

    // POST: User
    app.post("/users", async (req, res) => {
      const email = req.body.email;
      const user = req.body;

      const updateDoc = {
        $setOnInsert: {
          name: user.name,
          photoURL: user.photoURL,
          role: user.role,
          created_at: user.created_at,
        },
        $set: {
          last_login: user.last_login,
        },
      };

      const result = await usersCollection.updateOne(
        { email: email },
        updateDoc,
        { upsert: true },
      );

      res.send(result);
    });

    // GET: All parcels OR parcels by user (created_by), sorted by latest
    app.get("/parcels", verifyFBToken, async (req, res) => {
      try {
        const email = req.query.email as string | undefined;
        const payment_status = req.query.payment_status as string | undefined;
        const delivery_status = req.query.delivery_status as string | undefined;
        const query: Record<string, unknown> = {};
        if (email) {
          query["created_by"] = email;
        }

        if (payment_status) {
          query["payment_status"] = payment_status;
        }

        if (delivery_status) {
          query["delivery_status"] = delivery_status;
        }

        const parcels = await parcelCollection
          .find(query)
          .sort({ createdAt: -1 as const })
          .toArray();
        res.send(parcels);
      } catch (error) {
        console.error("Error fetching parcels:", error);
        res.status(500).send({ message: "Failed to get parcels" });
      }
    });

    // GET parcel by ID
    app.get("/parcels/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const parcel = await parcelCollection.findOne({
          _id: new ObjectId(id as string),
        });

        if (!parcel) {
          return res
            .status(404)
            .send({ success: false, message: "Parcel not found" });
        }

        res.send({ success: true, data: parcel });
      } catch (error) {
        console.error("Error fetching parcel by ID:", error);
        res
          .status(500)
          .send({ success: false, message: "Failed to fetch parcel" });
      }
    });

    // POST API to add a new parcel
    app.post("/parcels", verifyFBToken, async (req, res) => {
      try {
        const parcelData = req.body;
        const result = await parcelCollection.insertOne(parcelData);

        // Initial tracking update
        await addTrackingUpdate(
          parcelData.trackingId,
          "booked",
          "Your parcel has been booked and is awaiting collection.",
        );

        res.status(201).send({
          success: true,
          message: "Parcel created successfully",
          data: result,
        });
      } catch (error) {
        console.error("Error adding parcel:", error);
        res.status(500).send({
          success: false,
          message: "Failed to create parcel",
        });
      }
    });

    // DELETE parcel by ID
    app.delete("/parcels/:id", verifyFBToken, async (req, res) => {
      try {
        const id = req.params.id;

        const result = await parcelCollection.deleteOne({
          _id: new ObjectId(id as string),
        });

        res.send(result);
      } catch (error) {
        console.error("Error deleting parcel:", error);
        res
          .status(500)
          .send({ success: false, message: "Failed to delete parcel" });
      }
    });

    // GET /payments?email=someone@example.com
    app.get("/payments", verifyFBToken, async (req, res) => {
      try {
        const email = req.query.email;

        if (req.user.email !== email)
          return res.status(403).send({
            success: false,
            message: "Unauthorized",
          });

        const filter = email ? { email } : {};

        const payments = await paymentCollection
          .find(filter)
          .sort({ payment_time: -1 }) // latest first
          .toArray();

        res.send({ success: true, data: payments });
      } catch (error) {
        console.error("Error fetching payments:", error);
        res
          .status(500)
          .send({ success: false, message: "Failed to fetch payment history" });
      }
    });

    // GET /riders
    app.get("/riders/pending", verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const pendingRiders = await ridersCollection
          .find({ status: "pending" })
          .toArray();
        res.send(pendingRiders);
      } catch (error) {
        console.error(
          "Error fetching pending riders:",
          (error as Error).message,
        );
        res.status(500).send({ error: "Internal Server Error" });
      }
    });

    // GET /riders/approved
    app.get(
      "/riders/approved",
      verifyFBToken,
      verifyAdmin,
      async (req, res) => {
        try {
          const approvedRiders = await ridersCollection
            .find({ status: "approved" })
            .toArray();
          res.json(approvedRiders);
        } catch (error) {
          res.status(500).json({ error: "Internal Server Error" });
        }
      },
    );

    // GET /riders?status=available - Get available riders
    app.get("/riders", verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const { status } = req.query;

        let query = {};
        if (status === "available") {
          query = { status: "approved" };
        } else if (status) {
          query = { status };
        }

        const riders = await ridersCollection
          .find(query)
          .project({
            _id: 1,
            name: 1,
            phone: 1,
            district: 1,
            region: 1,
          })
          .toArray();

        res.send(riders);
      } catch (error) {
        console.error("Error fetching riders:", error);
        res.status(500).send({ error: "Internal Server Error" });
      }
    });

    app.get("/parcels/delivery/status-count", async (req, res) => {
      const pipeline = [
        {
          $group: {
            _id: "$delivery_status",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            status: "$_id",
            count: 1,
            _id: 0, // Exclude the _id field from the output
          },
        },
      ];

      try {
        const result = await parcelCollection.aggregate(pipeline).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching parcel delivery status count:", error);
        res.status(500).send({ error: "Internal Server Error" });
      }
    });

    // GET /rider/parcels - Get parcels assigned to the logged-in rider
    app.get("/rider/parcels", verifyFBToken, async (req, res) => {
      try {
        const riderEmail = req.user.email;

        // Find the rider by email
        const rider = await ridersCollection.findOne({ email: riderEmail });

        if (!rider) {
          return res.status(404).send({
            success: false,
            message: "Rider not found",
          });
        }

        // Find all parcels assigned to this rider
        const assignedParcels = await parcelCollection
          .find({
            assigned_rider_id: new ObjectId(rider._id),
            delivery_status: { $in: ["on_the_way", "delivered", "assigned"] }, // Include both statuses
          })
          .sort({ creation_date: -1 }) // Newest first
          .toArray();

        res.send({
          success: true,
          data: assignedParcels,
        });
      } catch (error) {
        console.error("Error fetching rider parcels:", error);
        res.status(500).send({
          success: false,
          message: "Internal server error",
        });
      }
    });

    // PATCH /parcels/:id/pick - mark a parcel as picked
    // In your backend (where you handle /parcels/:id/pick)
    app.patch("/parcels/:id/pick", verifyFBToken, async (req, res) => {
      try {
        const parcelId = req.params.id;
        const result = await parcelCollection.updateOne(
          { _id: new ObjectId(parcelId as string) },
          {
            $set: {
              picked_at: new Date().toISOString(),
              delivery_status: "on_the_way",
            },
          },
        );

        if (result.modifiedCount === 0) {
          return res.status(404).send({
            success: false,
            message: "Parcel not found or already picked",
          });
        }

        res.send({ success: true, message: "Parcel marked as picked" });

        // Notification for user
        const parcel = await parcelCollection.findOne({
          _id: new ObjectId(parcelId as string),
        });
        if (parcel) {
          notificationsCollection.insertOne({
            email: parcel.created_by,
            message: `Your parcel "${parcel.parcelName}" has been picked up by the rider and is on the way!`,
            time: new Date().toISOString(),
            isRead: false,
            type: "status_update",
          });

          // Tracking update
          await addTrackingUpdate(
            parcel.trackingId,
            "picked_up",
            `The rider has picked up the parcel from ${parcel.senderAddress}.`,
            parcel.senderServiceCenter,
          );
        }
      } catch (error) {
        console.error("Error marking parcel as picked:", error);
        res.status(500).send({ success: false, message: "Server error" });
      }
    });

    // PATCH /rider/parcels/:id/status - Update delivery status
    app.patch("/rider/parcels/:id/status", verifyFBToken, async (req, res) => {
      try {
        const { id } = req.params;
        const { delivery_status } = req.body;
        const riderEmail = req.user.email;

        const rider = await ridersCollection.findOne({ email: riderEmail });
        if (!rider)
          return res
            .status(404)
            .send({ success: false, message: "Rider not found" });

        const parcel = await parcelCollection.findOne({
          _id: new ObjectId(id as string),
          assigned_rider_id: new ObjectId(rider._id),
        });
        if (!parcel)
          return res.status(404).send({
            success: false,
            message: "Parcel not found or not assigned to you",
          });

        // Prepare update fields
        const updateFields: Record<string, unknown> = { delivery_status };

        if (delivery_status === "delivered") {
          updateFields["delivered_at"] = new Date().toISOString();

          // Earning calculation
          const isSameDistrict =
            parcel.senderDistrict === parcel.receiverDistrict;
          const rate = isSameDistrict ? 0.8 : 0.3;
          const earning = (parcel.cost as number) * rate;

          updateFields["rider_earning"] = earning;
        }

        await parcelCollection.updateOne(
          { _id: new ObjectId(id as string) },
          { $set: updateFields },
        );

        res.send({ success: true, message: "Status updated successfully" });

        // Tracking update
        if (delivery_status === "delivered") {
          await addTrackingUpdate(
            parcel.trackingId,
            "delivered",
            "Parcel has been delivered successfully.",
            parcel.receiverServiceCenter,
          );
        } else if (delivery_status === "on_the_way") {
          await addTrackingUpdate(
            parcel.trackingId,
            "on_the_way",
            "Parcel is on the way for delivery.",
            parcel.receiverServiceCenter,
          );
        }

        // Notification for user
        if (delivery_status === "delivered") {
          notificationsCollection.insertOne({
            email: parcel.created_by,
            message: `Hooray! Your parcel "${parcel.parcelName}" has been delivered.`,
            time: new Date().toISOString(),
            isRead: false,
            type: "status_update",
          });
        } else if (delivery_status === "on_the_way") {
          notificationsCollection.insertOne({
            email: parcel.created_by,
            message: `Your parcel "${parcel.parcelName}" is now on the way!`,
            time: new Date().toISOString(),
            isRead: false,
            type: "status_update",
          });
        }
      } catch (err) {
        res.status(500).send({ success: false, message: "Server error" });
      }
    });

    app.get("/cashouts", verifyFBToken, async (req, res) => {
      try {
        const { rider_email } = req.query;

        if (!rider_email) {
          return res
            .status(400)
            .send({ success: false, message: "Missing rider_email" });
        }

        const result = await cashoutsCollection
          .find({ rider_email })
          .project({
            parcel_id: 1,
            trackingId: 1,
            earning: 1,
            cashed_out_at: 1,
            parcel_name: 1, // optional: store in POST /rider/cashout
          })
          .toArray();

        res.send(result);
      } catch (err) {
        console.error("Error fetching cashouts:", err);
        res.status(500).send({ success: false, message: "Server error" });
      }
    });

    // POST /rider/cashout - Cash out for delivered parcels
    app.post("/rider/cashout", verifyFBToken, async (req, res) => {
      try {
        const { parcelId } = req.body;
        const riderEmail = req.user.email;

        const parcel = await parcelCollection.findOne({
          _id: new ObjectId(parcelId as string),
          assigned_rider_email: riderEmail,
          delivery_status: "delivered",
        });

        if (!parcel) {
          return res.status(404).send({
            success: false,
            message: "Parcel not found or not delivered",
          });
        }

        // Check if already cashed out
        const alreadyCashedOut = await cashoutsCollection.findOne({
          parcel_id: parcel._id,
        });
        if (alreadyCashedOut) {
          return res.status(400).send({
            success: false,
            message: "Already cashed out",
          });
        }

        // Insert into cashouts with additional info
        await cashoutsCollection.insertOne({
          parcel_id: parcel._id!,
          rider_email: riderEmail!,
          rider_name: parcel.assigned_rider_name,
          earning: parcel.rider_earning ?? 0,
          cashed_out_at: new Date().toISOString(),
          trackingId: parcel.trackingId,
          parcel_name: parcel.parcelName, // ✅ Add this field
        });

        res.send({ success: true, message: "Cash out successful" });
      } catch (err) {
        console.error("Cashout error:", err);
        res.status(500).send({
          success: false,
          message: "Internal server error",
        });
      }
    });

    // PATCH /parcels/:id/assign - Assign rider to parcel
    app.patch(
      "/parcels/:id/assign",
      verifyFBToken,
      verifyAdmin,
      async (req, res) => {
        try {
          const parcelId = req.params.id;
          const { riderId } = req.body;

          // Get rider details
          const rider = await ridersCollection.findOne({
            _id: new ObjectId(riderId as string),
          });

          if (!rider) {
            return res.status(404).send({
              success: false,
              message: "Rider not found",
            });
          }

          // Update parcel with rider info
          const result = await parcelCollection.updateOne(
            { _id: new ObjectId(parcelId as string) },
            {
              $set: {
                assigned_rider_id: new ObjectId(riderId as string),
                assigned_rider_name: rider.name,
                assigned_rider_email: rider.email,
                assigned_rider_phone: rider.phone,
                delivery_status: "assigned",
              },
            },
          );

          res.send({
            success: true,
            message: "Rider assigned successfully",
            data: result,
          });

          // Notifications
          const parcel = await parcelCollection.findOne({
            _id: new ObjectId(parcelId as string),
          });
          if (parcel) {
            // To User
            notificationsCollection.insertOne({
              email: parcel.created_by,
              message: `A rider (${rider.name}) has been assigned to your parcel "${parcel.parcelName}".`,
              time: new Date().toISOString(),
              isRead: false,
              type: "status_update",
            });
            // To Rider
            notificationsCollection.insertOne({
              email: rider.email,
              message: `You have been assigned a new delivery: "${parcel.parcelName}".`,
              time: new Date().toISOString(),
              isRead: false,
              type: "status_update",
            });

            // Tracking update
            await addTrackingUpdate(
              parcel.trackingId,
              "assigned",
              `Rider assigned: ${rider.name}.`,
            );
          }
        } catch (error) {
          console.error("Error assigning rider:", error);
          res.status(500).send({
            success: false,
            message: "Internal server error",
          });
        }
      },
    );

    // PATCH /riders
    app.patch(
      "/riders/:id/status",
      verifyFBToken,
      verifyAdmin,
      async (req, res) => {
        const { id } = req.params;
        const { status, email } = req.body;
        const query = { _id: new ObjectId(id as string) };
        const updateDoc = {
          $set: { status },
        };

        try {
          const result = await ridersCollection.updateOne(query, updateDoc);
          // update user role for approved riders
          if (status === "approved") {
            const userQuery = { email };
            const userUpdateDoc = {
              $set: { role: "rider" as User["role"] },
            };
            const userResult = await usersCollection.updateOne(
              userQuery,
              userUpdateDoc,
            );
            console.log("User role updated:", userResult.modifiedCount);
          }
          res.send(result);
        } catch (error) {
          res.status(500).send({ error: "Internal Server Error" });
        }
      },
    );

    // POST /riders
    app.post("/riders", verifyFBToken, verifyAdmin, async (req, res) => {
      const rider = req.body;
      const result = await ridersCollection.insertOne(rider);
      res.send(result);
    });

    // REVIEWS API
    app.get("/reviews/rider/:email", async (req, res) => {
      const { email } = req.params;
      try {
        const reviews = await reviewsCollection
          .find({ rider_email: email })
          .sort({ date: -1 })
          .toArray();
        res.send(reviews);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch reviews" });
      }
    });

    app.post("/reviews", verifyFBToken, async (req, res) => {
      const review = req.body;
      review.date = new Date().toISOString();
      try {
        const result = await reviewsCollection.insertOne(review);
        res.send({ success: true, data: result });
      } catch (error) {
        res.status(500).send({ error: "Failed to submit review" });
      }
    });

    // NOTIFICATIONS API
    app.get("/notifications/:email", verifyFBToken, async (req, res) => {
      const { email } = req.params;
      if (req.user.email !== email) {
        return res
          .status(403)
          .send({ success: false, message: "Unauthorized" });
      }
      try {
        const notifications = await notificationsCollection
          .find({ email, isRead: false })
          .sort({ time: -1 })
          .toArray();
        res.send(notifications);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch notifications" });
      }
    });

    app.patch("/notifications/:id/read", verifyFBToken, async (req, res) => {
      const { id } = req.params;
      try {
        const result = await notificationsCollection.updateOne(
          { _id: new ObjectId(id as string) },
          { $set: { isRead: true } },
        );
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to mark as read" });
      }
    });

    app.patch(
      "/notifications/read-all/:email",
      verifyFBToken,
      async (req, res) => {
        const { email } = req.params;
        if (req.user.email !== email) {
          return res
            .status(403)
            .send({ success: false, message: "Unauthorized" });
        }
        try {
          const result = await notificationsCollection.updateMany(
            { email, isRead: false },
            { $set: { isRead: true } },
          );
          res.send(result);
        } catch (error) {
          res.status(500).send({ error: "Failed to mark all as read" });
        }
      },
    );

    // ADMIN STATS API
    app.get("/admin/stats", verifyFBToken, verifyAdmin, async (req, res) => {
      try {
        const totalRevenueResult = await paymentCollection
          .aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }])
          .toArray();

        const totalRevenue = totalRevenueResult[0]?.total || 0;

        const dailyBookings = await parcelCollection
          .aggregate([
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: { $toDate: "$creation_date" },
                  },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
            { $limit: 7 },
          ])
          .toArray();

        const parcelTypeDistribution = await parcelCollection
          .aggregate([{ $group: { _id: "$parcelType", count: { $sum: 1 } } }])
          .toArray();

        res.send({
          totalRevenue,
          dailyBookings,
          parcelTypeDistribution,
        });
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch admin stats" });
      }
    });

    // ADMIN ALL PARCELS API (With filtering and pagination)
    app.get(
      "/admin/all-parcels",
      verifyFBToken,
      verifyAdmin,
      async (req, res) => {
        const page = parseInt(req.query.page as string) || 1;
        const size = parseInt(req.query.size as string) || 10;
        const status = req.query.status as string | undefined;
        const startDate = req.query.startDate as string | undefined;
        const endDate = req.query.endDate as string | undefined;

        const query: Record<string, unknown> = {};
        if (status && status !== "all") {
          query["delivery_status"] = status;
        }
        if (startDate && endDate) {
          query["creation_date"] = {
            $gte: startDate,
            $lte: endDate,
          };
        }

        try {
          const parcels = await parcelCollection
            .find(query)
            .skip((page - 1) * size)
            .limit(size)
            .sort({ creation_date: -1 })
            .toArray();

          const total = await parcelCollection.countDocuments(query);
          res.send({ parcels, total });
        } catch (error) {
          res.status(500).send({ error: "Failed to fetch all parcels" });
        }
      },
    );

    // RIDER STATS API
    app.get("/rider/stats/:email", verifyFBToken, async (req, res) => {
      const { email } = req.params;
      try {
        const deliveryStats = await parcelCollection
          .aggregate([
            {
              $match: {
                assigned_rider_email: email,
                delivery_status: "delivered",
              },
            },
            {
              $group: {
                _id: null,
                totalDelivered: { $sum: 1 },
                totalEarnings: { $sum: "$rider_earning" },
              },
            },
          ])
          .toArray();

        const avgRatingResult = await reviewsCollection
          .aggregate([
            { $match: { rider_email: email } },
            { $group: { _id: null, avgRating: { $avg: "$rating" } } },
          ])
          .toArray();

        res.send({
          totalDelivered: deliveryStats[0]?.totalDelivered || 0,
          totalEarnings: deliveryStats[0]?.totalEarnings || 0,
          avgRating: avgRatingResult[0]?.avgRating || 0,
        });
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch rider stats" });
      }
    });

    // USER STATS API
    app.get("/user/stats/:email", verifyFBToken, async (req, res) => {
      const { email } = req.params;
      try {
        const stats = await parcelCollection
          .aggregate([
            { $match: { created_by: email } },
            {
              $group: {
                _id: null,
                totalBooked: { $sum: 1 },
                unpaidCount: {
                  $sum: { $cond: [{ $ne: ["$payment_status", "paid"] }, 1, 0] },
                },
                totalSpent: {
                  $sum: {
                    $cond: [{ $eq: ["$payment_status", "paid"] }, "$cost", 0],
                  },
                },
              },
            },
          ])
          .toArray();

        res.send({
          totalBooked: stats[0]?.totalBooked || 0,
          unpaidCount: stats[0]?.unpaidCount || 0,
          totalSpent: stats[0]?.totalSpent || 0,
        });
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch user stats" });
      }
    });

    // tracking API
    app.get("/trackings/:trackingId", async (req, res) => {
      const { trackingId } = req.params;
      const updates = await trackingCollection
        .find({ trackingId })
        .sort({ time: -1 }) // Newest first
        .toArray();
      res.send(updates);
    });

    // POST /tracking
    app.post("/trackings", async (req, res) => {
      const update = req.body;

      update.time = new Date().toISOString(); // Add current time
      if (!update.trackingId) {
        return res
          .status(400)
          .send({ success: false, message: "Missing trackingId" });
      }

      const result = await trackingCollection.insertOne(update);
      res.status(201).send(result);
    });

    // POST /payments - mark parcel as paid and save payment record
    app.post("/payments", verifyFBToken, async (req, res) => {
      try {
        const {
          parcelId,
          email,
          transactionId,
          amount,
          paymentTime,
          paymentMethod,
        } = req.body;

        if (!parcelId || !email || !transactionId || !amount) {
          return res
            .status(400)
            .send({ success: false, message: "Missing payment information" });
        }

        // 1. Update the parcel's payment_status to "paid"
        const parcelUpdateResult = await parcelCollection.updateOne(
          { _id: new ObjectId(parcelId as string) },
          { $set: { payment_status: "paid" } },
        );

        // Fetch parcel for tracking and notification
        const parcel = await parcelCollection.findOne({
          _id: new ObjectId(parcelId as string),
        });

        // 2. Insert into payments collection
        const paymentRecord = {
          parcelId: new ObjectId(parcelId as string),
          email, // could be same as created_by
          transactionId,
          amount: amount / 100,
          paymentMethod,
          paid_at: new Date().toISOString(),
          payment_time: paymentTime || new Date().toISOString(), // fallback to server time
        };

        const paymentInsertResult =
          await paymentCollection.insertOne(paymentRecord);

        res.send({
          success: true,
          message: "Payment recorded, parcel marked as paid",
          data: {
            parcelUpdateResult,
            paymentInsertResult,
          },
        });

        if (parcel) {
          // Tracking update
          await addTrackingUpdate(
            parcel.trackingId,
            "paid",
            `Payment received. Transaction ID: ${transactionId}`,
          );

          // Notification for user
          notificationsCollection.insertOne({
            email: email,
            message: `Payment of ৳${amount / 100} for your parcel "${parcel.parcelName}" has been received successfully.`,
            time: new Date().toISOString(),
            isRead: false,
            type: "payment",
          });
        }

        // Notification for user
        notificationsCollection.insertOne({
          email: email,
          message: `Payment of ৳${amount / 100} for your parcel has been received successfully.`,
          time: new Date().toISOString(),
          isRead: false,
          type: "payment",
        });
      } catch (error) {
        console.error("Error in /payments:", error);
        res
          .status(500)
          .send({ success: false, message: "Internal server error" });
      }
    });

    // POST /create-payment-intent
    app.post("/create-payment-intent", async (req, res) => {
      const amount = req.body.amount;
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: process.env.STRIPE_CURRENCY as string,
          payment_method_types: ["card"],
        });

        res.json({
          clientSecret: paymentIntent.client_secret,
        });
      } catch (error) {
        console.error("Error creating payment intent:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    console.log("✅ Connected to MongoDB and ready to handle requests");
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error);
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Parcel website server is running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
