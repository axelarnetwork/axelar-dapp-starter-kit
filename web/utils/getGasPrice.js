export async function getGasPrice(env, source, destination, tokenAddress) {
    if(env == 'local') return 1;
    if(env != 'testnet') throw Error('env needs to be "local" or "testnet".');
    const api_url ='https://devnet.api.gmp.axelarscan.io';

    const requester = axios.create({ baseURL: api_url });
        const params = {
        method: 'getGasPrice',
        destinationChain: destination.name,
        sourceChain: source.name,
    };

    // set gas token address to params
    if (tokenAddress != AddressZero) {
        params.sourceTokenAddress = tokenAddress;
    }
    else {
        params.sourceTokenSymbol = source.tokenSymbol;
    }
      // send request
    const response = await requester.get('/', { params })
        .catch(error => { return { data: { error } }; });
    const result = response.data.result;
    const dest = result.destination_native_token;
    const destPrice = 1e18*dest.gas_price*dest.token_price.usd;
    return destPrice / result.source_token.token_price.usd;
}