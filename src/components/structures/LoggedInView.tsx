/*
Copyright 2024 New Vector Ltd.
Copyright 2015-2022 The Matrix.org Foundation C.I.C.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React, { type ClipboardEvent } from "react";
import {
    ClientEvent,
    type MatrixClient,
    type MatrixEvent,
    RoomStateEvent,
    type MatrixError,
    type IUsageLimit,
    type SyncStateData,
    SyncState,
    EventType,
} from "matrix-js-sdk/src/matrix";
import { type MatrixCall } from "matrix-js-sdk/src/webrtc/call";
import classNames from "classnames";

import { isOnlyCtrlOrCmdKeyEvent, Key } from "../../Keyboard";
import PageTypes from "../../PageTypes";
import MediaDeviceHandler from "../../MediaDeviceHandler";
import dis from "../../dispatcher/dispatcher";
import { type IMatrixClientCreds } from "../../MatrixClientPeg";
import SettingsStore from "../../settings/SettingsStore";
import { SettingLevel } from "../../settings/SettingLevel";
import ResizeHandle from "../views/elements/ResizeHandle";
import { CollapseDistributor, Resizer } from "../../resizer";
import type ResizeNotifier from "../../utils/ResizeNotifier";
import PlatformPeg from "../../PlatformPeg";
import { DefaultTagID } from "../../stores/room-list/models";
import { hideToast as hideServerLimitToast, showToast as showServerLimitToast } from "../../toasts/ServerLimitToast";
import { Action } from "../../dispatcher/actions";
import LeftPanel from "./LeftPanel";
import { type ViewRoomDeltaPayload } from "../../dispatcher/payloads/ViewRoomDeltaPayload";
import RoomListStore from "../../stores/room-list/RoomListStore";
import NonUrgentToastContainer from "./NonUrgentToastContainer";
import { type IOOBData, type IThreepidInvite } from "../../stores/ThreepidInviteStore";
import Modal from "../../Modal";
import { type CollapseItem, type ICollapseConfig } from "../../resizer/distributors/collapse";
import { getKeyBindingsManager } from "../../KeyBindingsManager";
import { type IOpts } from "../../createRoom";
import SpacePanel from "../views/spaces/SpacePanel";
import LegacyCallHandler, { LegacyCallHandlerEvent } from "../../LegacyCallHandler";
import AudioFeedArrayForLegacyCall from "../views/voip/AudioFeedArrayForLegacyCall";
import { OwnProfileStore } from "../../stores/OwnProfileStore";
import { UPDATE_EVENT } from "../../stores/AsyncStore";
import { RoomView } from "./RoomView";
import ToastContainer from "./ToastContainer";
import UserView from "./UserView";
import { BackdropPanel } from "./BackdropPanel";
import { mediaFromMxc } from "../../customisations/Media";
import { UserTab } from "../views/dialogs/UserTab";
import { type OpenToTabPayload } from "../../dispatcher/payloads/OpenToTabPayload";
import RightPanelStore from "../../stores/right-panel/RightPanelStore";
import { TimelineRenderingType } from "../../contexts/RoomContext";
import { KeyBindingAction } from "../../accessibility/KeyboardShortcuts";
import { type SwitchSpacePayload } from "../../dispatcher/payloads/SwitchSpacePayload";
import LeftPanelLiveShareWarning from "../views/beacon/LeftPanelLiveShareWarning";
import HomePage from "./HomePage";
import { PipContainer } from "./PipContainer";
import { monitorSyncedPushRules } from "../../utils/pushRules/monitorSyncedPushRules";
import { type ConfigOptions } from "../../SdkConfig";
import { MatrixClientContextProvider } from "./MatrixClientContextProvider";
import { Landmark, LandmarkNavigation } from "../../accessibility/LandmarkNavigation";
import LoginAfter from "./LoginAfter";
import StaticChat from "./StaticChat";
import StaticVideo from "./StaticVideo";
import StaticSidebar from "../views/StaticSidebar";
import StaticSplaceScreen from "./Staticsplacescreen";

// We need to fetch each pinned message individually (if we don't already have it)
// so each pinned message may trigger a request. Limit the number per room for sanity.
// NB. this is just for server notices rather than pinned messages in general.
const MAX_PINNED_NOTICES_PER_ROOM = 2;

// Used to find the closest inputable thing. Because of how our composer works,
// your caret might be within a paragraph/font/div/whatever within the
// contenteditable rather than directly in something inputable.
function getInputableElement(el: HTMLElement): HTMLElement | null {
    return el.closest("input, textarea, select, [contenteditable=true]");
}

interface IProps {
    matrixClient: MatrixClient;
    // Called with the credentials of a registered user (if they were a ROU that
    // transitioned to PWLU)
    onRegistered: (credentials: IMatrixClientCreds) => Promise<MatrixClient>;
    hideToSRUsers: boolean;
    resizeNotifier: ResizeNotifier;
    // eslint-disable-next-line camelcase
    page_type?: string;
    autoJoin?: boolean;
    threepidInvite?: IThreepidInvite;
    roomOobData?: IOOBData;
    currentRoomId: string | null;
    collapseLhs: boolean;
    config: ConfigOptions;
    currentUserId: string | null;
    justRegistered?: boolean;
    roomJustCreatedOpts?: IOpts;
    forceTimeline?: boolean; // see props on MatrixChat
}

interface IState {
    syncErrorData?: SyncStateData;
    usageLimitDismissed: boolean;
    usageLimitEventContent?: IUsageLimit;
    usageLimitEventTs?: number;
    useCompactLayout: boolean;
    activeCalls: Array<MatrixCall>;
    backgroundImage?: string;
}

/**
 * This is what our MatrixChat shows when we are logged in. The precise view is
 * determined by the page_type property.
 *
 * Currently, it's very tightly coupled with MatrixChat. We should try to do
 * something about that.
 *
 * Components mounted below us can access the matrix client via the react context.
 */
