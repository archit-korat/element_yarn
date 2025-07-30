/*
Copyright 2024 New Vector Ltd.
Copyright 2015-2021 The Matrix.org Foundation C.I.C.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React, { type JSX, type ReactNode } from "react";
import classNames from "classnames";
import { logger } from "matrix-js-sdk/src/logger";
import { type SSOFlow, SSOAction } from "matrix-js-sdk/src/matrix";

import { _t, UserFriendlyError } from "../../../languageHandler";
import Login, { type ClientLoginFlow, type OidcNativeFlow } from "../../../Login";
import { messageForConnectionError, messageForLoginError } from "../../../utils/ErrorUtils";
import AutoDiscoveryUtils from "../../../utils/AutoDiscoveryUtils";
import AuthPage from "../../views/auth/AuthPage";
import PlatformPeg from "../../../PlatformPeg";
import SettingsStore from "../../../settings/SettingsStore";
import { UIFeature } from "../../../settings/UIFeature";
import { type IMatrixClientCreds } from "../../../MatrixClientPeg";
import PasswordLogin from "../../views/auth/PasswordLogin";
import InlineSpinner from "../../views/elements/InlineSpinner";
import Spinner from "../../views/elements/Spinner";
import SSOButtons from "../../views/elements/SSOButtons";
import ServerPicker from "../../views/elements/ServerPicker";
import AuthBody from "../../views/auth/AuthBody";
import AuthHeader from "../../views/auth/AuthHeader";
import AccessibleButton, { type ButtonEvent } from "../../views/elements/AccessibleButton";
import { type ValidatedServerConfig } from "../../../utils/ValidatedServerConfig";
import { filterBoolean } from "../../../utils/arrays";
import { startOidcLogin } from "../../../utils/oidc/authorize";
import bgImage from "../../../../res/img/Backgroundimage.png";
import logo from "../../../../res/img/kampa.png";
import childImg from "../../../../res/img/kumpaloginimg.png";
import sliderImg from "../../../../res/img/sliderImage.png";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";


interface IProps {
    serverConfig: ValidatedServerConfig;
    // If true, the component will consider itself busy.
    busy?: boolean;
    isSyncing?: boolean;
    // Secondary HS which we try to log into if the user is using
    // the default HS but login fails. Useful for migrating to a
    // different homeserver without confusing users.
    fallbackHsUrl?: string;
    defaultDeviceDisplayName?: string;
    fragmentAfterLogin?: string;
    defaultUsername?: string;

    // Called when the user has logged in. Params:
    // - The object returned by the login API
    onLoggedIn(data: IMatrixClientCreds): void;

    // login shouldn't know or care how registration, password recovery, etc is done.
    onRegisterClick(): void;
    onForgotPasswordClick?(): void;
    onServerConfigChange(config: ValidatedServerConfig): void;
}

interface IState {
    busy: boolean;
    busyLoggingIn?: boolean;
    errorText?: ReactNode;
    loginIncorrect: boolean;
    // can we attempt to log in or are there validation errors?
    canTryLogin: boolean;

    flows?: ClientLoginFlow[];

    // used for preserving form values when changing homeserver
    username: string;
    phoneCountry: string;
    phoneNumber: string;

    // We perform liveliness checks later, but for now suppress the errors.
    // We also track the server dead errors independently of the regular errors so
    // that we can render it differently, and override any other error the user may
    // be seeing.
    serverIsAlive: boolean;
    serverErrorIsFatal: boolean;
    serverDeadError?: ReactNode;
}

type OnPasswordLogin = {
    (username: string, phoneCountry: undefined, phoneNumber: undefined, password: string): Promise<void>;
    (username: undefined, phoneCountry: string, phoneNumber: string, password: string): Promise<void>;
};

/*
 * A wire component which glues together login UI components and Login logic
 */
export default class LoginComponent extends React.PureComponent<IProps, IState> {
    private unmounted = false;
    private loginLogic!: Login;

    private readonly stepRendererMap: Record<string, () => ReactNode>;

    public constructor(props: IProps) {
        super(props);

        this.state = {
            busy: false,
            errorText: null,
            loginIncorrect: false,
            canTryLogin: true,

            username: props.defaultUsername ? props.defaultUsername : "",
            phoneCountry: "",
            phoneNumber: "",

            serverIsAlive: true,
            serverErrorIsFatal: false,
            serverDeadError: "",
        };

        // map from login step type to a function which will render a control
        // letting you do that login type
        this.stepRendererMap = {
            "m.login.password": this.renderPasswordStep,

            // CAS and SSO are the same thing, modulo the url we link to
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "m.login.cas": () => this.renderSsoStep("cas"),
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "m.login.sso": () => this.renderSsoStep("sso"),
            "oidcNativeFlow": () => this.renderOidcNativeStep(),
        };
    }

