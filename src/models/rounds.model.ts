import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const RoundsSchema = new Schema(
    {
        id: {
            type: Number,
            required: true,
        },
        bid_time: {
            type: String,
            required: true,
        },
        open_time: {
            type: String,
            required: true,
        },
        close_time: {
            type: String,
            required: true,
        },
        bull_amount: {
            type: String,
            required: true,
        },
        bear_amount: {
            type: String,
            required: true,
        },
        open_price: String,
        close_price: String,
        winner: String,
        users: [
            {
                player: String,
                round_id: String,
                amount: String,
                direction: String,
            },
        ],
    },
    { timestamps: true },
);

const Rounds = mongoose.model('Rounds', RoundsSchema);
export default Rounds;