class LoggedInView extends React.Component<IProps, IState> {
    public static displayName = "LoggedInView";

    protected readonly _matrixClient: MatrixClient;
    protected readonly _roomView: React.RefObject<RoomView | null>;
    protected readonly _resizeContainer: React.RefObject<HTMLDivElement | null>;
    protected readonly resizeHandler: React.RefObject<HTMLDivElement | null>;
    protected layoutWatcherRef?: string;
    protected compactLayoutWatcherRef?: string;
    protected backgroundImageWatcherRef?: string;
    protected timezoneProfileUpdateRef?: string[];
    protected resizer?: Resizer<ICollapseConfig, CollapseItem>;

    public constructor(props: IProps) {
        super(props);

        this.state = {
            syncErrorData: undefined,
            // use compact timeline view
            useCompactLayout: SettingsStore.getValue("useCompactLayout"),
            usageLimitDismissed: false,
            activeCalls: LegacyCallHandler.instance.getAllActiveCalls(),
        };

        // stash the MatrixClient in case we log out before we are unmounted
        this._matrixClient = this.props.matrixClient;

        MediaDeviceHandler.loadDevices();

        this._roomView = React.createRef();
        this._resizeContainer = React.createRef();
        this.resizeHandler = React.createRef();
    }

    public componentDidMount(): void {
        document.addEventListener("keydown", this.onNativeKeyDown, false);
        LegacyCallHandler.instance.addListener(LegacyCallHandlerEvent.CallState, this.onCallState);

        this.updateServerNoticeEvents();

        this._matrixClient.on(ClientEvent.AccountData, this.onAccountData);
        // check push rules on start up as well
        monitorSyncedPushRules(this._matrixClient.getAccountData(EventType.PushRules), this._matrixClient);
        this._matrixClient.on(ClientEvent.Sync, this.onSync);
        // Call `onSync` with the current state as well
        this.onSync(this._matrixClient.getSyncState(), null, this._matrixClient.getSyncStateData() ?? undefined);
        this._matrixClient.on(RoomStateEvent.Events, this.onRoomStateEvents);

        this.layoutWatcherRef = SettingsStore.watchSetting("layout", null, this.onCompactLayoutChanged);
        this.compactLayoutWatcherRef = SettingsStore.watchSetting(
            "useCompactLayout",
            null,
            this.onCompactLayoutChanged,
        );
        this.backgroundImageWatcherRef = SettingsStore.watchSetting(
            "RoomList.backgroundImage",
            null,
            this.refreshBackgroundImage,
        );

        this.timezoneProfileUpdateRef = [
            SettingsStore.watchSetting("userTimezonePublish", null, this.onTimezoneUpdate),
            SettingsStore.watchSetting("userTimezone", null, this.onTimezoneUpdate),
        ];

        this.resizer = this.createResizer();
        this.resizer.attach();

        OwnProfileStore.instance.on(UPDATE_EVENT, this.refreshBackgroundImage);
        this.loadResizerPreferences();
        this.refreshBackgroundImage();
    }