    public componentDidMount(): void {
        this.unmounted = false;
        this.initLoginLogic(this.props.serverConfig);
    }

    public componentWillUnmount(): void {
        this.unmounted = true;
    }

    public componentDidUpdate(prevProps: IProps): void {
        if (
            prevProps.serverConfig.hsUrl !== this.props.serverConfig.hsUrl ||
            prevProps.serverConfig.isUrl !== this.props.serverConfig.isUrl ||
            // delegatedAuthentication is only set by buildValidatedConfigFromDiscovery and won't be modified
            // so shallow comparison is fine
            prevProps.serverConfig.delegatedAuthentication !== this.props.serverConfig.delegatedAuthentication
        ) {
            // Ensure that we end up actually logging in to the right place
            this.initLoginLogic(this.props.serverConfig);
        }
    }

    public isBusy = (): boolean => !!this.state.busy || !!this.props.busy;



    public onPasswordLogin: OnPasswordLogin = async (
        username: string | undefined,
        phoneCountry: string | undefined,
        phoneNumber: string | undefined,
        password: string,
    ): Promise<void> => {
        if (!this.state.serverIsAlive) {
            this.setState({ busy: true });
            // Do a quick liveliness check on the URLs
            let aliveAgain = true;
            try {
                await AutoDiscoveryUtils.validateServerConfigWithStaticUrls(
                    this.props.serverConfig.hsUrl,
                    this.props.serverConfig.isUrl,
                );
                this.setState({ serverIsAlive: true, errorText: "" });
            } catch (e) {
                const componentState = AutoDiscoveryUtils.authComponentStateForError(e);
                this.setState({
                    busy: false,
                    busyLoggingIn: false,
                    ...componentState,
                });
                aliveAgain = !componentState.serverErrorIsFatal;
            }

            // Prevent people from submitting their password when something isn't right.
            if (!aliveAgain) {
                return;
            }
        }

        this.setState({
            busy: true,
            busyLoggingIn: true,
            errorText: null,
            loginIncorrect: false,
        });

        this.loginLogic.loginViaPassword(username, phoneCountry, phoneNumber, password).then(
            (data) => {
                this.setState({ serverIsAlive: true }); // it must be, we logged in.
                this.props.onLoggedIn(data);
            },
            (error) => {
                if (this.unmounted) return;

                let errorText: ReactNode;
                // Some error strings only apply for logging in
                if (error.httpStatus === 400 && username && username.indexOf("@") > 0) {
                    errorText = _t("auth|unsupported_auth_email");
                } else {
                    errorText = messageForLoginError(error, this.props.serverConfig);
                }

                this.setState({
                    busy: false,
                    busyLoggingIn: false,
                    errorText,
                    // 401 would be the sensible status code for 'incorrect password'
                    // but the login API gives a 403 https://matrix.org/jira/browse/SYN-744
                    // mentions this (although the bug is for UI auth which is not this)
                    // We treat both as an incorrect password
                    loginIncorrect: error.httpStatus === 401 || error.httpStatus === 403,
                });
            },
        );
    };

    public onUsernameChanged = (username: string): void => {
        this.setState({ username });
    };

    public onUsernameBlur = async (username: string): Promise<void> => {
        const doWellknownLookup = username[0] === "@";
        this.setState({
            username: username,
            busy: doWellknownLookup,
            errorText: null,
            canTryLogin: true,
        });
        if (doWellknownLookup) {
            const serverName = username.split(":").slice(1).join(":");
            try {
                const result = await AutoDiscoveryUtils.validateServerName(serverName);
                this.props.onServerConfigChange(result);
                // We'd like to rely on new props coming in via `onServerConfigChange`
                // so that we know the servers have definitely updated before clearing
                // the busy state. In the case of a full MXID that resolves to the same
                // HS as Element's default HS though, there may not be any server change.
                // To avoid this trap, we clear busy here. For cases where the server
                // actually has changed, `initLoginLogic` will be called and manages
                // busy state for its own liveness check.
                this.setState({
                    busy: false,
                });
            } catch (e) {
                logger.error("Problem parsing URL or unhandled error doing .well-known discovery:", e);

                let message = _t("auth|failed_homeserver_discovery");
                if (e instanceof UserFriendlyError && e.translatedMessage) {
                    message = e.translatedMessage;
                }

                let errorText: ReactNode = message;
                let discoveryState = {};
                if (AutoDiscoveryUtils.isLivelinessError(e)) {
                    errorText = this.state.errorText;
                    discoveryState = AutoDiscoveryUtils.authComponentStateForError(e);
                }

                this.setState({
                    busy: false,
                    errorText,
                    ...discoveryState,
                });
            }
        }
    };

