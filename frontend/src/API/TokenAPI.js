import ABI from "../ABI/TokenABI.json";
import { ethers } from "ethers";

const getContract = (library) => {
    const signer = library.getSigner().connectUnchecked();
    const contract = new ethers.Contract(process.env.REACT_APP_TOKEN_ADDRESS, ABI, signer);
    return contract;
};

export const approve = async (library) => {
    try {
        const contract = getContract(library);

        const tx = await contract.approve(
            process.env.REACT_APP_CONTRACT_ADDRESS,
            ethers.utils.parseUnits("10000000000000000", 9)
        );
        await tx.wait();
        alert("Апрув успешно произведен");
    } catch (e) {
        console.log(e.message);
        alert("Ошибка при апруве");
    }
};
