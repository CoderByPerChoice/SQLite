const sqlite3 = require("sqlite3").verbose();
const fetch = require("node-fetch");

function sqlite3dbapi() {
  //Get DB Reference Object.
  function getDBRefObj() {
    const databaseObj = new sqlite3.Database(
      "TODOs.db",
      sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
    );
    // const databaseObj = new sqlite3.Database(
    //   ":memory:",
    //   sqlite3.OPEN_READWRITE
    // );

    return databaseObj;
  }

  //Get all ToDos from database.
  function getAllTODOs() {
    return new Promise(async (resolve, reject) => {
      try {
        const db = getDBRefObj();
        let todos = [];
        let sql = `SELECT rowid AS id, task FROM TODO
           ORDER BY rowid`;

        db.all(sql, [], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            //Check if there are rows in the table.
            if (rows.length > 0) {
              //If the table is not empty.
              rows.forEach((row) => {
                let placeholder =
                  '{"id":"' + row.id + '","todo":"' + row.task + '"}';
                todos.push(placeholder);
                resolve(todos);
              });
            } else {
              //return empty array.
              resolve(todos);
            }
          }
        });
        db.close();
      } catch (error) {
        reject(error);
      } finally {
      }
    });
  }

  //Get all webhook details registered.
  function getAllWebHookDetails() {
    return new Promise(async (resolve, reject) => {
      try {
        const db = getDBRefObj();
        let webhookdetails = [];

        let sql = `SELECT rowid AS id, eventname, endpointurl FROM WebHookDetails`;

        db.all(sql, [], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            //Check if there are rows in the table.
            if (rows.length > 0) {
              //If the table is not empty.
              rows.forEach((row) => {
                let placeholder =
                  '{"id":"' +
                  row.id +
                  '","eventname":"' +
                  row.eventname +
                  '","endpointurl":"' +
                  row.endpointurl +
                  '"}';
                webhookdetails.push(placeholder);
                resolve(webhookdetails);
              });
            } else {
              //return empty array.
              resolve(webhookdetails);
            }
          }
        });
        db.close();
      } catch (error) {
        reject(error);
      } finally {
      }
    });
  }

  //Add new webhook subscriber.
  function addWebHookDetails(eventname, endpointurl) {
    return new Promise(async (resolve, reject) => {
      try {
        const db = getDBRefObj();
        let webhookid = "0";
        db.serialize(() => {
          try {
            const stmt = db.prepare("INSERT INTO WebHookDetails VALUES (?,?)");
            stmt.run(eventname, endpointurl);
            stmt.finalize((err) => {
              if (err) {
                reject(err);
              }
            });

            db.each(
              "select max(rowid) as id from WebHookDetails",
              (err, row) => {
                if (err) {
                  reject(err);
                } else {
                  webhookid = row.id;
                  resolve(`SUCCESS|${webhookid}`);
                }
              }
            );

            db.close();
          } catch (error) {
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  //Delete webhook subscriber.
  function deleteWebHook(webhookid) {
    return new Promise(async (resolve, reject) => {
      try {
        const db = getDBRefObj();
        db.serialize(() => {
          const stmt = db.prepare(
            "DELETE FROM WebHookDetails where rowid = (?) and EXISTS (Select * from WebHookDetails where rowid = (?))",
            (err) => {
              if (err) reject(err);
            }
          );
          stmt.run([webhookid, webhookid]);
          stmt.finalize((err) => {
            if (err) {
              reject(err);
            } else {
              resolve("SUCCESS");
            }
          });
          db.close();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  //Create ToDo table.
  function createIfNotExistsToDotable() {
    return new Promise(async (resolve, reject) => {
      try {
        //const db = new sqlite3.Database("Employees.db");
        const db = getDBRefObj();
        db.serialize(() => {
          db.run("CREATE TABLE IF NOT EXISTS TODO (task TEXT)", (err) => {
            if (err) {
              reject(err);
            } else {
              resolve("SUCCESS");
            }
          });
          db.close();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  //Create webhook table.
  function createIfNotExistsWebHookDetailsTable() {
    return new Promise(async (resolve, reject) => {
      try {
        //const db = new sqlite3.Database("Employees.db");
        const db = getDBRefObj();
        db.serialize(() => {
          db.run(
            "CREATE TABLE IF NOT EXISTS WebHookDetails (eventname TEXT, endpointurl TEXT)",
            (err) => {
              if (err) {
                reject(err);
              } else {
                resolve("SUCCESS");
              }
            }
          );

          db.close();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  //Insert a new ToDo.
  function insertTODO(todovalue) {
    return new Promise(async (resolve, reject) => {
      try {
        const db = getDBRefObj();
        db.serialize(() => {
          try {
            const stmt = db.prepare("INSERT INTO TODO VALUES (?)", (err) => {
              if (err) reject(err);
            });

            stmt.run(todovalue);
            stmt.finalize((err) => {
              if (err) {
                reject(err);
              } else {
                resolve("SUCCESS");
              }
            });

            //#region Notify WebHook subscribers of this event.
            db.each(
              "SELECT rowid AS id, eventname, endpointurl FROM WebHookDetails where eventname = 'NEWTODOADDED'",
              async (err, row) => {
                try {
                  const body = { operation: "add", todovalue: todovalue };
                  const response = await fetch(row.endpointurl, {
                    method: "POST",
                    body: JSON.stringify(body),
                    //body: { msg: todovalue },
                    headers: { "Content-Type": "application/json" },
                  });
                  const data = await response;
                  console.log(data);
                } catch (error) {
                  console.log(error);
                  reject(error);
                }
              }
            );
            //#endregion

            db.close();
          } catch (error) {
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  //Delete existing ToDo by supplying ID.
  function deleteTODO(todoid) {
    return new Promise(async (resolve, reject) => {
      try {
        const db = getDBRefObj();
        let todovalue = "";

        db.serialize(() => {
          db.get(
            "select task from TODO where rowid = (?)",
            [todoid],
            (err, row) => {
              if (err) reject(err);
              if (!row) reject("ToDo ID does not exist");
              if (row) {
                todovalue = row.task;
                console.log("ToDo to be deleted -> " + todovalue);
                const stmt = db.prepare(
                  "DELETE FROM TODO where rowid = (?)",
                  (err) => {
                    if (err) reject(err);
                  }
                );

                stmt.run([todoid]);
                stmt.finalize((err) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve("SUCCESS");
                  }
                });

                //#region Notify WebHook subscribers of this event.
                db.each(
                  "SELECT rowid AS id, eventname, endpointurl FROM WebHookDetails where eventname = 'TODODELETED'",
                  async (err, row) => {
                    try {
                      const body = { operation: "delete", todoid: todoid, todovalue: todovalue };
                      const response = await fetch(row.endpointurl, {
                        method: "POST",
                        body: JSON.stringify(body),
                        headers: { "Content-Type": "application/json" },
                      });
                      const data = await response;
                      console.log(data);
                    } catch (error) {
                      console.log(error);
                      reject(error);
                    }
                  }
                );
                //#endregion
                db.close();
              }
            }
          );
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  //Update existing ToDo by supplying ID and value.
  function updateTODO(todoid, todovalue) {
    return new Promise(async (resolve, reject) => {
      try {
        const db = getDBRefObj();
        db.serialize(() => {
          const stmt = db.prepare(
            "UPDATE TODO set task = (?) where rowid = (?) and EXISTS (Select * from TODO where rowid = (?))",
            (err) => {
              if (err) reject(err);
            }
          );
          stmt.run([todovalue, todoid, todoid]);
          stmt.finalize((err) => {
            if (err) {
              reject(err);
            } else {
              resolve("SUCCESS");
            }
          });

          //#region Notify WebHook subscribers of this event.
          db.each(
            "SELECT rowid AS id, eventname, endpointurl FROM WebHookDetails where eventname = 'TODOUPDATED'",
            async (err, row) => {
              try {
                const body = { operation: "update", todoid: todoid, todovalue: todovalue };
                const response = await fetch(row.endpointurl, {
                  method: "POST",
                  body: JSON.stringify(body),
                  //body: { msg: todovalue },
                  headers: { "Content-Type": "application/json" },
                });
                const data = await response;
                console.log(data);
              } catch (error) {
                console.log(error);
                reject(error);
              }
            }
          );
          //#endregion
          db.close();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * @swagger
   * tags:
   *   name: ToDos
   *   description: The ToDos managing API
   * components:
   *   schemas:
   *     ToDos:
   *       type: object
   *       required:
   *         - id
   *         - task
   *       properties:
   *         id:
   *           type: number
   *           description: The auto-generated id of the ToDo
   *         task:
   *           type: string
   *           description: ToDo task
   *       example:
   *         [{"todoid":"1","todovalue":"Something you want to do"}]
   *
   *     AddToDo:
   *       type: object
   *       required:
   *         - task
   *       properties:
   *         task:
   *           type: string
   *           description: ToDo task
   *       example:
   *         {"todovalue":"Something you want to do"}
   *
   *     UpdateToDo:
   *       type: object
   *       required:
   *         - id
   *         - task
   *       properties:
   *         id:
   *           type: number
   *           description: Id of the ToDo to be updated.
   *         task:
   *           type: string
   *           description: ToDo task
   *       example:
   *         {"todoid":"ToDo ID to update","todovalue":"ToDo you want to update with"}
   *
   *     DeleteToDo:
   *       type: object
   *       required:
   *         - id
   *       properties:
   *         id:
   *           type: number
   *           description: Id of the ToDo to be deleted.
   *       example:
   *         {"todoid":"ToDo ID to be deleted"}
   *
   *     OperationResponse:
   *       type: object
   *       required:
   *         - msg
   *       properties:
   *         msg:
   *           type: string
   *           description: Operation response
   *       example:
   *         {"msg":"Operation succeeded!"}
   *
   *     Webhook:
   *       required:
   *        - endpointurl
   *       properties:
   *         endpointurl:
   *           type: string
   * /gettodos:
   *   get:
   *     summary: Returns the list of all ToDos
   *     tags: [ToDos]
   *     responses:
   *       200:
   *         description: The list of the ToDos
   * /addtodo:
   *   post:
   *     summary: Create a new ToDo
   *     tags: [ToDos]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/AddToDo'
   *     responses:
   *       201:
   *         description: The ToDo was successfully created
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/OperationResponse'
   *       500:
   *         description: Some server error
   * /updatetodo:
   *   put:
   *     summary: Update an existing ToDo
   *     tags: [ToDos]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateToDo'
   *     responses:
   *       200:
   *         description: The ToDo was successfully updated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/OperationResponse'
   *       500:
   *         description: Some server error
   * /deletetodo:
   *   post:
   *     summary: Delete an existing ToDo
   *     tags: [ToDos]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/DeleteToDo'
   *     responses:
   *       202:
   *         description: The ToDo was successfully deleted
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/OperationResponse'
   *       500:
   *         description: Some server error
   * /getwebhookevents:
   *   summary: Gets all registered ToDo webhook events.
   *   get:
   *     summary: Gets all registered ToDo webhook events.
   *     tags: [WebHooks]
   *     responses:
   *       "200":
   *         description: Return a 200 status to indicate successful retrievel of registered webhooks.
   *       "500":
   *         description: Return a 500 status to indicate that an exception have occurred.
   * /registernewtodowebhookevent:
   *   summary: Registers new ToDo webhook.
   *   post:
   *     summary: Registers new ToDo webhook.
   *     tags: [WebHooks]
   *     requestBody:
   *       description: Register webhook for new ToDo event.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Webhook'
   *     responses:
   *       "201":
   *         description: Return a 201 status to indicate that webhook was registered successfully.
   *       "500":
   *         description: Return a 500 status to indicate that an exception have occurred.
   * /registerupdatetodowebhookevent:
   *   summary: Registers update ToDo webhook.
   *   post:
   *     summary: Registers update ToDo webhook.
   *     tags: [WebHooks]
   *     requestBody:
   *       description: Register webhook for an update ToDo event.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Webhook'
   *     responses:
   *       "201":
   *         description: Return a 201 status to indicate that webhook was registered successfully.
   *       "500":
   *         description: Return a 500 status to indicate that an exception have occurred.
   * /registerdeletetodowebhookevent:
   *   summary: Registers delete ToDo webhook.
   *   post:
   *     summary: Registers delete ToDo webhook.
   *     tags: [WebHooks]
   *     requestBody:
   *       description: Register webhook for delete ToDo event.
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Webhook'
   *     responses:
   *       "201":
   *         description: Return a 201 status to indicate that webhook was registered successfully.
   *       "500":
   *         description: Return a 500 status to indicate that an exception have occurred.
   * /deregisterwebhookevent?webhookid={webhookid}:
   *   summary: Deregister's webhook.
   *   delete:
   *     summary: Deregister's webhook.
   *     tags: [WebHooks]
   *     parameters:
   *       - in: path
   *         name: webhookid
   *         required: true
   *         schema:
   *           type: integer
   *         description: Weebhook id to deregister.
   *     responses:
   *       "201":
   *         description: Return a 201 status to indicate that webhook was deregistered successfully.
   *       "500":
   *         description: Return a 500 status to indicate that an exception have occurred.
   */

  return {
    getAllTODOs,
    createIfNotExistsToDotable,
    createIfNotExistsWebHookDetailsTable,
    insertTODO,
    deleteTODO,
    updateTODO,
    addWebHookDetails,
    getAllWebHookDetails,
    deleteWebHook,
  };
}

module.exports = sqlite3dbapi();