    public onPhoneCountryChanged = (phoneCountry: string): void => {
        this.setState({ phoneCountry });
    };

    public onPhoneNumberChanged = (phoneNumber: string): void => {
        this.setState({ phoneNumber });
    };

    public onRegisterClick = (ev: ButtonEvent): void => {
        ev.preventDefault();
        ev.stopPropagation();
        this.props.onRegisterClick();
    };

    public onTryRegisterClick = (ev: ButtonEvent): void => {
        const hasPasswordFlow = this.state.flows?.find((flow) => flow.type === "m.login.password");
        const ssoFlow = this.state.flows?.find((flow) => flow.type === "m.login.sso" || flow.type === "m.login.cas");
        // If has no password flow but an SSO flow guess that the user wants to register with SSO.
        // TODO: instead hide the Register button if registration is disabled by checking with the server,
        // has no specific errCode currently and uses M_FORBIDDEN.
        if (ssoFlow && !hasPasswordFlow) {
            ev.preventDefault();
            ev.stopPropagation();
            const ssoKind = ssoFlow.type === "m.login.sso" ? "sso" : "cas";
            PlatformPeg.get()?.startSingleSignOn(
                this.loginLogic.createTemporaryClient(),
                ssoKind,
                this.props.fragmentAfterLogin,
                undefined,
                SSOAction.REGISTER,
            );
        } else {
            // Don't intercept - just go through to the register page
            this.onRegisterClick(ev);
        }
    };

    public slides = [
        {
            title: "Lorem ipsum dolor sit amet consectetur. Nunc.",
            img: childImg,
            desc: "Lorem ipsum dolor sit amet consectetur. Turpis tellus in purus aliquet lobortis ipsum. Nulla sed mauris posuere lobortis vestibulum tincidunt orci est. Tortor cras vestibulum vel cras turpis proin.",
        },
        {
            title: "Second slide headline.",
            img: sliderImg,
            desc: "Second slide description goes here. You can add more slides as needed.",
        },
        {
            title: "Third slide headline.",
            img: childImg,
            desc: "Third slide description goes here. You can add more slides as needed.",
        },
        {
            title: "Fourth slide headline.",
            img: sliderImg,
            desc: "Fourth slide description goes here. You can add more slides as needed.",
        },
    ];

    private async checkServerLiveliness({
        hsUrl,
        isUrl,
    }: Pick<ValidatedServerConfig, "hsUrl" | "isUrl">): Promise<void> {
        // Do a quick liveliness check on the URLs
        try {
            const { warning } = await AutoDiscoveryUtils.validateServerConfigWithStaticUrls(hsUrl, isUrl);
            if (warning) {
                this.setState({
                    ...AutoDiscoveryUtils.authComponentStateForError(warning),
                    errorText: "",
                });
            } else {
                this.setState({
                    serverIsAlive: true,
                    errorText: "",
                });
            }
        } catch (e) {
            this.setState({
                busy: false,
                ...AutoDiscoveryUtils.authComponentStateForError(e as Error),
            });
        }
    }

    private async initLoginLogic({ hsUrl, isUrl }: ValidatedServerConfig): Promise<void> {
        let isDefaultServer = false;
        if (
            this.props.serverConfig.isDefault &&
            hsUrl === this.props.serverConfig.hsUrl &&
            isUrl === this.props.serverConfig.isUrl
        ) {
            isDefaultServer = true;
        }

        const fallbackHsUrl = isDefaultServer ? this.props.fallbackHsUrl! : null;

        this.setState({
            busy: true,
            loginIncorrect: false,
        });

        await this.checkServerLiveliness({ hsUrl, isUrl });

        const loginLogic = new Login(hsUrl, isUrl, fallbackHsUrl, {
            defaultDeviceDisplayName: this.props.defaultDeviceDisplayName,
            delegatedAuthentication: this.props.serverConfig.delegatedAuthentication,
        });
        this.loginLogic = loginLogic;

        loginLogic
            .getFlows()
            .then(
                (flows) => {
                    // look for a flow where we understand all of the steps.
                    const supportedFlows = flows.filter(this.isSupportedFlow);

                    this.setState({
                        flows: supportedFlows,
                    });

                    if (supportedFlows.length === 0) {
                        this.setState({
                            errorText: _t("auth|unsupported_auth"),
                        });
                    }
                },
                (err) => {
                    this.setState({
                        errorText: messageForConnectionError(err, this.props.serverConfig),
                        loginIncorrect: false,
                        canTryLogin: false,
                    });
                },
            )
            .finally(() => {
                this.setState({
                    busy: false,
                });
            });
    }

