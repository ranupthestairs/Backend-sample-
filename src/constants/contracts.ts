import dotenv from 'dotenv';

dotenv.config();

export const OracleContract = process.env.ORACLE_CONTRACT;

export const FuzioContract = process.env.FUZIO_CONTRACT;

export const FuzioOptionContract = process.env.FUZIO_OPTION_CONTRACT;
