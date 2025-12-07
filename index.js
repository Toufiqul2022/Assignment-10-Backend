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
