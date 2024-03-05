import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { routes } from '../routes';
import bodyParser from 'body-parser';

const app = express();
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());
app.use(morgan('tiny'));
// app.use((_req, _res, next) => {
//     next();
// });
app.use('/', routes);
app.disable('x-powered-by');

export { app };
