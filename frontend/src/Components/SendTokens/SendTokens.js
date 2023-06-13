import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import { useState } from "react";
import { sendTokens } from "../../API/ContractAPI";
import { approve } from "../../API/TokenAPI";
import "./SendTokens.scss";

const terms = [90, 180, 360, 720];

const SendTokens = ({setLastSend}) => {
    const { library } = useWeb3React();

    const [address, setAddress] = useState("");
    const [tokensCount, setTokensCount] = useState("");
    const [term, setTerm] = useState(terms[0]);

    const changeAddressHandler = (address) => {
        if (ethers.utils.isAddress(address) || address === "") {
            setAddress(address);
        }
    };

    const changeTokensCountHandler = (num) => {
        const numberValue = num;
        const number = +numberValue;
        if (numberValue === "" || !isNaN(number)) {
            if (number < 0) {
                setTokensCount(0);
            } else {
                setTokensCount(number);
            }
        }
    };

    const changeTermHandler = (term) => {
        setTerm(+term);
    };

    const sendHandler = async () => {
        // Checking for address
        if (!address || address === "" || !ethers.utils.isAddress(address)) {
            alert("Wrong address");
        }

        if (library) {
            const result = await sendTokens(library, address, tokensCount, term);
            alert(result.message);
            setLastSend(Date.now());
        }
    };

    const approveTokens = async () => {
        if(library) {
            await approve(library);
        }
    }

    return (
        <div className="send_tokens_container">
            <h3>ОТПРАВИТЬ ТОКЕНЫ</h3>
            <div className="inputs_container">
                <input
                    type={"text"}
                    placeholder={"Адрес кошелька"}
                    value={address}
                    onChange={(e) => changeAddressHandler(e.target.value)}
                ></input>
                <input
                    type={"number"}
                    placeholder={"Введите количество токенов"}
                    value={tokensCount}
                    onChange={(e) => changeTokensCountHandler(e.target.value)}
                ></input>
                <select onChange={(e) => changeTermHandler(e.target.value)}>
                    {terms.map((term) => {
                        return (
                            <option value={term} key={term}>
                                {term} дней
                            </option>
                        );
                    })}
                </select>
            </div>
            <div className="buttons_container">
                <button className="btn transparent" onClick={approveTokens}>
                    Апрув на 10000000000000000 токенов
                </button>
                <button className="btn" onClick={sendHandler}>
                    Отправить
                </button>
            </div>
        </div>
    );
};

export default SendTokens;
