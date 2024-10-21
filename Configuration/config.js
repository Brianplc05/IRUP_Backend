import 'dotenv/config';

const pool = {
    user: process.env.DB_USER_TEST,
    password: process.env.DB_PASSWORD_TEST,
    database: process.env.DB_DATABASE_TEST,
    server: process.env.DB_HOST_TEST,
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
