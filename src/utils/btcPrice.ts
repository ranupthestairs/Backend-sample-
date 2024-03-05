import axios from 'axios';

let btcPrice = { price: '0', priceNumber: 0, priceChange: '', state: 0 };

export const updateBtcPrice = async () => {
    const btcPriceResponse = await axios
        .get('https://api.coingecko.com/api/v3/coins/bitcoin')
        .then((res) => res.data)
        .catch((_e) => null);
    if (btcPriceResponse?.market_data) {
        const priceNumber =
            btcPriceResponse.market_data.current_price?.usd || 0;
        const price = priceNumber.toLocaleString('en-US', {
            maximumFractionDigits: 3,
        });
        const priceChangeNumber =
            Math.round(
                (btcPriceResponse.market_data
                    .price_change_percentage_1h_in_currency?.usd || 0) * 1000,
            ) / 1000;
        const priceChange =
            priceChangeNumber === 0
                ? ''
                : priceChangeNumber > 0
                ? `+${priceChangeNumber}%`
                : `${priceChangeNumber}%`;
        const state =
            priceChangeNumber > 0 ? 1 : priceChangeNumber < 0 ? -1 : 0;
        btcPrice = {
            price,
            priceNumber,
            priceChange,
            state,
        };
    }
    return btcPrice;
};

export const getBtcPrice = () => btcPrice;
