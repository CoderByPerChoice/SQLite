const express = require("express");
const path = require("path");
const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");
//const db = new sqlite3.Database(":memory:");
const sqlite3dbapi = require("../data/sqlite3dbapi");
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ToDo API",
      version: "1.0.0",
      description:
        "A simple ToDo REST API integration with SQLite for data storage.",
    },
  },
  apis: ["./data/*.js"],
};

const specs = swaggerJsDoc(options);
const app = express();
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));
const PORT = process.env.PORT || 8080;
app.use(express.json());
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.get("/", function (req, res) {
  res.render("index", {
    title: "NodeJS API",
    message: "Welcome to my SQLite and NodeJS integration application.",
  });
});

//Get all ToDos.
app.get("/gettodos", async function (req, res) {
  try {
    let todos = await sqlite3dbapi.getAllTODOs();
    todos = "[" + todos + "]";
    res.status(200).send(JSON.parse(todos));
  } catch (err) {
    res.status(500).send(JSON.parse(`{"msg":"Exeption -> ${err.message}"}`));
  }
});

//Create ToDo table action.
app.post("/createtodotable", async function (req, res, next) {
  try {
    let result = await sqlite3dbapi.createToDotable();
    if (result === "SUCCESS") {
      res.status(201).send("ToDo table successfully created!");
    }
  } catch (err) {
    res.status(500).send(JSON.parse(`{"msg":"Exeption -> ${err.message}"}`));
  }
  next();
});

//Create Webhook details table action.
app.post("/createwebhookdetailstable", async function (req, res, next) {
  try {
    let result = await sqlite3dbapi.createWebHookDetailsTable();
    if (result === "SUCCESS") {
      res.status(201).send("Webhookdetails table successfully created!");
    }
  } catch (err) {
    res.status(500).send(JSON.parse(`{"msg":"Exeption -> ${err.message}"}`));
  }
  next();
});

//Register New ToDo WebHook Events.
app.post("/registernewtodowebhookevent", async (req, res, next) => {
  try {
    const endpointurl = req.body.endpointurl;
    let result = await sqlite3dbapi.addWebHookDetails(
      "NEWTODOADDED",
      endpointurl
    );
    const webhookid = result.split("|")[1];
    console.log("result -> " + result);
    result = result.split("|")[0];
    const locationURL = `https://sqliteapi.onrender.com/deregisterwebhookevent?webhookid=${webhookid}`;
    console.log(locationURL);
    if (result === "SUCCESS") {
      res
        .status(201)
        .header("Location", locationURL)
        .send(JSON.parse('{"msg":"WebHook Event added succeeded!"}'));
    }
  } catch (err) {
    res.status(500).send(JSON.parse(`{"msg":"Exeption -> ${err.message}"}`));
  }
  next();
});

//Register Update ToDo WebHook Events.
app.post("/registerupdatetodowebhookevent", async (req, res, next) => {
  try {
    const endpointurl = req.body.endpointurl;
    //console.log(loremvalue);
    let result = await sqlite3dbapi.addWebHookDetails(
      "TODOUPDATED",
      endpointurl
    );
    const webhookid = result.split("|")[1];
    console.log("result -> " + result);
    result = result.split("|")[0];
    const locationURL = `https://sqliteapi.onrender.com/deregisterwebhookevent?webhookid=${webhookid}`;
    console.log(locationURL);
    if (result === "SUCCESS") {
      res
        .status(201)
        .header("Location", locationURL)
        .send(JSON.parse('{"msg":"WebHook Event added succeeded!"}'));
    }
  } catch (err) {
    res.status(500).send(JSON.parse(`{"msg":"Exeption -> ${err.message}"}`));
  }
  next();
});

//Register Delete ToDo WebHook Events.
app.post("/registerdeletetodowebhookevent", async (req, res, next) => {
  try {
    const endpointurl = req.body.endpointurl;
    let result = await sqlite3dbapi.addWebHookDetails(
      "TODODELETED",
      endpointurl
    );
    const webhookid = result.split("|")[1];
    console.log("result -> " + result);
    result = result.split("|")[0];
    const locationURL = `https://sqliteapi.onrender.com/deregisterwebhookevent?webhookid=${webhookid}`;
    console.log(locationURL);
    if (result === "SUCCESS") {
      res
        .status(201)
        .header("Location", locationURL)
        .send(JSON.parse('{"msg":"WebHook Event added succeeded!"}'));
    }
  } catch (err) {
    res.status(500).send(JSON.parse(`{"msg":"Exeption -> ${err.message}"}`));
  }
  next();
});

//Deregister New ToDo WebHook Events.
app.delete("/deregisterwebhookevent", async (req, res, next) => {
  try {
    const webhookid = req.query.webhookid;
    let result = await sqlite3dbapi.deleteWebHook(webhookid);
    console.log("result -> " + result);
    if (result === "SUCCESS") {
      res
        .status(201)
        .send(JSON.parse('{"msg":"WebHook Event deregistered succeeded!"}'));
    }
  } catch (err) {
    res.status(500).send(JSON.parse(`{"msg":"Exeption -> ${err.message}"}`));
  }
  next();
});

//List of all registered webhooks.
app.get("/getwebhookevents", async function (req, res) {
  try {
    let webhookevents = await sqlite3dbapi.getAllWebHookDetails();
    webhookevents = "[" + webhookevents + "]";
    res.status(200).send(JSON.parse(webhookevents));
  } catch (err) {
    res.status(500).send(JSON.parse(`{"msg":"Exeption -> ${err.message}"}`));
  }
});

//Insert action.
app.post("/addtodo", async (req, res, next) => {
  try {
    const todovalue = req.body.todovalue;
    if (todovalue == undefined) throw new Error("ToDo value cannot be blank");
    let result = await sqlite3dbapi.insertTODO(todovalue);
    console.log("result -> " + result);
    if (result === "SUCCESS") {
      res.status(201).send(JSON.parse('{"msg":"Insert operation succeeded!"}'));
    }
  } catch (err) {
    res.status(500).send(JSON.parse(`{"msg":"Exeption -> ${err.message}"}`));
  }
  next();
});

//Delete action.
app.post("/deletetodo", async (req, res, next) => {
  try {
    const todoid = req.body.todoid;
    if (todoid == undefined) throw new Error("ToDo ID cannot be blank");
    let result = await sqlite3dbapi.deleteTODO(todoid);
    console.log("result -> " + result);
    if (result === "SUCCESS") {
      res.status(202).send(JSON.parse('{"msg":"Delete operation succeeded!"}'));
    }
  } catch (err) {
    res
      .status(500)
      .send(
        JSON.parse(
          `{"msg":"Exeption -> ${
            err.message !== undefined ? err.message : err
          }"}`
        )
      );
  }
  next();
});

//Update action.
app.put("/updatetodo", async (req, res, next) => {
  try {
    const todoid = req.body.todoid;
    const todovalue = req.body.todovalue;
    if (todoid == undefined || todovalue == undefined)
      throw new Error("ToDo ID or ToDo Value cannot be blank");

    let result = await sqlite3dbapi.updateTODO(todoid, todovalue);
    console.log("result -> " + result);
    if (result === "SUCCESS") {
      res.status(200).send(JSON.parse('{"msg":"Update operation succeeded!"}'));
    }
  } catch (err) {
    res.status(500).send(JSON.parse(`{"msg":"Exeption -> ${err.message}"}`));
  }
  next();
});

app.listen(PORT, console.log(`Server listening on PORT ${PORT}`));