    private onTimezoneUpdate = async (): Promise<void> => {
        if (!SettingsStore.getValue("userTimezonePublish")) {
            // Ensure it's deleted
            try {
                await this._matrixClient.deleteExtendedProfileProperty("us.cloke.msc4175.tz");
            } catch (ex) {
                console.warn("Failed to delete timezone from user profile", ex);
            }
            return;
        }
        const currentTimezone =
            SettingsStore.getValue("userTimezone") ||
            // If the timezone is empty, then use the browser timezone.
            // eslint-disable-next-line new-cap
            Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (!currentTimezone || typeof currentTimezone !== "string") {
            return;
        }
        try {
            await this._matrixClient.setExtendedProfileProperty("us.cloke.msc4175.tz", currentTimezone);
        } catch (ex) {
            console.warn("Failed to update user profile with current timezone", ex);
        }
    };

    public componentWillUnmount(): void {
        document.removeEventListener("keydown", this.onNativeKeyDown, false);
        LegacyCallHandler.instance.removeListener(LegacyCallHandlerEvent.CallState, this.onCallState);
        this._matrixClient.removeListener(ClientEvent.AccountData, this.onAccountData);
        this._matrixClient.removeListener(ClientEvent.Sync, this.onSync);
        this._matrixClient.removeListener(RoomStateEvent.Events, this.onRoomStateEvents);
        OwnProfileStore.instance.off(UPDATE_EVENT, this.refreshBackgroundImage);
        SettingsStore.unwatchSetting(this.layoutWatcherRef);
        SettingsStore.unwatchSetting(this.compactLayoutWatcherRef);
        SettingsStore.unwatchSetting(this.backgroundImageWatcherRef);
        this.timezoneProfileUpdateRef?.forEach((s) => SettingsStore.unwatchSetting(s));
        this.resizer?.detach();
    }

    private onCallState = (): void => {
        const activeCalls = LegacyCallHandler.instance.getAllActiveCalls();
        if (activeCalls === this.state.activeCalls) return;
        this.setState({ activeCalls });
    };

    private refreshBackgroundImage = async (): Promise<void> => {
        let backgroundImage = SettingsStore.getValue("RoomList.backgroundImage");
        if (backgroundImage) {
            // convert to http before going much further
            backgroundImage = mediaFromMxc(backgroundImage).srcHttp;
        } else {
            backgroundImage = OwnProfileStore.instance.getHttpAvatarUrl();
        }
        this.setState({ backgroundImage: backgroundImage ?? undefined });
    };

    public canResetTimelineInRoom = (roomId: string): boolean => {
        if (!this._roomView.current) {
            return true;
        }
        return this._roomView.current.canResetTimeline();
    };

    private createResizer(): Resizer<ICollapseConfig, CollapseItem> {
        let panelSize: number | null;
        let panelCollapsed: boolean;
        const useNewRoomList = SettingsStore.getValue("feature_new_room_list");
        // TODO decrease this once Spaces launches as it'll no longer need to include the 56px Community Panel
        const toggleSize = useNewRoomList ? 224 : 206 - 50;
        const collapseConfig: ICollapseConfig = {
            toggleSize,
            onCollapsed: (collapsed) => {
                panelCollapsed = collapsed;
                if (collapsed) {
                    dis.dispatch({ action: "hide_left_panel" });
                    window.localStorage.setItem("mx_lhs_size", "0");
                } else {
                    dis.dispatch({ action: "show_left_panel" });
                }
            },
            onResized: (size) => {
                panelSize = size;
                this.props.resizeNotifier.notifyLeftHandleResized();
            },
            onResizeStart: () => {
                this.props.resizeNotifier.startResizing();
            },
            onResizeStop: () => {
                if (!panelCollapsed) window.localStorage.setItem("mx_lhs_size", "" + panelSize);
                this.props.resizeNotifier.stopResizing();
            },
            isItemCollapsed: (domNode) => {
                return domNode.classList.contains("mx_LeftPanel_minimized");
            },
            handler: this.resizeHandler.current ?? undefined,
        };
        const resizer = new Resizer(this._resizeContainer.current, CollapseDistributor, collapseConfig);
        resizer.setClassNames({
            handle: "mx_ResizeHandle",
            vertical: "mx_ResizeHandle--vertical",
            reverse: "mx_ResizeHandle_reverse",
        });
        return resizer;
    }

