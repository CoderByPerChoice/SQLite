const sqlite3 = require("sqlite3").verbose();

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

        db.serialize(() => {
          db.each("SELECT rowid AS id, task FROM TODO", (err, row) => {
            //todos.push(row.id + ": " + row.task);
            let placeholder =
              '{"id":"' + row.id + '","todo":"' + row.task + '"}';
            todos.push(placeholder);
            resolve(todos);
          });
          // let sql = `SELECT rowid AS id, task FROM TODO`;
          // db.all(sql, [], (err, rows) => {
          //   if (err) {
          //     throw err;
          //   }
          //   rows.forEach((row) => {
          //     text += text.replace(
          //       "placeholder",
          //       `{ "id":"${row.id}" , "todo":"${row.task}" },placeholder`
          //     );
          //     console.log(text);
          //     // console.log(row.name);
          //     //todos.push(row.id + ": " + row.task);
          //     //resolve(todos);
          //     resolve(text);
          //   });
          // });
        });
        db.close();
      } catch (error) {
        reject(error);
      } finally {
      }
    });
  }

  function createDB() {
    return new Promise(async (resolve, reject) => {
      try {
        //const db = new sqlite3.Database("Employees.db");
        const db = getDBRefObj();
        db.serialize(() => {
          db.run("CREATE TABLE TODO (task TEXT)");
          // db.all("", [], (err, rows) => {
          //     rows
          // })
          //   const stmt = db.prepare("INSERT INTO TODO VALUES (?)");
          //   for (let i = 0; i < 10; i++) {
          //     stmt.run("Ipsum " + i);
          //   }
          //   stmt.finalize();

          db.each("SELECT rowid AS id, task FROM TODO", (err, row) => {
            console.log(row.id + ": " + row.task);
          });
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
          const stmt = db.prepare("INSERT INTO TODO VALUES (?)");
          stmt.run(todovalue);
          stmt.finalize();

          db.each("SELECT rowid AS id, task FROM TODO", (err, row) => {
            console.log(row.id + ": " + row.task);
          });
          resolve("SUCCESS");
          db.close();
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
        db.serialize(() => {
          const stmt = db.prepare("DELETE FROM TODO where rowid = (?)");
          stmt.run([todoid]);
          stmt.finalize();

          db.each("SELECT rowid AS id, task FROM TODO", (err, row) => {
            console.log(row.id + ": " + row.task);
          });
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

          db.each("SELECT rowid AS id, task FROM TODO", (err, row) => {
            console.log(row.id + ": " + row.task);
          });
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
    createDB,
    insertTODO,
    deleteTODO,
    updateTODO,
  };
}

module.exports = sqlite3dbapi();
