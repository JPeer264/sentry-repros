// @ts-nocheck
import mysql from "mysql";

export const conn = mysql.createConnection({
  host: "127.0.0.1",
  port: 3307,
  user: "root",
  database: "app",
});
