import TransactionsList from "../TransactionsList/TransactionsList";
import SendTokens from "../SendTokens/SendTokens";
import "./Main.scss";
import { useState } from "react";

const Main = () => {
    const [lastSend, setLastSend] = useState(null);

    return (
        <main className="main_container">
            <SendTokens setLastSend={setLastSend} />
            <TransactionsList lastSend={lastSend} />
        </main>
    );
};

export default Main;
