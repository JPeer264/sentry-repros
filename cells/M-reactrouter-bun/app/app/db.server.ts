import mysql from "mysql2/promise";

// Module scope on purpose: a driver first loaded inside a request records nothing (finding K11).
export const pool = mysql.createPool({
  host: "127.0.0.1",
  port: 3307,
  user: "root",
  database: "app",
  connectionLimit: 4,
});
