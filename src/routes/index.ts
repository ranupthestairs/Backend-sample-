import { Request, Response, Router } from 'express';
import { catchAsync, getBtcPrice, runQuery } from '../utils';
import Rounds from '../../src/models/rounds.model';
import Config from '../../src/models/config.model';
import { FuzioOptionContract, time } from '../../src/constants';

const formatMemoryUsage = (data) =>
    `${Math.round((data / 1024 / 1024) * 100) / 100} MB`;

const routes = Router();

routes.get(
    '/memory-usage',
    catchAsync((_req: Request, res: Response) => {
        const memoryData = process.memoryUsage();

        const memoryUsage = {
            rss: `${formatMemoryUsage(
                memoryData.rss,
            )} -> Resident Set Size - total memory allocated for the process execution`,
            heapTotal: `${formatMemoryUsage(
                memoryData.heapTotal,
            )} -> total size of the allocated heap`,
            heapUsed: `${formatMemoryUsage(
                memoryData.heapUsed,
            )} -> actual memory used during the execution`,
            external: `${formatMemoryUsage(
                memoryData.external,
            )} -> V8 external memory`,
        };
        res.status(200).json(memoryUsage);
    }),
);

routes.get(
    '/game-info',
    catchAsync((_req: Request, res: Response) => {
        Rounds.find()
            .sort({ id: -1 })
            .limit(5)
            .then(async (result) => {
                return res.status(200).send({
                    rounds: result,
                    btcPrice: getBtcPrice(),
                    currentTime: Number(new Date()) - time.getTimeDiff(),
                });
            })
            .catch((e) => res.status(400).send({ msg: e.message }));
    }),
);

// Config Routers
routes.get(
    '/config',
    catchAsync((_req: Request, res: Response) => {
        Config.find()
            .then((config) => res.status(200).send({ config: config[0] }))
            .catch((e) => res.status(400).send({ msg: e.message }));
    }),
);

routes.get(
    '/update-config',
    catchAsync(async (_req: Request, res: Response) => {
        const config = await runQuery(FuzioOptionContract, { config: {} })
            .then((res) => res)
            .catch(() => null);
        if (config) {
            Config.findOneAndUpdate(
                {
                    fast_oracle_addr: config.fast_oracle_addr,
                    token_addr: config.token_addr,
                },
                {
                    ...config,
                    next_round_seconds: Number(config.next_round_seconds),
                    minimum_bet: Number(config.minimum_bet),
                    burn_fee: config.burn_fee? Number(config.burn_fee) : 0,
                    gaming_fee: Number(config.gaming_fee),
                },
                { upsert: true },
            )
                .then(() => res.status(200).send({ success: true }))
                .catch((e) => res.status(400).send({ message: e.message }));
        }
    }),
);

export { routes };