    private loadResizerPreferences(): void {
        let lhsSize = parseInt(window.localStorage.getItem("mx_lhs_size")!, 10);
        if (isNaN(lhsSize)) {
            lhsSize = 350;
        }
        this.resizer?.forHandleWithId("lp-resizer")?.resize(lhsSize);
    }

    private onAccountData = (event: MatrixEvent): void => {
        if (event.getType() === "m.ignored_user_list") {
            dis.dispatch({ action: "ignore_state_changed" });
        }
        monitorSyncedPushRules(event, this._matrixClient);
    };

    private onCompactLayoutChanged = (): void => {
        this.setState({
            useCompactLayout: SettingsStore.getValue("useCompactLayout"),
        });
    };

    private onSync = (syncState: SyncState | null, oldSyncState: SyncState | null, data?: SyncStateData): void => {
        const oldErrCode = (this.state.syncErrorData?.error as MatrixError)?.errcode;
        const newErrCode = (data?.error as MatrixError)?.errcode;
        if (syncState === oldSyncState && oldErrCode === newErrCode) return;

        this.setState({
            syncErrorData: syncState === SyncState.Error ? data : undefined,
        });

        if (oldSyncState === SyncState.Prepared && syncState === SyncState.Syncing) {
            this.updateServerNoticeEvents();
        } else {
            this.calculateServerLimitToast(this.state.syncErrorData, this.state.usageLimitEventContent);
        }
    };

    private onRoomStateEvents = (ev: MatrixEvent): void => {
        const serverNoticeList = RoomListStore.instance.orderedLists[DefaultTagID.ServerNotice];
        if (serverNoticeList?.some((r) => r.roomId === ev.getRoomId())) {
            this.updateServerNoticeEvents();
        }
    };

    private onUsageLimitDismissed = (): void => {
        this.setState({
            usageLimitDismissed: true,
        });
    };

    private calculateServerLimitToast(syncError: IState["syncErrorData"], usageLimitEventContent?: IUsageLimit): void {
        const error = (syncError?.error as MatrixError)?.errcode === "M_RESOURCE_LIMIT_EXCEEDED";
        if (error) {
            usageLimitEventContent = (syncError?.error as MatrixError).data as IUsageLimit;
        }

        // usageLimitDismissed is true when the user has explicitly hidden the toast
        // and it will be reset to false if a *new* usage alert comes in.
        if (usageLimitEventContent && this.state.usageLimitDismissed) {
            showServerLimitToast(
                usageLimitEventContent.limit_type,
                this.onUsageLimitDismissed,
                usageLimitEventContent.admin_contact,
                error,
            );
        } else {
            hideServerLimitToast();
        }
    }

