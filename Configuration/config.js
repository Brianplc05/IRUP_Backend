import 'dotenv/config';

const pool = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    server: process.env.DB_HOST,
    connectionTimeout: 60000,
    requestTimeout: 60000,
    pool: {
        max: 100,
        min: 0,
        idleTimeoutMillis: 60000
    },
    options: {
        enableArithAbort: true,
        encrypt: false,
        useUTC: false,
        trustServerCertificate: true
    }

}
    console.log(`TESTING SQL SERVER DATABASE`);

export default { pool };
