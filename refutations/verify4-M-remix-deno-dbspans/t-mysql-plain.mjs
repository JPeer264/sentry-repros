const mysql = (await import('mysql2/promise')).default;
const c = await mysql.createConnection({host:'127.0.0.1',port:3307,user:'root',database:'app'});
const [rows] = await c.query('SELECT id,name FROM users');
console.log('PLAIN OK', rows);
await c.end();
