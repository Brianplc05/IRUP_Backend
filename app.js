import express from 'express';
import IRRoutes from './Routes/IRRoutes.js';
import LogRoutes from './Routes/LogRoutes.js';
import GoogleLogRoutes from './Routes/GoogleLogRoutes.js';
import cors from 'cors';


const app = express();
const PORT = process.env.PORT|| 8888;

app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(cors());


app.use("/forms", IRRoutes);
app.use("/login", LogRoutes);
app.use("/googlelogin", GoogleLogRoutes);

app.listen(PORT, () => {
    console.log(`SERVER STARTED IN PORT: ${PORT}`)
});