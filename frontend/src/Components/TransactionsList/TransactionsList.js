import "./TransactionsList.scss";
import { shortAddress } from "../../Helpers/Helpers";
import { useCallback, useEffect, useState } from "react";
import { getContract, getTransactions } from "../../API/ContractAPI";
import { useWeb3React } from "@web3-react/core";

const TransactionsList = ({lastSend}) => {
    const { library } = useWeb3React();
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const getTransactionsHandler = useCallback(async () => {
        setIsLoading(true);
        const txs = await getTransactions(library);
        
        setTransactions(txs);
        setIsLoading(false);
    }, [library]);

    useEffect(() => {
        getTransactionsHandler();
    }, [library, lastSend, getTransactionsHandler]);

    useEffect(() => {
        const contract = getContract();

        contract.on("Staked", getTransactionsHandler)
        contract.on("Claimed", getTransactionsHandler)

        return () => {
            contract.off("Claimed", getTransactionsHandler)
            contract.off("Staked", getTransactionsHandler)
        }
    }, [getTransactionsHandler])

    return (
        <div className="transactions_container">
            {isLoading ? (
                <div>Загрузка...</div>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>№</th>
                            <th>Адрес кошелька</th>
                            <th>Кол-во токенов</th>
                            <th>Срок стекинга</th>
                            <th className="button_column">Транзакция</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((tx, index) => {
                            return (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <a
                                            href={process.env.REACT_APP_TRANSACTION_ADRESS_BASE + tx.address}
                                            target={"_blank"}
                                            rel={"noreferrer"}
                                        >
                                            {shortAddress(tx.address)}
                                        </a>
                                    </td>
                                    <td>{tx.count}</td>
                                    <td>{tx.endDate}</td>
                                    <td>
                                        <a
                                            href={process.env.REACT_APP_TRANSACTION_TX_BASE + tx.txHash}
                                            target={"_blank"}
                                            rel={"noreferrer"}
                                            className={"btn"}
                                        >
                                            Ссылка на транзакцию
                                        </a>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default TransactionsList;
