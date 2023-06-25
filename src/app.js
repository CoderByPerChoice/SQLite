const express = require("express");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");
//const db = new sqlite3.Database(":memory:");
const sqlite3dbapi = require("../data/sqlite3dbapi");
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My ToDo API",
      version: "1.0.0",
      description: "A simple Express Library API",
    },
    servers: [
      {
        url: "http://localhost:8080",
      },
      {
        url: "https://sqliteapi.onrender.com",
      },
    ],
  },
  apis: ["./data/*.js"],
};

const specs = swaggerJsDoc(options);
const app = express();
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));
const PORT = process.env.PORT || 8080;
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.get("/", function (req, res) {
  // res.send(
  //   "INFO - This is my attempt to create REST API between NODEJS and SQLITE!"
  // );
  res.render("index", {
    title: "NodeJS API",
    message: "Welcome to my SQLite and NodeJS integration application.",
  });
});

app.get("/gettodos", async function (req, res) {
  let todos = await sqlite3dbapi.getAllTODOs();
  //let content = await convertArrayToJson(todos);
  todos = "[" + todos + "]";
  res.status(200).send(JSON.parse(todos));
});

//Create ToDo table action.
app.post("/createtodotable", async function (req, res, next) {
  let result = await sqlite3dbapi.createToDotable();
  if (result === "SUCCESS") {
    res.status(201).send("ToDo table successfully created!");
  }
  next();
});

//Create Webhook details table action.
app.post("/createwebhookdetailstable", async function (req, res, next) {
  let result = await sqlite3dbapi.createWebHookDetailsTable();
  if (result === "SUCCESS") {
    res.status(201).send("Webhookdetails table successfully created!");
  }
  next();
});

//Register New ToDo WebHook Events.
app.post("/registernewtodowebhookevent", async (req, res, next) => {
  //console.log("Request Body -> " + req);
  //const eventname = req.body.eventname;
  const endpointurl = req.body.endpointurl;
  //console.log(loremvalue);
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
  } else {
    res.status(500).send(JSON.parse('{"msg":"Some exception have occurred."}'));
  }
  next();
});

//Register Update ToDo WebHook Events.
app.post("/registerupdatetodowebhookevent", async (req, res, next) => {
  //console.log("Request Body -> " + req);
  //const eventname = req.body.eventname;
  const endpointurl = req.body.endpointurl;
  //console.log(loremvalue);
  let result = await sqlite3dbapi.addWebHookDetails("TODOUPDATED", endpointurl);
  console.log("result -> " + result);
  if (result === "SUCCESS") {
    res
      .status(201)
      .send(JSON.parse('{"msg":"WebHook Event added succeeded!"}'));
  } else {
    res.status(500).send(JSON.parse('{"msg":"Some exception have occurred."}'));
  }
  next();
});

//Register Delete ToDo WebHook Events.
app.post("/registerdeletetodowebhookevent", async (req, res, next) => {
  //console.log("Request Body -> " + req);
  //const eventname = req.body.eventname;
  const endpointurl = req.body.endpointurl;
  //console.log(loremvalue);
  let result = await sqlite3dbapi.addWebHookDetails("TODODELETED", endpointurl);
  console.log("result -> " + result);
  if (result === "SUCCESS") {
    res
      .status(201)
      .send(JSON.parse('{"msg":"WebHook Event added succeeded!"}'));
  } else {
    res.status(500).send(JSON.parse('{"msg":"Some exception have occurred."}'));
  }
  next();
});

//Deregister New ToDo WebHook Events.
app.post("/deregisterwebhookevent", async (req, res, next) => {
  //console.log("Request Body -> " + req.body);
  const webhookid = req.query.webhookid;
  //const eventname = req.body.eventname;
  //const endpointurl = req.body.endpointurl;
  //console.log(loremvalue);
  let result = await sqlite3dbapi.deleteWebHook(webhookid);
  console.log("result -> " + result);
  if (result === "SUCCESS") {
    res
      .status(201)
      .send(JSON.parse('{"msg":"WebHook Event deregistered succeeded!"}'));
  } else {
    res.status(500).send(JSON.parse('{"msg":"Some exception have occurred."}'));
  }
  next();
});

//List of all registered webhooks.
app.get("/getwebhookevents", async function (req, res) {
  let webhookevents = await sqlite3dbapi.getAllWebHookDetails();
  webhookevents = "[" + webhookevents + "]";
  res.status(200).send(JSON.parse(webhookevents));
});

//Insert action.
app.post("/addtodo", async (req, res, next) => {
  const todovalue = req.body.todovalue;
  //console.log(loremvalue);
  let result = await sqlite3dbapi.insertTODO(todovalue);
  console.log("result -> " + result);
  if (result === "SUCCESS") {
    res.status(201).send(JSON.parse('{"msg":"Insert operation succeeded!"}'));
  } else {
    res.status(500).send(JSON.parse('{"msg":"Some exception have occurred."}'));
  }
  next();
});

//Delete action.
app.post("/deletetodo", async (req, res, next) => {
  const todoid = req.body.todoid;
  let result = await sqlite3dbapi.deleteTODO(todoid);
  console.log("result -> " + result);
  if (result === "SUCCESS") {
    res.status(201).send(JSON.parse('{"msg":"Delete operation succeeded!"}'));
  } else {
    res.status(500).send(JSON.parse('{"msg":"Some exception have occurred."}'));
  }
  next();
});

//Update action.
app.put("/updatetodo", async (req, res, next) => {
  const todoid = req.body.todoid;
  const todovalue = req.body.todovalue;
  let result = await sqlite3dbapi.updateTODO(todoid, todovalue);
  console.log("result -> " + result);
  if (result === "SUCCESS") {
    res.status(201).send(JSON.parse('{"msg":"Update operation succeeded!"}'));
  } else {
    res.status(500).send(JSON.parse('{"msg":"Some exception have occurred."}'));
  }
  next();
});

app.listen(PORT, console.log(`Server listening on PORT ${PORT}`));
