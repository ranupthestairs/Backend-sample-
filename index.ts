import mongoose from 'mongoose';
import dotenv from 'dotenv';

import mainLogic from './src/mainLogic';
import { app } from './src/config/express';

dotenv.config();

const port = process.env.PORT || '5000';
const mongooseURI = process.env.MONGODB_URI;

mongoose
    .connect(mongooseURI)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(port, () => {
            console.log(`Listening to ${port}`);
            mainLogic();
        });
    })
    .catch((err) => console.log('MongoDB error: ', err));

// app.listen(port, () => {
//     console.log(`Listening to ${port}`);
//     mainLogic();
// });