    private updateServerNoticeEvents = async (): Promise<void> => {
        const serverNoticeList = RoomListStore.instance.orderedLists[DefaultTagID.ServerNotice];
        if (!serverNoticeList) return;

        const events: MatrixEvent[] = [];
        let pinnedEventTs = 0;
        for (const room of serverNoticeList) {
            const pinStateEvent = room.currentState.getStateEvents("m.room.pinned_events", "");

            if (!pinStateEvent || !pinStateEvent.getContent().pinned) continue;
            pinnedEventTs = pinStateEvent.getTs();

            const pinnedEventIds = pinStateEvent.getContent().pinned.slice(0, MAX_PINNED_NOTICES_PER_ROOM);
            for (const eventId of pinnedEventIds) {
                const timeline = await this._matrixClient.getEventTimeline(room.getUnfilteredTimelineSet(), eventId);
                const event = timeline?.getEvents().find((ev) => ev.getId() === eventId);
                if (event) events.push(event);
            }
        }

        if (pinnedEventTs && this.state.usageLimitEventTs && this.state.usageLimitEventTs > pinnedEventTs) {
            // We've processed a newer event than this one, so ignore it.
            return;
        }

        const usageLimitEvent = events.find((e) => {
            return (
                e &&
                e.getType() === "m.room.message" &&
                e.getContent()["server_notice_type"] === "m.server_notice.usage_limit_reached"
            );
        });
        const usageLimitEventContent = usageLimitEvent?.getContent<IUsageLimit>();
        this.calculateServerLimitToast(this.state.syncErrorData, usageLimitEventContent);
        this.setState({
            usageLimitEventContent,
            usageLimitEventTs: pinnedEventTs,
            // This is a fresh toast, we can show toasts again
            usageLimitDismissed: false,
        });
    };

    private onPaste = (ev: ClipboardEvent): void => {
        const element = ev.target as HTMLElement;
        const inputableElement = getInputableElement(element);
        if (inputableElement === document.activeElement) return; // nothing to do

        if (inputableElement?.focus) {
            inputableElement.focus();
        } else {
            const inThread = !!document.activeElement?.closest(".mx_ThreadView");
            // refocusing during a paste event will make the paste end up in the newly focused element,
            // so dispatch synchronously before paste happens
            dis.dispatch(
                {
                    action: Action.FocusSendMessageComposer,
                    context: inThread ? TimelineRenderingType.Thread : TimelineRenderingType.Room,
                },
                true,
            );
        }
    };

    /*
    SOME HACKERY BELOW:
    React optimizes event handlers, by always attaching only 1 handler to the document for a given type.
    It then internally determines the order in which React event handlers should be called,
    emulating the capture and bubbling phases the DOM also has.

    But, as the native handler for React is always attached on the document,
    it will always run last for bubbling (first for capturing) handlers,
    and thus React basically has its own event phases, and will always run
    after (before for capturing) any native other event handlers (as they tend to be attached last).

    So ideally one wouldn't mix React and native event handlers to have bubbling working as expected,
    but we do need a native event handler here on the document,
    to get keydown events when there is no focused element (target=body).

    We also do need bubbling here to give child components a chance to call `stopPropagation()`,
    for keydown events it can handle itself, and shouldn't be redirected to the composer.

    So we listen with React on this component to get any events on focused elements, and get bubbling working as expected.
    We also listen with a native listener on the document to get keydown events when no element is focused.
    Bubbling is irrelevant here as the target is the body element.
    */
    private onReactKeyDown = (ev: React.KeyboardEvent): void => {
        // events caught while bubbling up on the root element
        // of this component, so something must be focused.
        this.onKeyDown(ev);
    };

    private onNativeKeyDown = (ev: KeyboardEvent): void => {
        // only pass this if there is no focused element.
        // if there is, onKeyDown will be called by the
        // react keydown handler that respects the react bubbling order.
        if (ev.target === document.body) {
            this.onKeyDown(ev);
        }
    };

