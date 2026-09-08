import { connection } from '../db4.server';

export function loader() {
  return new Promise<{ status: string }>((resolve, reject) => {
    connection.query('SELECT id, name FROM users', (err: unknown) => (err ? reject(err) : resolve({ status: 'ok' })));
  });
}

export default function Db4() {
  return <p>db4</p>;
}
