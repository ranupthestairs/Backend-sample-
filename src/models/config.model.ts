import { Schema, model } from 'mongoose';

const ConfigSchema = new Schema({
    next_round_seconds: {
        type: Number,
        isRequired: true,
    },
    fast_oracle_addr: {
        type: String,
        isRequired: true,
    },
    minimum_bet: {
        type: Number,
        isRequired: true,
    },
    burn_fee: {
        type: Number,
        isRequired: true,
    },
    gaming_fee: {
        type: Number,
        isRequired: true,
    },
    token_addr: {
        type: String,
        isRequired: true,
    },
});

const Config = model('Config', ConfigSchema);
export default Config;

