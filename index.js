require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { urlencoded } = require("body-parser");
const { MongoClient } = require("mongodb");
const dns = require("dns");
const urlparser = require("url");
const { error } = require("console");

const port = process.env.PORT || 3000;
const client = new MongoClient(process.env.MONGO_URI);
const db = client.db("urlShortner");
const urls = db.collection("urls");

const app = express();

// Basic Configuration

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", function (req, res, next) {
  console.log(req.body);
  const url = req.body.url;
  const dnslookup = dns.lookup(
    urlparser.parse(url).hostname,
    async (err, address) => {
      if (!address) {
        res.json({ error: "Invalid URL" });
      } else {
        const urlCount = await urls.countDocuments({});
        const urlDoc = {
          url,
          short_url: urlCount,
        };
        const result = await urls.insertOne(urlDoc);
        console.log(result);
        res.json({ original_url: url, short_url: urlCount });
      }
    }
  );
  // const originalURL = req.body.url;
  // const urlObject = new URL(originalURL);
  // dns.lookup(urlObject.hostname, (err, address, family) => {
  //   if (err) {
  //     res.json({
  //       originalURL: originalURL,
  //       shortenedURL: "Invalid URL",
  //     });
  //   } else {
  //     let shortenedURL = Math.floor(Math.random() * 100000).toString();

  //     // create an object(document) and save it on the DB
  //     let data = new Model({
  //       originalURL: originalURL,
  //       shortenedURL: shortenedURL,
  //     });

  //     data.save((err, data) => {
  //       if (err) {
  //         console.error(err);
  //       }
  //     });

  //     res.json({
  //       originalURL: originalURL,
  //       shortenedURL: shortenedURL,
  //     });
  //   }
  // });
});

app.get("/api/shorturl:short_url", async (req, res) => {
  const shortUrl = req.params.short_url;
  const urlDoc = await urls.findOne({ shortUrl: +short_url });
  res.redirect(urlDoc.url);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
