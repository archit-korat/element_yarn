import React, { type JSX } from "react";

import SplashPage from "../SplashPage";
import { _t } from "../../../languageHandler";
import SdkConfig from "../../../SdkConfig";

export default class StaticLogin extends React.Component<any>{
    public render(): React.ReactNode {
        return(
            <h1>This is static login </h1>
        )
    }
}