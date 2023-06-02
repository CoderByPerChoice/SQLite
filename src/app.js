const express = require("express");
const path = require("path");
//const db = new sqlite3.Database(":memory:");
const sqlite3dbapi = require("../data/sqlite3dbapi");
const app = express();
const PORT = process.env.PORT || 8080;
app.use(express.json());

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
  console.log(todos);
  //   //JSON.parse(todos);
  //   let array = ["Apple", "Orange", "Cherry", "Blueberry"];

  //   console.log(JSON.parse(JSON.stringify(array)));
  res.status(200).send(JSON.stringify(todos));
});

//Create DB action.
app.post("/createdb", async function (req, res, next) {
  let result = await sqlite3dbapi.createDB();
  if (result === "SUCCESS") {
    res.status(201).send("database successfully created!");
  }
  next();
});

//Insert action.
app.post("/addtodo", async (req, res, next) => {
  const todovalue = req.body.todovalue;
  //console.log(loremvalue);
  let result = await sqlite3dbapi.insertTODO(todovalue);
  console.log("result -> " + result);
  if (result === "SUCCESS") {
    res.status(201).send("Insert operation succeeded!");
  }
  next();
});

//Delete action.
app.delete("/deletetodo", async (req, res, next) => {
  const todoid = req.body.todoid;
  let result = await sqlite3dbapi.deleteTODO(todoid);
  console.log("result -> " + result);
  if (result === "SUCCESS") {
    res.status(200).send("Delete operation succeeded!");
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
    res.status(200).send("Update operation succeeded!");
  }
  next();
});

app.listen(PORT, console.log(`Server listening on PORT ${PORT}`));
