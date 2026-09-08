import mysql2 from 'mysql2/promise';
import mysql from 'mysql';
import Redis from 'ioredis';

export const pool = mysql2.createPool({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app', connectionLimit: 2 });

export const legacy = mysql.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });

export const redis = new Redis({ host: '127.0.0.1', port: Number(process.env.REDIS_PORT || 41339), lazyConnect: false });
