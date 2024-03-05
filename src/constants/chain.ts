import dotenv from 'dotenv';

dotenv.config();

export const rpcEndpoint = process.env.RPC_URL;

export const sender = {
    mnemonic: process.env.ADMIN_MNEMONIC,
    address: process.env.AMDIN_ADDRESS,
};

export const prefix = process.env.PREFIX;
