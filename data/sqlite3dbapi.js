const sqlite3 = require("sqlite3").verbose();
const fetch = require("node-fetch");

function sqlite3dbapi() {
  //Get DB Reference Object.
  function getDBRefObj() {
    const databaseObj = new sqlite3.Database(
      "TODOs.db",
      sqlite3.OPEN_READWRITE
    );
    // const databaseObj = new sqlite3.Database(
    //   ":memory:",
    //   sqlite3.OPEN_READWRITE
    // );

    return databaseObj;
  }

  function getAllTODOs() {
    return new Promise(async (resolve, reject) => {
      try {
        const db = getDBRefObj();
        let todos = [];
        let sql = `SELECT rowid AS id, task FROM TODO
           ORDER BY rowid`;

        db.all(sql, [], (err, rows) => {
          if (err) {
            //throw err;
            reject(err);
          } else {
            //Check if there are rows in the table.
            if (rows.length > 0) {
              //If the table is not empty.
              rows.forEach((row) => {
                //console.log(row.name);
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
        // db.serialize(() => {
        //   db.each("SELECT rowid AS id, task FROM TODO", (err, row) => {
        //     //todos.push(row.id + ": " + row.task);
        //     let placeholder =
        //       '{"id":"' + row.id + '","todo":"' + row.task + '"}';
        //     todos.push(placeholder);
        //     resolve(todos);
        //   });
        // });
        db.close();
      } catch (error) {
        reject(error);
      } finally {
      }
    });
  }

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
        // db.serialize(() => {
        //   db.each(
        //     "SELECT rowid AS id, eventname, endpointurl FROM WebHookDetails",
        //     (err, row) => {
        //       let placeholder =
        //         '{"id":"' +
        //         row.id +
        //         '","eventname":"' +
        //         row.eventname +
        //         '","endpointurl":"' +
        //         row.endpointurl +
        //         '"}';
        //       webhookdetails.push(placeholder);
        //       resolve(webhookdetails);
        //     }
        //   );
        // });
        db.close();
      } catch (error) {
        reject(error);
      } finally {
      }
    });
  }

  function addWebHookDetails(eventname, endpointurl) {
    return new Promise(async (resolve, reject) => {
      try {
        const db = getDBRefObj();
        let webhookid = "0";
        db.serialize(() => {
          try {
            const stmt = db.prepare("INSERT INTO WebHookDetails VALUES (?,?)");
            stmt.run(eventname, endpointurl);
            stmt.finalize();

            db.each(
              "select max(rowid) as id from WebHookDetails",
              (err, row) => {
                webhookid = row.id;
                resolve(`SUCCESS|${webhookid}`);
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

  function deleteWebHook(webhookid) {
    return new Promise(async (resolve, reject) => {
      try {
        const db = getDBRefObj();
        db.serialize(() => {
          const stmt = db.prepare(
            "DELETE FROM WebHookDetails where rowid = (?)"
          );
          stmt.run([webhookid]);
          stmt.finalize();
          resolve("SUCCESS");
          db.close();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  function createToDotable() {
    return new Promise(async (resolve, reject) => {
      try {
        //const db = new sqlite3.Database("Employees.db");
        const db = getDBRefObj();
        db.serialize(() => {
          db.run("CREATE TABLE TODO (task TEXT)");
          resolve("SUCCESS");
          db.close();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  function createWebHookDetailsTable() {
    return new Promise(async (resolve, reject) => {
      try {
        //const db = new sqlite3.Database("Employees.db");
        const db = getDBRefObj();
        db.serialize(() => {
          db.run("CREATE TABLE WebHookDetails (eventname TEXT, endpointurl)");
          resolve("SUCCESS");
          db.close();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  function insertTODO(todovalue) {
    return new Promise(async (resolve, reject) => {
      try {
        const db = getDBRefObj();
        db.serialize(() => {
          try {
            const stmt = db.prepare("INSERT INTO TODO VALUES (?)");
            stmt.run(todovalue);
            stmt.finalize((err) => {
              reject(err);
            });
            db.each(
              "SELECT rowid AS id, eventname, endpointurl FROM WebHookDetails where eventname = 'NEWTODOADDED'",
              async (err, row) => {
                try {
                  const body = { todovalue: todovalue };
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
                }
              }
            );
            resolve("SUCCESS");
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

  function deleteTODO(todoid) {
    return new Promise(async (resolve, reject) => {
      try {
        const db = getDBRefObj();
        let todovalue = "";

        db.serialize(() => {
          db.each(
            `select task from TODO where rowid = ${todoid}`,
            (err, row) => {
              todovalue = row.task;
              console.log("ToDo deleted -> " + todovalue);
            }
          );

          const stmt = db.prepare("DELETE FROM TODO where rowid = (?)");
          stmt.run([todoid]);
          stmt.finalize();

          db.each(
            "SELECT rowid AS id, eventname, endpointurl FROM WebHookDetails where eventname = 'TODODELETED'",
            async (err, row) => {
              try {
                const body = { todoid: todoid, todovalue: todovalue };
                const response = await fetch(row.endpointurl, {
                  method: "POST",
                  body: JSON.stringify(body),
                  headers: { "Content-Type": "application/json" },
                });
                const data = await response;
                console.log(data);
              } catch (error) {
                console.log(error);
              }
            }
          );
          resolve("SUCCESS");
          db.close();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  function updateTODO(todoid, todovalue) {
    return new Promise(async (resolve, reject) => {
      try {
        const db = getDBRefObj();
        db.serialize(() => {
          const stmt = db.prepare(
            "UPDATE TODO set task = (?) where rowid = (?)"
          );
          stmt.run([todovalue, todoid]);
          stmt.finalize();

          db.each(
            "SELECT rowid AS id, eventname, endpointurl FROM WebHookDetails where eventname = 'TODOUPDATED'",
            async (err, row) => {
              try {
                const body = { todoid: todoid, todovalue: todovalue };
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
              }
            }
          );
          resolve("SUCCESS");
          db.close();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * @swagger
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
   *         {"todos":[{"id":"3","todo":"Mastering Update"}]}
   */

  /**
   * @swagger
   * tags:
   *   name: ToDos
   *   description: The ToDos managing API
   */

  /**
   * @swagger
   * /gettodos:
   *   get:
   *     summary: Returns the list of all ToDos
   *     tags: [ToDos]
   *     responses:
   *       200:
   *         description: The list of the ToDos
   *         content:
   *           application/json:
   *             schema:
   *               type: json
   */

  /**
   * @swagger
   * /addtodo:
   *   post:
   *     summary: Create a new ToDo
   *     tags: [ToDos]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ToDos'
   *     responses:
   *       201:
   *         description: The ToDo was successfully created
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ToDos'
   *       500:
   *         description: Some server error
   */

  return {
    getAllTODOs,
    createToDotable,
    createWebHookDetailsTable,
    insertTODO,
    deleteTODO,
    updateTODO,
    addWebHookDetails,
    getAllWebHookDetails,
    deleteWebHook,
  };
}

module.exports = sqlite3dbapi();
