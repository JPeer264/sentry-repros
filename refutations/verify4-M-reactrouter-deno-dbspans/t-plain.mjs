const mysql = await import('mysql2');
const c = mysql.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });
c.query('SELECT id FROM users', (e, r) => { console.log('plain rows', e || r.length); c.end(); });
