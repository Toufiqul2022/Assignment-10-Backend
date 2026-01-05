const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const port = process.env.PORT || 3000;
const app = express();

app.use(
  cors({
    origin: "*",
    credentials: false,
  })
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mnfzzab.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log("MongoDB connected");

    const database = client.db("petServices");
    const servicesCollection = database.collection("Services");
    const ordersCollection = database.collection("orders");
    const usersCollection = database.collection("users");

    await usersCollection.createIndex({ email: 1 }, { unique: true });

    /* USERS */

    app.post("/users", async (req, res) => {
      try {
        const { name, email, photoURL } = req.body;
        if (!email)
          return res.status(400).send({ message: "Email is required" });

        const filter = { email };
        const updateDoc = {
          $set: {
            name: name || "",
            email,
            photoURL: photoURL || "",
            updatedAt: new Date(),
          },
          $setOnInsert: {
            role: "user",
            createdAt: new Date(),
          },
        };

        const result = await usersCollection.updateOne(filter, updateDoc, {
          upsert: true,
        });

        res.send({
          acknowledged: result.acknowledged,
          upsertedId: result.upsertedId || null,
          message: result.upsertedId ? "User created" : "User updated",
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });

    // Get all users
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // Get single user by email
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = await usersCollection.findOne({ email });
      res.send(user);
    });

    // Admin check (Option A: you manually set role=admin in Atlas)
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await usersCollection.findOne({ email });
      res.send({ admin: user?.role === "admin" });
    });

    /* SERVICES (LISTINGS) */

    // Add listing
    app.post("/services", async (req, res) => {
      const data = req.body;

      if (!data?.email) {
        return res
          .status(400)
          .send({ message: "email is required for listing" });
      }

      data.createdAt = new Date();
      const result = await servicesCollection.insertOne(data);
      res.send(result);
    });

    // Get all services (admin use) (optional category filter)
    app.get("/services", async (req, res) => {
      const { category } = req.query;
      const query = category ? { category } : {};
      const result = await servicesCollection.find(query).toArray();
      res.send(result);
    });

    // Get service by ID
    app.get("/services/:id", async (req, res) => {
      const { id } = req.params;
      const result = await servicesCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // My listings
    app.get("/my-services", async (req, res) => {
      const { email } = req.query;
      if (!email)
        return res.status(400).send({ message: "email query required" });

      const result = await servicesCollection.find({ email }).toArray();
      res.send(result);
    });

    // Update listing
    app.put("/update/:id", async (req, res) => {
      const { id } = req.params;
      const data = req.body;
      const result = await servicesCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: data }
      );
      res.send(result);
    });

    // Delete listing
    app.delete("/delete/:id", async (req, res) => {
      const { id } = req.params;
      const result = await servicesCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    /* ORDERS */

    // Create order
    app.post("/orders", async (req, res) => {
      const data = req.body;

      // Backward compatibility (if frontend still sends email)
      if (!data.buyerEmail && data.email) {
        data.buyerEmail = data.email;
        delete data.email;
      }

      if (!data?.buyerEmail) {
        return res.status(400).send({ message: "buyerEmail is required" });
      }

      data.createdAt = new Date();
      const result = await ordersCollection.insertOne(data);
      res.send(result);
    });

    // All orders (admin use)
    app.get("/orders", async (req, res) => {
      const result = await ordersCollection.find().toArray();
      res.send(result);
    });

    // My orders (user use)
    app.get("/my-orders", async (req, res) => {
      const { email } = req.query;
      if (!email)
        return res.status(400).send({ message: "email query required" });

      const result = await ordersCollection
        .find({ buyerEmail: email })
        .toArray();
      res.send(result);
    });

    /* CATEGORY ROUTES */

    app.get("/category/:categoryName", async (req, res) => {
      const { categoryName } = req.params;

      const categoryMap = {
        "Pets-adoption": "Pets",
        "Pet-food": "Food",
        Accessories: "accessories",
        "Pet-care-products": "Pet Care Products",
      };

      const dbCategory = categoryMap[categoryName];
      if (!dbCategory) {
        return res.status(404).send({ message: "Category not found" });
      }

      const result = await servicesCollection
        .find({ category: dbCategory })
        .toArray();
      res.send(result);
    });

    /* RECENT SERVICES */

    app.get("/recent-services", async (req, res) => {
      const result = await servicesCollection
        .find()
        .sort({ _id: -1 })
        .limit(8)
        .toArray();
      res.send(result);
    });
  } catch (err) {
    console.error(" MongoDB error:", err);
  }
}

run().catch(console.dir);

/*  ROOT */
app.get("/", (req, res) => {
  res.send("Server Running 🚀");
});

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
