const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");
const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializationDatabase = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error at '${error.message}'`);
    process.exit(1);
  }
};
initializationDatabase();

const getStatusAndPriority = (GivenQuery) => {
  return GivenQuery.status !== undefined && GivenQuery.priority !== undefined;
};

const getStatus = (GivenQuery) => {
  return GivenQuery.status !== undefined;
};

const getPriority = (GivenQuery) => {
  return GivenQuery.priority !== undefined;
};

const getCategoryAndStatus = (GivenQuery) => {
  return GivenQuery.category !== undefined && GivenQuery.status !== undefined;
};
const getCategoryAndPriority = (GivenQuery) => {
  return GivenQuery.category !== undefined && GivenQuery.priority !== undefined;
};
const getSearch = (GivenQuery) => {
  return GivenQuery.search_q !== undefined;
};
const getCategory = (GivenQuery) => {
  return GivenQuery.category !== undefined;
};

const outPutConvert = (GivenData) => {
  return {
    id: GivenData.id,
    todo: GivenData.todo,
    priority: GivenData.priority,
    status: GivenData.status,
    category: GivenData.category,
    dueDate: GivenData.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let GetSQLQuery = "";

  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case getStatusAndPriority(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          GetSQLQuery = `SELECT * FROM todo WHERE status = '${status}' AND priority = '${priority}';`;
          data = await db.all(GetSQLQuery);
          response.send(data.map((eachItem) => outPutConvert(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case getCategoryAndPriority(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          GetSQLQuery = `SELECT * FROM todo WHERE category = '${category}' AND priority = '${priority}';`;
          data = await db.all(GetSQLQuery);
          response.send(data.map((eachItem) => outPutConvert(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case getStatus(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        GetSQLQuery = `SELECT * FROM todo WHERE status = '${status}';`;
        data = await db.all(GetSQLQuery);
        response.send(data.map((eachItem) => outPutConvert(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case getPriority(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        GetSQLQuery = `SELECT * FROM todo WHERE priority = '${priority}';`;
        data = await db.all(GetSQLQuery);
        response.send(data.map((eachItem) => outPutConvert(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case getCategory(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        GetSQLQuery = `SELECT * FROM todo WHERE category = '${category}';`;
        data = await db.all(GetSQLQuery);
        response.send(data.map((eachItem) => outPutConvert(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case getSearch(request.query):
      GetSQLQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      data = await db.all(GetSQLQuery);
      response.send(data.map((eachItem) => outPutConvert(eachItem)));
      break;
    default:
      GetSQLQuery = `SELECT * FROM todo;`;
      data = await db.run(GetSQLQuery);
      response.send(data.map((eachItem) => outPutConvert(eachItem)));
  }
});

// API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoBasedOnId = `
  SELECT * FROM todo
  WHERE id = '${todoId}';`;
  const TodoDetails = await db.get(getTodoBasedOnId);
  response.send(outPutConvert(TodoDetails));
});
//API 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const GetDateMatchedSQLQuery = `SELECT * FROM todo WHERE due_date = '${newDate}';`;
    const Result = await db.all(GetDateMatchedSQLQuery);
    response.send(Result.map((eachItem) => outPutConvert(eachItem)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, category, priority, status, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const postNewDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postTodoQuery = `INSERT INTO todo (id,todo,category,priority,status, due_date)
          VALUES (
              '${id}',
              '${todo}',
              '${category}',
              '${priority}',
              '${status}',
              '${postNewDate}'
          )`;
          await db.run(postTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const updateColumn = "";
  const RequestBody = request.body;
  const previousTodoQuery = `SELECT * FROM todo WHERE id = '${todoId}';`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;

  let updateQuery = "";
  switch (true) {
    case RequestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateQuery = `UPDATE todo 
        SET 
        todo = '${todo}',
        priority = '${priority}',
        status = '${status}',
        category = '${category}',
        due_date = '${dueDate}' WHERE id = '${todoId}';`;
        await db.run(updateQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case RequestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateQuery = `UPDATE todo 
        SET 
        todo = '${todo}',
        priority = '${priority}',
        status = '${status}',
        category = '${category}',
        due_date = '${dueDate}' WHERE id = '${todoId}';`;
        await db.run(updateQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case RequestBody.todo !== undefined:
      updateQuery = `UPDATE todo 
        SET 
        todo = '${todo}',
        priority = '${priority}',
        status = '${status}',
        category = '${category}',
        due_date = '${dueDate}' WHERE id = '${todoId}';`;
      await db.run(updateQuery);
      response.send("Todo Updated");
      break;

    case RequestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateQuery = `UPDATE todo 
        SET 
        todo = '${todo}',
        priority = '${priority}',
        status = '${status}',
        category = '${category}',
        due_date = '${dueDate}' WHERE id = '${todoId}';`;
        await db.run(updateQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case RequestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateQuery = `UPDATE todo 
        SET 
        todo = '${todo}',
        priority = '${priority}',
        status = '${status}',
        category = '${category}',
        due_date = '${newDueDate}' WHERE id = '${todoId}';`;
        await db.run(updateQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

// id,todo,category,priority,status, due_date

//API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const DeleteSQLQuery = `DELETE FROM todo WHERE id = '${todoId}';`;
  await db.run(DeleteSQLQuery);
  response.send("Todo Deleted");
});

module.exports = app;
