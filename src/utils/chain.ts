import { DirectSecp256k1HdWallet, coins } from '@cosmjs/proto-signing';
import {
    MsgExecuteContractEncodeObject,
    SigningCosmWasmClient,
} from '@cosmjs/cosmwasm-stargate';
import { Coin } from '@cosmjs/launchpad';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import { StdFee, calculateFee } from '@cosmjs/stargate';
import { getSigningCosmWasmClient } from '@sei-js/core';
import { toUtf8 } from '@cosmjs/encoding';

import {
    FuzioOptionContract,
    OracleContract,
    prefix,
    rpcEndpoint,
    sender,
} from '../constants';
import { toMicroAmount } from './basic';
import { updateBtcPrice } from './btcPrice';

type CreateExecuteMessageArgs = {
    senderAddress: string;
    message: any;
    contractAddress: string;
    funds?: Array<Coin>;
};

const getClient = async () => {
    const senderWallet = await DirectSecp256k1HdWallet.fromMnemonic(
        sender.mnemonic,
        { prefix },
    );
    const senderClient = await SigningCosmWasmClient.connectWithSigner(
        rpcEndpoint,
        senderWallet,
    );
    return senderClient;
};

export const runQuery = async (
    contractAddress: string,
    message: Record<string, any>,
) => {
    try {
        const senderClient = await getClient();
        const result = await senderClient.queryContractSmart(
            contractAddress,
            message,
        );
        return result;
    } catch (e) {
        console.log('query error', contractAddress, message, e.message);
        return null;
    }
};

export const runExecute = async (
    contractAddress: string,
    message: Record<string, any>,
    option?: {
        memo?: string;
        funds?: string;
        denom?: string;
    },
) => {
    const executeMemo = option?.memo || '';
    const executeFunds = option?.funds || '';
    const executeDenom = option?.denom || `u${prefix}`;

    const fee: StdFee = {
        amount: [
            {
                denom: executeDenom,
                amount: '1',
            },
        ],
        gas: '86364',
    };

    const senderWallet = await DirectSecp256k1HdWallet.fromMnemonic(
        sender.mnemonic,
        { prefix },
    );

    const senderClient = await getSigningCosmWasmClient(
        rpcEndpoint,
        senderWallet,
    );

    return senderClient.execute(
        sender.address,
        contractAddress,
        message,
        fee,
        executeMemo,
        executeFunds
            ? coins(toMicroAmount(executeFunds, executeDenom), executeDenom)
            : undefined,
    );
};

export const makeRound = async (optionStatus: any) => {
    if (!optionStatus) return null;
    const { current_time, bidding_round } = optionStatus;
    if (bidding_round && Number(current_time) < Number(bidding_round.open_time))
        throw new Error('current bidding is not ended');

    let transactions: MsgExecuteContractEncodeObject[] = [];

    const btcPrice = await updateBtcPrice();
    const updatePriceMessage = {
        update: {
            price: `${btcPrice.priceNumber}`,
        },
    };
    const updatePriceTransaction = createExecuteMessage({
        senderAddress: sender.address,
        contractAddress: OracleContract,
        message: updatePriceMessage,
    });
    transactions.push(updatePriceTransaction);

    const closeRoundMessage = {
        close_round: {},
    };
    const closeRoundTransaction = createExecuteMessage({
        senderAddress: sender.address,
        contractAddress: FuzioOptionContract,
        message: closeRoundMessage,
    });
    transactions.push(closeRoundTransaction);

    const senderWallet = await DirectSecp256k1HdWallet.fromMnemonic(
        sender.mnemonic,
        { prefix },
    )
        .then((res) => res)
        .catch((e) => {
            throw new Error(`getting sender wallet error: ${e.message}`);
        });

    // const senderClient = await getSigningCosmWasmClient(
    //     rpcEndpoint,
    //     senderWallet,
    // )
    //     .then((res) => res)
    //     .catch((e) => {
    //         throw new Error(`getting sender client error: ${e.message}`);
    //     });

    const senderClient = await SigningCosmWasmClient.connectWithSigner(
        rpcEndpoint,
        senderWallet,
    )
        .then((res) => res)
        .catch((e) => {
            throw new Error(`getting sender client error: ${e.message}`);
        });

    const fee = calculateFee(500000, `0.1u${prefix}`);

    const txHash = await senderClient
        .signAndBroadcast(sender.address, transactions, fee)
        .then((res) => {
            if (res.code === 0) return res;
            throw new Error(`unexpected error: ${JSON.stringify(res)}`);
        })
        .catch((e) => {
            throw new Error(`transaction error: ${e.message}`);
        });

    return txHash;
};

export const createExecuteMessage = ({
    senderAddress,
    contractAddress,
    message,
    funds,
}: CreateExecuteMessageArgs): MsgExecuteContractEncodeObject => ({
    typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
    value: MsgExecuteContract.fromPartial({
        sender: senderAddress,
        contract: contractAddress,
        msg: toUtf8(JSON.stringify(message)),
        funds: funds || [],
    }),
});
