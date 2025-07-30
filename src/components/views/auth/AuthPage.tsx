/*
Copyright 2019-2024 New Vector Ltd.
Copyright 2019 The Matrix.org Foundation C.I.C.
Copyright 2015, 2016 OpenMarket Ltd

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React from "react";

import SdkConfig from "../../../SdkConfig";
import AuthFooter from "./AuthFooter";

export default class AuthPage extends React.PureComponent<React.PropsWithChildren> {
    public render(): React.ReactNode {
        return this.props.children;
    }
}
