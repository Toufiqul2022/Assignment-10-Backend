const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const port = 3000;

const app = express();
app.use(cors());
app.use(express.json());

const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mnfzzab.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


async function run() {
  try {
    // await client.connect();

    const database = client.db("petServices");
    const petServices = database.collection("Services");
    const updateOrder = database.collection("orders");
    // data post in db
    app.post("/services", async (req, res) => {
      const data = req.body;
      const date = new Date();
      data.createAt = date;
      console.log(data);
      const result = await petServices.insertOne(data);
      res.send(result);
    });

    // data get form db

    app.get("/services", async (req, res) => {
      const { category } = req.query;
      const quary = {};
      if (category) {
        quary.category = category;
      }
      const result = await petServices.find(quary).toArray();
      res.send(result);
    });

    // data for details

    app.get("/services/:id", async (req, res) => {
      const id = req.params;
      const quary = { _id: new ObjectId(id) };
      const result = await petServices.findOne(quary);
      res.send(result);
    });

    // My services code
    app.get("/my-services", async (req, res) => {
      const { email } = req.query;
      const quary = { email: email };
      const result = await petServices.find(quary).toArray();
      res.send(result);
    });

    // Update
    app.put("/update/:id", async (req, res) => {
      const data = req.body;
      const { id } = req.params;

      const query = { _id: new ObjectId(id) };

      const updateServices = {
        $set: data,
      };

      const result = await petServices.updateOne(query, updateServices);
      res.send(result);
    });

    // Delete
    app.delete("/delete/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await petServices.deleteOne(query);
      res.send(result);
    });
    // order
    app.post("/orders", async (req, res) => {
      const data = req.body;
      console.log(data);
      const result = await updateOrder.insertOne(data);
      res.send(result);
    });
    // order get
    app.get("/orders", async (req, res) => {
      const result = await updateOrder.find().toArray();
      res.send(result);
    });
    // category wise services
    app.get("/category/:categoryName", async (req, res) => {
      const { categoryName } = req.params;

      // Map URL slug to MongoDB category
      const categoryMap = {
        "Pets-adoption": "Pets",
        "Pet-food": "Food",
        Accessories: "accessories",
        "Pet-care-products": "Pet Care Products",
      };

      const dbCategory = categoryMap[categoryName];

      if (!dbCategory) return res.status(404).send("Category not found");

      try {
        const result = await petServices
          .find({ category: dbCategory })
          .toArray();
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
      }
    });

    // Recent 6 listings
    app.get("/recent-services", async (req, res) => {
      try {
        const result = await petServices
          .find()
          .sort({ _id: -1 })
          .limit(6)
          .toArray();

        res.send(result);
      } catch (error) {
        console.log(error);
        res.status(500).send("Server error");
      }
    });

    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("hello I am Toufiqul");
});

app.listen(port, () => {
  console.log(`server is running on ${port}`);
});
