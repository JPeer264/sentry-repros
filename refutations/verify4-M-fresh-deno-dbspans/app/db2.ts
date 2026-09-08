import mysql2 from "mysql2";

const connection = mysql2.createConnection({
  host: "127.0.0.1",
  port: 3307,
  user: "root",
  database: "app",
});

export function queryUsers2(): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    connection.query("SELECT * FROM users", (err: unknown, rows: unknown) => {
      if (err) reject(err);
      else resolve(rows as unknown[]);
    });
  });
}
