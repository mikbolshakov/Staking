import { useWeb3React } from "@web3-react/core";
import { useEffect } from "react";
import { injected } from "./API/Connectors";
import "./App.scss";
import "./Components/Buttons/Button.scss";
import Header from "./Components/Header/Header";
import Main from "./Components/Main/Main";
import { getWalletType } from "./Helpers/StorageWallet";

function App() {
    const {activate} = useWeb3React();

    const connectWallet = async () => {
        if(window.ethereum) {
            const walletType = getWalletType();

            if(walletType) {
                try {
                    await activate(injected);
                } catch(e) {
                    console.log(e.message);
                }
            }
        }
    }

    useEffect(() => {
        connectWallet();

        activate()
    }, []);

    return (
        <div className="app_container">
            <Header />
            <Main />
        </div>
    );
}

export default App;