    private onKeyDown = (ev: React.KeyboardEvent | KeyboardEvent): void => {
        let handled = false;

        const roomAction = getKeyBindingsManager().getRoomAction(ev);
        switch (roomAction) {
            case KeyBindingAction.ScrollUp:
            case KeyBindingAction.ScrollDown:
            case KeyBindingAction.JumpToFirstMessage:
            case KeyBindingAction.JumpToLatestMessage:
                // pass the event down to the scroll panel
                this.onScrollKeyPressed(ev);
                handled = true;
                break;
            case KeyBindingAction.SearchInRoom:
                dis.fire(Action.FocusMessageSearch);
                handled = true;
                break;
        }
        if (handled) {
            ev.stopPropagation();
            ev.preventDefault();
            return;
        }

        const navAction = getKeyBindingsManager().getNavigationAction(ev);
        switch (navAction) {
            case KeyBindingAction.NextLandmark:
            case KeyBindingAction.PreviousLandmark:
                LandmarkNavigation.findAndFocusNextLandmark(
                    Landmark.MESSAGE_COMPOSER_OR_HOME,
                    navAction === KeyBindingAction.PreviousLandmark,
                );
                handled = true;
                break;
            case KeyBindingAction.FilterRooms:
                dis.fire(Action.OpenSpotlight);
                handled = true;
                break;
            case KeyBindingAction.ToggleUserMenu:
                dis.fire(Action.ToggleUserMenu);
                handled = true;
                break;
            case KeyBindingAction.ShowKeyboardSettings:
                dis.dispatch<OpenToTabPayload>({
                    action: Action.ViewUserSettings,
                    initialTabId: UserTab.Keyboard,
                });
                handled = true;
                break;
            case KeyBindingAction.GoToHome:
                // even if we cancel because there are modals open, we still
                // handled it: nothing else should happen.
                handled = true;
                if (Modal.hasDialogs()) {
                    return;
                }
                dis.dispatch({
                    action: Action.ViewHomePage,
                });
                break;
            case KeyBindingAction.ToggleSpacePanel:
                dis.fire(Action.ToggleSpacePanel);
                handled = true;
                break;
            case KeyBindingAction.ToggleRoomSidePanel:
                if (this.props.page_type === "room_view") {
                    RightPanelStore.instance.togglePanel(null);
                    handled = true;
                }
                break;
            case KeyBindingAction.SelectPrevRoom:
                dis.dispatch<ViewRoomDeltaPayload>({
                    action: Action.ViewRoomDelta,
                    delta: -1,
                    unread: false,
                });
                handled = true;
                break;
            case KeyBindingAction.SelectNextRoom:
                dis.dispatch<ViewRoomDeltaPayload>({
                    action: Action.ViewRoomDelta,
                    delta: 1,
                    unread: false,
                });
                handled = true;
                break;
            case KeyBindingAction.SelectPrevUnreadRoom:
                dis.dispatch<ViewRoomDeltaPayload>({
                    action: Action.ViewRoomDelta,
                    delta: -1,
                    unread: true,
                });
                break;
            case KeyBindingAction.SelectNextUnreadRoom:
                dis.dispatch<ViewRoomDeltaPayload>({
                    action: Action.ViewRoomDelta,
                    delta: 1,
                    unread: true,
                });
                break;
            case KeyBindingAction.PreviousVisitedRoomOrSpace:
                PlatformPeg.get()?.navigateForwardBack(true);
                handled = true;
                break;
            case KeyBindingAction.NextVisitedRoomOrSpace:
                PlatformPeg.get()?.navigateForwardBack(false);
                handled = true;
                break;
        }

        // Handle labs actions here, as they apply within the same scope
        if (!handled) {
            const labsAction = getKeyBindingsManager().getLabsAction(ev);
            switch (labsAction) {
                case KeyBindingAction.ToggleHiddenEventVisibility: {
                    const hiddenEventVisibility = SettingsStore.getValueAt(
                        SettingLevel.DEVICE,
                        "showHiddenEventsInTimeline",
                        undefined,
                        false,
                    );
                    SettingsStore.setValue(
                        "showHiddenEventsInTimeline",
                        null,
                        SettingLevel.DEVICE,
                        !hiddenEventVisibility,
                    );
                    handled = true;
                    break;
                }
            }
        }

        if (
            !handled &&
            PlatformPeg.get()?.overrideBrowserShortcuts() &&
            ev.code.startsWith("Digit") &&
            ev.code !== "Digit0" && // this is the shortcut for reset zoom, don't override it
            isOnlyCtrlOrCmdKeyEvent(ev)
        ) {
            dis.dispatch<SwitchSpacePayload>({
                action: Action.SwitchSpace,
                num: parseInt(ev.code.slice(5), 10), // Cut off the first 5 characters - "Digit"
            });
            handled = true;
        }

        if (handled) {
            ev.stopPropagation();
            ev.preventDefault();
            return;
        }

        const isModifier = ev.key === Key.ALT || ev.key === Key.CONTROL || ev.key === Key.META || ev.key === Key.SHIFT;
        if (!isModifier && !ev.ctrlKey && !ev.metaKey) {
            // The above condition is crafted to _allow_ characters with Shift
            // already pressed (but not the Shift key down itself).
            const isClickShortcut = ev.target !== document.body && (ev.key === Key.SPACE || ev.key === Key.ENTER);

            // We explicitly allow alt to be held due to it being a common accent modifier.
            // XXX: Forwarding Dead keys in this way does not work as intended but better to at least
            // move focus to the composer so the user can re-type the dead key correctly.
            const isPrintable = ev.key.length === 1 || ev.key === "Dead";

            // If the user is entering a printable character outside of an input field
            // redirect it to the composer for them.
            if (!isClickShortcut && isPrintable && !getInputableElement(ev.target as HTMLElement)) {
                const inThread = !!document.activeElement?.closest(".mx_ThreadView");
                // synchronous dispatch so we focus before key generates input
                dis.dispatch(
                    {
                        action: Action.FocusSendMessageComposer,
                        context: inThread ? TimelineRenderingType.Thread : TimelineRenderingType.Room,
                    },
                    true,
                );
                ev.stopPropagation();
                // we should *not* preventDefault() here as that would prevent typing in the now-focused composer
            }
        }
    };