    private isSupportedFlow = (flow: ClientLoginFlow): boolean => {
        // technically the flow can have multiple steps, but no one does this
        // for login and loginLogic doesn't support it so we can ignore it.
        if (!this.stepRendererMap[flow.type]) {
            logger.log("Skipping flow", flow, "due to unsupported login type", flow.type);
            return false;
        }
        return true;
    };

    public renderLoginComponentForFlows(): ReactNode {
        if (!this.state.flows) return null;

        // this is the ideal order we want to show the flows in
        const order = ["oidcNativeFlow", "m.login.password", "m.login.sso"];

        const flows = filterBoolean(order.map((type) => this.state.flows?.find((flow) => flow.type === type)));
        return (
            <React.Fragment>
                {flows.map((flow) => {
                    const stepRenderer = this.stepRendererMap[flow.type];
                    return <React.Fragment key={flow.type}>{stepRenderer()}</React.Fragment>;
                })}
            </React.Fragment>
        );
    }

    private renderPasswordStep = (): JSX.Element => {
        return (
            <PasswordLogin
                onSubmit={this.onPasswordLogin}
                username={this.state.username}
                phoneCountry={this.state.phoneCountry}
                phoneNumber={this.state.phoneNumber}
                onUsernameChanged={this.onUsernameChanged}
                onUsernameBlur={this.onUsernameBlur}
                onPhoneCountryChanged={this.onPhoneCountryChanged}
                onPhoneNumberChanged={this.onPhoneNumberChanged}
                onForgotPasswordClick={this.props.onForgotPasswordClick}
                loginIncorrect={this.state.loginIncorrect}
                serverConfig={this.props.serverConfig}
                disableSubmit={this.isBusy()}
                busy={this.props.isSyncing || this.state.busyLoggingIn}
            />
        );
    };

    private renderOidcNativeStep = (): React.ReactNode => {
        const flow = this.state.flows!.find((flow) => flow.type === "oidcNativeFlow")! as OidcNativeFlow;
        return (
            <AccessibleButton
                className="mx_Login_fullWidthButton"
                kind="primary"
                onClick={async () => {
                    await startOidcLogin(
                        this.props.serverConfig.delegatedAuthentication!,
                        flow.clientId,
                        this.props.serverConfig.hsUrl,
                        this.props.serverConfig.isUrl,
                    );
                }}
            >
                {_t("action|continue")}
            </AccessibleButton>
        );
    };

    private renderSsoStep = (loginType: "cas" | "sso"): JSX.Element => {
        const flow = this.state.flows?.find((flow) => flow.type === "m.login." + loginType) as SSOFlow;

        return (
            <SSOButtons
                matrixClient={this.loginLogic.createTemporaryClient()}
                flow={flow}
                loginType={loginType}
                fragmentAfterLogin={this.props.fragmentAfterLogin}
                primary={!this.state.flows?.find((flow) => flow.type === "m.login.password")}
                action={SSOAction.LOGIN}
                disabled={this.isBusy()}
            />
        );
    };

