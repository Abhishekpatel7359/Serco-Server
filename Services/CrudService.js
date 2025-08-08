// const db = require("../Config/Pool");

// function executeQuery(query, values) {
//   return new Promise((resolve, reject) => {
//     db.query(query, values, (err, results) => {
//       if (err) return reject(err);
//       resolve(results);
//     });
//   });
// }

// function buildDynamicQuery(queryType, table, data, conditions) {
//   let query = "";
//   let values = [];

//   switch (queryType.toLowerCase()) {
//     case "insert":
//       query = `INSERT INTO ${table} (${Object.keys(data).join(",")}) VALUES (${Object.keys(data).map(() => "?").join(",")})`;
//       values = Object.values(data);
//       break;

//     case "update":
//       query = `UPDATE ${table} SET ${Object.keys(data).map((key) => `${key} = ?`).join(",")} WHERE ${Object.keys(conditions).map((key) => `${key} = ?`).join(" AND ")}`;
//       values = [...Object.values(data), ...Object.values(conditions)];
//       break;

//     case "delete":
//       query = `DELETE FROM ${table} WHERE ${Object.keys(conditions).map((key) => `${key} = ?`).join(" AND ")}`;
//       values = Object.values(conditions);
//       break;

//     case "select":

//     if (conditions && Object.keys(conditions).length > 0) {
//         query = `SELECT * FROM ${table} WHERE ${Object.keys(conditions).map((key) => `${key} = ?`).join(" AND ")}`;
//         values = Object.values(conditions);
//       } else {
//         query = `SELECT * FROM ${table}`; // Select all rows if no conditions are provided
//       }

//     //   query = `SELECT * FROM ${table} WHERE ${Object.keys(conditions).map((key) => `${key} = ?`).join(" AND ")}`;
//     //   values = Object.values(conditions);
//       break;

//     case "batch-insert":
//       query = `INSERT INTO ${table} (${Object.keys(data[0]).join(",")}) VALUES ${data.map(() => `(${Object.keys(data[0]).map(() => "?").join(",")})`).join(",")}`;
//       values = data.flatMap(Object.values);
//       break;

//     default:
//       throw new Error("Invalid queryType");
//   }

//   return { query, values };
// }

// module.exports = { executeQuery, buildDynamicQuery };









const db = require("../Config/Pool");

function executeQuery(query, values) {
  return new Promise((resolve, reject) => {
    db.query(query, values, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

function buildConditions(conditions) {
  return Object.keys(conditions)
    .map((key) => `${key} = ?`)
    .join(" AND ");
}

function buildDynamicQuery(queryType, table, data = {}, conditions = {}) {
  let query = "";
  let values = [];

  switch (queryType.toLowerCase()) {
    case "insert":
      query = `INSERT INTO ${table} (${Object.keys(data).join(",")}) VALUES (${Object.keys(data).map(() => "?").join(",")})`;
      values = Object.values(data);
      break;

    case "update":
      query = `UPDATE ${table} SET ${Object.keys(data).map((key) => `${key} = ?`).join(",")} WHERE ${buildConditions(conditions)}`;
      values = [...Object.values(data), ...Object.values(conditions)];
      break;

    case "delete":
      query = `DELETE FROM ${table} WHERE ${buildConditions(conditions)}`;
      values = Object.values(conditions);
      break;

    case "select":
      query = `SELECT * FROM ${table}` + (Object.keys(conditions).length ? ` WHERE ${buildConditions(conditions)}` : "");
      values = Object.values(conditions);
      break;

    case "batch-insert":
      query = `INSERT INTO ${table} (${Object.keys(data[0]).join(",")}) VALUES ${data.map(() => `(${Object.keys(data[0]).map(() => "?").join(",")})`).join(",")}`;
      values = data.flatMap(Object.values);
      break;

    case "batch-update":
      query = `UPDATE ${table} SET ${Object.keys(data[0]).map((key) => `${key} = ?`).join(",")} WHERE ${buildConditions(conditions)}`;
      values = data.flatMap((row) => Object.values(row)).concat(Object.values(conditions));
      break;

    case "batch-delete":
      query = `DELETE FROM ${table} WHERE ${buildConditions(conditions)}`;
      values = Object.values(conditions);
      break;

    case "batch-select":
      query = `SELECT * FROM ${table} WHERE ${buildConditions(conditions)}`;
      values = Object.values(conditions);
      break;

    case "custom-query":
      query = data.query;
      values = data.values || [];
      break;

    default:
      throw new Error("Invalid queryType");
  }

  return { query, values };
}

module.exports = { executeQuery, buildDynamicQuery };
