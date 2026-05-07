import { Router } from "express";
import { ObjectId } from "mongodb";
import { addressesCollection } from "../db";
import { verifyFBToken } from "../middleware/auth";
import { Address } from "../types";

const router = Router();

router.use(verifyFBToken);

// Get my addresses
router.get("/", async (req, res) => {
  try {
    const addresses = await addressesCollection
      .find({ userEmail: req.user.email })
      .sort({ isDefault: -1, createdAt: -1 })
      .toArray();
    res.send({ success: true, data: addresses });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to fetch addresses" });
  }
});

// Add new address
router.post("/", async (req, res) => {
  try {
    const { label, fullName, phone, address, district, region, isDefault } = req.body;
    
    if (isDefault) {
      // Unset other defaults
      await addressesCollection.updateMany(
        { userEmail: req.user.email },
        { $set: { isDefault: false } }
      );
    }

    const newAddress: Address = {
      userEmail: req.user.email as string,
      label,
      fullName,
      phone,
      address,
      district,
      region,
      isDefault: !!isDefault,
      createdAt: new Date().toISOString(),
    };

    const result = await addressesCollection.insertOne(newAddress);
    res.status(201).send({ success: true, id: result.insertedId });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to save address" });
  }
});

// Delete address
router.delete("/:id", async (req, res) => {
  try {
    await addressesCollection.deleteOne({
      _id: new ObjectId(String(req.params.id)),
      userEmail: req.user.email,
    });
    res.send({ success: true, message: "Address deleted" });
  } catch (error) {
    res.status(500).send({ success: false, message: "Failed to delete address" });
  }
});

export default router;