    public render(): React.ReactNode {
        const loader =
            this.isBusy() && !this.state.busyLoggingIn ? (
                <div className="mx_Login_loader">
                    <Spinner />
                </div>
            ) : null;

        const errorText = this.state.errorText;

        let errorTextSection;
        if (errorText) {
            errorTextSection = <div className="mx_Login_error">{errorText}</div>;
        }

        let serverDeadSection;
        if (!this.state.serverIsAlive) {
            const classes = classNames({
                mx_Login_error: true,
                mx_Login_serverError: true,
                mx_Login_serverErrorNonFatal: !this.state.serverErrorIsFatal,
            });
            serverDeadSection = <div className={classes}>{this.state.serverDeadError}</div>;
        }

        let footer;
        if (this.props.isSyncing || this.state.busyLoggingIn) {
            footer = (
                <div className="mx_AuthBody_paddedFooter">
                    <div className="mx_AuthBody_paddedFooter_title">
                        <InlineSpinner w={20} h={20} />
                        {this.props.isSyncing ? _t("auth|syncing") : _t("auth|signing_in")}
                    </div>
                    {this.props.isSyncing && (
                        <div className="mx_AuthBody_paddedFooter_subtitle">{_t("auth|sync_footer_subtitle")}</div>
                    )}
                </div>
            );
        } else if (SettingsStore.getValue(UIFeature.Registration)) {
            footer = (
                <span className="mx_AuthBody_changeFlow">
                    {_t(
                        "auth|create_account_prompt",
                        {},
                        {
                            a: (sub) => (
                                <AccessibleButton kind="link_inline" onClick={this.onTryRegisterClick}>
                                    {sub} 1
                                </AccessibleButton>
                            ),
                        },
                    )}
                </span>
            );
        }

        return (
            <AuthPage>
                {/* <AuthHeader disableLanguageSelector={this.props.isSyncing || this.state.busyLoggingIn} />
                <AuthBody>
                    <h1>
                        {_t("action|sign_in")}
                        {loader}
                    </h1>
                    {errorTextSection}
                    {serverDeadSection}
                    <ServerPicker
                        serverConfig={this.props.serverConfig}
                        onServerConfigChange={this.props.onServerConfigChange}
                        disabled={this.isBusy()}
                    />
                    {this.renderLoginComponentForFlows()}
                    {footer}
                </AuthBody> */}
                <div
                    className="min-h-screen flex items-center justify-center bg-cover bg-center"
                    style={{ backgroundImage: `url(${bgImage})` }}
                >
                    <div className="bg-white mx-auto w-[90%] max-w-4xl max-h-[80vh] flex flex-col md:flex-row rounded-xl overflow-hidden shadow-xl relative z-10">
                        <div className="w-full md:w-2/5 flex flex-col items-center justify-center p-6 sm:p-8 bg-white gap-4">
                            <img src={logo} alt="Kumpa Logo" className="w-24 sm:w-28 mb-2" />
                            <div className="text-center text-gray-900 text-sm sm:text-base font-semibold leading-snug">
                                Bienvenue dans votre plateforme d'échanges sécurisés
                            </div>
                            <button
                                onClick={this.onTryRegisterClick}
                                className="w-full max-w-xs cursor-pointer bg-[#2A7856] hover:bg-[#256346] text-white text-base font-semibold py-2 px-6 rounded transition-colors duration-300"
                            >
                                Se connecter
                            </button>
                        </div>
                        <div className="hidden md:flex w-full md:w-3/5 relative items-center justify-center min-h-[350px]">
                            <Swiper
                                modules={[Pagination, Autoplay]}
                                pagination={{
                                    clickable: true,
                                    bulletClass: "swiper-pagination-bullet",
                                    bulletActiveClass: "swiper-pagination-bullet-active",
                                }}
                                effect="fade"
                                autoplay={{
                                    delay: 3000,
                                    disableOnInteraction: false,
                                }}
                                className="w-full h-full flex flex-col items-center justify-center"
                            >
                                {this.slides.map((slide, idx) => (
                                    <SwiperSlide key={idx}>
                                        <div className="relative w-full h-full flex flex-col items-center justify-center gap-2">
                                            <img src={slide.img} className="w-full h-full object-cover" alt="slide img" />
                                            <div className="absolute top-0 left-0 w-full h-full bg-black/50" />
                                            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[90%] max-h-[90px] flex flex-col gap-1 text-white text-center">
                                                <p className="font-semibold text-sm md:text-base truncate">{slide.title}</p>
                                                <p className="text-xs md:text-sm">{slide.desc}</p>
                                            </div>
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>

                            <style>{`
                                .swiper-pagination {
                                    display: flex;
                                    justify-content: center;
                                    align-items: center;
                                    bottom: 16px !important;
                                }
                                .swiper-pagination-bullet {
                                    background: #FDEF42;
                                    width: 10px;
                                    height: 10px;
                                    opacity: 1 !important;
                                    margin: 0 4px !important;
                                }
                                .swiper-pagination-bullet-active {
                                    width: 15px;
                                    height: 15px;
                                    background-color: #39785A;
                                    border: 3px solid #FDEF42;
                                }
                            `}</style>
                        </div>
                    </div>
                </div>
            </AuthPage>
        );
    }
}
