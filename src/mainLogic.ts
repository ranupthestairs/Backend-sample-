import { FetchOptionInterval, FuzioOptionContract, time } from './constants';
import { RetryInterval } from './constants';
import Rounds from './models/rounds.model';
import { makeRound, runQuery } from './utils';

const FETCH_LIMIT = 10;

const isInitialState = (optionStatus) => {
    if (!optionStatus) return false;

    const biddingId = optionStatus.bidding_round?.id;
    const liveId = optionStatus.live_round?.id;

    return !liveId && !biddingId;
};

const fetchUsersPerRound = async (roundId: number) => {
    let result = [];
    const fetchFunc = async (startAfter?: any) => {
        const response = await runQuery(FuzioOptionContract, {
            get_users_per_round: {
                round_id: `${roundId}`,
                start_after: startAfter,
                limit: FETCH_LIMIT,
            },
        })
            .then((res) => res.round_users)
            .catch(() => []);
        result = [...result, ...response];
        if (response.length === FETCH_LIMIT) {
            await fetchFunc(response[FETCH_LIMIT - 1].player);
        }
    };
    await fetchFunc();
    return result;
};

const fetchRoundStatus = async () => {
    const optionStatus = await runQuery(FuzioOptionContract, {
        status: {},
    })
        .then((res) => res)
        .catch(() => null);
    if (!optionStatus) {
        return null;
    }

    const biddingRound = optionStatus.bidding_round;
    const liveRound = optionStatus.live_round;
    const currentTime = optionStatus.current_time;
    const now = Number(new Date());
    time.setTimeDiff(now - currentTime / 1e6);

    if (biddingRound?.id) {
        const usersThisRound = await fetchUsersPerRound(biddingRound.id);
        Rounds.findOneAndUpdate(
            { id: Number(biddingRound.id) },
            {
                ...biddingRound,
                users: usersThisRound,
                id: Number(biddingRound.id),
            },
            {
                upsert: true,
            },
        ).then(() => {});
    }
    if (liveRound?.id) {
        Rounds.findOneAndUpdate(
            { id: Number(liveRound.id) },
            { ...liveRound, id: Number(liveRound.id) },
            {
                upsert: true,
            },
        ).then(() => {});
    }

    return optionStatus;
};

const mainLogic = async () => {
    console.log('----- START MAIN LOGIC -----');
    const optionStatus = await fetchRoundStatus();
    if (!optionStatus) {
        console.log('----- FAILED FETCH STATUS -----');
        setTimeout(mainLogic, RetryInterval);
        return;
    }

    const current_time = optionStatus.current_time;
    const biddingId = optionStatus.bidding_round?.id;
    const liveCloseTime = optionStatus.live_round?.close_time;

    if (!isInitialState(optionStatus)) {
        const remainTime = Number(liveCloseTime) - Number(current_time);

        console.log(`----- BIDDING ROUND ID: ${biddingId} -----`);
        console.log(`----- REMAIN TIME: ${remainTime / 1e9} -----`);

        if (remainTime >= 0) {
            console.log('----- NOT CLOSED CURRENT ROUND -----');
            setTimeout(mainLogic, FetchOptionInterval);
            return;
        }
    }

    console.log('----- CREATING NEW ROUND -----');
    await makeRound(optionStatus)
        .then(async () => {
            console.log('----- CREATED NEW ROUND -----');
            if (optionStatus.bidding_round?.id) {
                const liveRoundStatus = await runQuery(FuzioOptionContract, {
                    finished_round: {
                        round_id: optionStatus.live_round.id,
                    },
                })
                    .then((res) => res)
                    .catch(() => null);
                console.log(
                    `------ STATUS OF ROUND ${optionStatus.live_round.id} -----`,
                    liveRoundStatus,
                );
                if (liveRoundStatus) {
                    Rounds.findOneAndUpdate(
                        { id: Number(liveRoundStatus.id) },
                        {
                            ...liveRoundStatus,
                            id: Number(liveRoundStatus.id),
                        },
                        { upsert: true },
                    )
                        .then(() =>
                            console.log(
                                '----- UPDATED FINISHED ROUND STATUS -----',
                            ),
                        )
                        .catch((e) => console.log('debug error', e.message));
                }
            }
        })
        .catch((e) => {
            console.log(
                '----- FAILED CREATING NEW ROUND -----',
                '\n',
                e.message,
            );
        })
        .finally(() => setTimeout(mainLogic, RetryInterval));
};

export default mainLogic;
