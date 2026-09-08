// `mysql@2` ships no types; this is the minimal surface main.ts uses, so `deno check`
// and `deno compile`'s type-check pass.
declare const mysql: {
  createConnection(config: Record<string, unknown>): {
    connect(callback?: (err: unknown) => void): void;
    query(sql: string, callback: (err: unknown, rows: unknown) => void): void;
    end(callback?: (err: unknown) => void): void;
  };
};

export default mysql;
