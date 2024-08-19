import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();
const app = express();

//middleware

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//routes

//start the server

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});