import ABI from "../ABI/ContractABI.json";
import { BigNumber, ethers } from "ethers";

export const getContract = (library) => {
    console.log(library);
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.REACT_APP_SCAN_LINK
    );
    
    const signer = (library || provider).getSigner().connectUnchecked();
    const contract = new ethers.Contract(process.env.REACT_APP_CONTRACT_ADDRESS, ABI, signer);
    return contract;
};

export const sendTokens = async (library, address, count, term) => {
    try {
        const contract = getContract(library);

        console.log(count, BigNumber.from(count).mul(BigNumber.from('1000000000000000000')).toBigInt());

        const tx = await contract.stake(
            address,
            BigNumber.from(count).mul(BigNumber.from('1000000000000000000')).toBigInt(),
            term,
            {
                gasLimit: 2500000
            }
        );
        await tx.wait();

        return { ok: true, message: "Успех" };
    } catch (e) {
        console.log(e.message);
        return { ok: false, message: "Ошибка" };
    }
};

export const getTransactions = async (library) => {
    try {
        const contract = getContract(library);

        const filter = {};

        let events;

        if(+process.env.REACT_APP_BLOCK_SIZE > 0) {
            const block = await contract.provider.getBlockNumber();
            events = await contract.queryFilter(filter, block - process.env.REACT_APP_BLOCK_SIZE, block);
        } else {
            events = await contract.queryFilter(filter);
        }

        const StakedEvents = events.filter(event => event.event === 'Staked');
        const ClaimEvents = events.filter(event => event.event === 'Claimed');

        const filteredStakedEvents = StakedEvents.filter((event) => {

            return !ClaimEvents.some((claimEvent) => {
                const claimID = BigNumber.from(claimEvent.args.id).toBigInt();
                const stackID = BigNumber.from(event.args.id).toBigInt();

                const receiverID = BigNumber.from(claimEvent.args.receiver).toBigInt();
                const ownerID = BigNumber.from(event.args.receiver).toBigInt();

                return claimID === stackID &&
                receiverID === ownerID
            })
        })

        console.log(filteredStakedEvents);

        if (events && events.length > 0) {
            return filteredStakedEvents.map(event => {
                return {
                    id: event.args.id.toString(),
                    address: event.args.receiver,
                    count: ethers.utils.formatUnits(event.args.amount, process.env.REACT_APP_TOKEN_DECIMALS),
                    endDate: new Date(event.args.expiredTime * 1000).toLocaleString(),
                    txHash: event.transactionHash
                }
            });
        }
        return [];
    } catch (e) {
        console.log(e.message);
        return [];
    }
};
