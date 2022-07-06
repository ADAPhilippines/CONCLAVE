import { Pool, QueryResult } from 'pg';

const pool = new Pool();

export const queryAsync = async (text: string, params: any): Promise<QueryResult<any>> => {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('executed query', { text, duration, rows: res.rowCount });
    return res;
};
