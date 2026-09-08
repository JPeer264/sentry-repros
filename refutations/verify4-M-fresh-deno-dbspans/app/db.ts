import mysql from "mysql";

const connection = mysql.createConnection({
  host: "127.0.0.1",
  port: 3307,
  user: "root",
  database: "app",
});

connection.connect();

export function queryUsers(): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    connection.query("SELECT * FROM users", (err: unknown, rows: unknown[]) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}