    /**
     * dispatch a page-up/page-down/etc to the appropriate component
     * @param {Object} ev The key event
     */
    private onScrollKeyPressed = (ev: React.KeyboardEvent | KeyboardEvent): void => {
        this._roomView.current?.handleScrollKey(ev);
    };

    public render(): React.ReactNode {
        let pageElement;

        switch (this.props.page_type) {
            case PageTypes.RoomView:
                pageElement = (
                    <RoomView
                        ref={this._roomView}
                        onRegistered={this.props.onRegistered}
                        threepidInvite={this.props.threepidInvite}
                        oobData={this.props.roomOobData}
                        key={this.props.currentRoomId || "roomview"}
                        resizeNotifier={this.props.resizeNotifier}
                        justCreatedOpts={this.props.roomJustCreatedOpts}
                        forceTimeline={this.props.forceTimeline}
                    />
                );
                break;

            case PageTypes.HomePage:
                pageElement = <HomePage justRegistered={this.props.justRegistered} />;
                break;

            case PageTypes.UserView:
                if (!!this.props.currentUserId) {
                    pageElement = (
                        <UserView userId={this.props.currentUserId} resizeNotifier={this.props.resizeNotifier} />
                    );
                }
                break;

            case PageTypes.LoginAfter:
                pageElement = <LoginAfter />;
                break;

            case PageTypes.StaticSplaceScreen:
                pageElement = <StaticSplaceScreen />;
                break;

            case PageTypes.StaticChat:
                pageElement = <StaticChat />;
                break;

            case PageTypes.StaticVideo:
                pageElement = <StaticVideo />;
                break;
        }

        const wrapperClasses = classNames({
            mx_MatrixChat_wrapper: true,
            mx_MatrixChat_useCompactLayout: this.state.useCompactLayout,
        });
        const bodyClasses = classNames({
            "mx_MatrixChat": true,
            "mx_MatrixChat--with-avatar": this.state.backgroundImage,
        });

        const useNewRoomList = SettingsStore.getValue("feature_new_room_list");

        const leftPanelWrapperClasses = classNames({
            mx_LeftPanel_wrapper: true,
            mx_LeftPanel_newRoomList: useNewRoomList,
        });

        const audioFeedArraysForCalls = this.state.activeCalls.map((call) => {
            return <AudioFeedArrayForLegacyCall call={call} key={call.callId} />;
        });

        const shouldUseMinimizedUI = !useNewRoomList && this.props.collapseLhs;

        const hashPath = window.location.hash.substring(1);
        return (

            // <MatrixClientContextProvider client={this._matrixClient}>
            //     <div
            //         onPaste={this.onPaste}
            //         onKeyDown={this.onReactKeyDown}
            //         className={wrapperClasses}
            //         aria-hidden={this.props.hideToSRUsers}
            //     >
            //         <ToastContainer />
            //         <div className={bodyClasses}>
            //             <div className="mx_LeftPanel_outerWrapper">
            //                 <LeftPanelLiveShareWarning isMinimized={shouldUseMinimizedUI || false} />
            //                 <div className={leftPanelWrapperClasses}>
            //                     {!useNewRoomList && (
            //                         <BackdropPanel blurMultiplier={0.5} backgroundImage={this.state.backgroundImage} />
            //                     )}
            //                     <SpacePanel />
            //                     {!useNewRoomList && <BackdropPanel backgroundImage={this.state.backgroundImage} />}
            //                     <div
            //                         className="mx_LeftPanel_wrapper--user"
            //                         ref={this._resizeContainer}
            //                         data-collapsed={shouldUseMinimizedUI ? true : undefined}
            //                     >
            //                         <LeftPanel
            //                             pageType={this.props.page_type as PageTypes}
            //                             isMinimized={shouldUseMinimizedUI || false}
            //                             resizeNotifier={this.props.resizeNotifier}
            //                         />
            //                     </div>
            //                 </div>
            //             </div>
            //             <ResizeHandle passRef={this.resizeHandler} id="lp-resizer" />
            //             {/* <div className="mx_RoomView_wrapper">{pageElement}</div> */}
            //         </div>
            //     </div>
            //     <PipContainer />
            //     <NonUrgentToastContainer />
            //     {audioFeedArraysForCalls}
            // </MatrixClientContextProvider>
            <>
                {/* {hashPath === '/home/login_after' || hashPath === '/home/static_splace_screen' ? (
                    <MatrixClientContextProvider client={this._matrixClient}>
                        <div
                            onPaste={this.onPaste}
                            onKeyDown={this.onReactKeyDown}
                            className={wrapperClasses}
                            aria-hidden={this.props.hideToSRUsers}
                        >
                            <ToastContainer />
                            <div className={bodyClasses}>
                                <div className="mx_RoomView_wrapper">{pageElement}</div>
                            </div>
                        </div>
                    </MatrixClientContextProvider>
                ) : hashPath === '/home/static_chat' || hashPath === '/home/static_video' ? (
                    <MatrixClientContextProvider client={this._matrixClient}>
                        <div
                            onPaste={this.onPaste}
                            onKeyDown={this.onReactKeyDown}
                            className={wrapperClasses}
                            aria-hidden={this.props.hideToSRUsers}
                        >
                            <ToastContainer />
                            <div className={bodyClasses}>
                                <div className="mx_LeftPanel_outerWrapper">
                                    <StaticSidebar />
                                </div>
                                <div className="mx_RoomView_wrapper">{pageElement}</div>
                            </div>
                        </div>
                    </MatrixClientContextProvider>
                ) : (
                 
                )} */}
                <MatrixClientContextProvider client={this._matrixClient}>
                    <div
                        onPaste={this.onPaste}
                        onKeyDown={this.onReactKeyDown}
                        className={wrapperClasses}
                        aria-hidden={this.props.hideToSRUsers}
                    >
                        <ToastContainer />
                        <div className={bodyClasses}>
                            <div className="mx_LeftPanel_outerWrapper">
                                <LeftPanelLiveShareWarning isMinimized={shouldUseMinimizedUI || false} />
                                <div className={leftPanelWrapperClasses}>
                                    {!useNewRoomList && (
                                        <BackdropPanel blurMultiplier={0.5} backgroundImage={this.state.backgroundImage} />
                                    )}
                                    <SpacePanel />
                                    {!useNewRoomList && <BackdropPanel backgroundImage={this.state.backgroundImage} />}
                                    {/* <div
                                        className="mx_LeftPanel_wrapper--user"
                                        ref={this._resizeContainer}
                                        data-collapsed={shouldUseMinimizedUI ? true : undefined}
                                    >
                                    </div> */}
                                </div>
                            </div>
                            <LeftPanel
                                pageType={this.props.page_type as PageTypes}
                                isMinimized={shouldUseMinimizedUI || false}
                                resizeNotifier={this.props.resizeNotifier}
                            />
                            {/* <ResizeHandle passRef={this.resizeHandler} id="lp-resizer" /> */}
                            <div className="mx_RoomView_wrapper">{pageElement}</div>
                        </div>
                    </div>
                    <PipContainer />
                    <NonUrgentToastContainer />
                    {audioFeedArraysForCalls}
                </MatrixClientContextProvider>
            </>
        );
    }
}

export default LoggedInView;
