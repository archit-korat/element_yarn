import React, { useLayoutEffect, useRef, useState } from "react";
import { RovingTabIndexProvider } from "../../accessibility/RovingTabIndex";
import { DragDropContext } from "react-beautiful-dnd";
import SpaceStore from "../../stores/spaces/SpaceStore";
import classNames from "classnames";
import { getKeyBindingsManager } from "../../KeyBindingsManager";
import { KeyBindingAction } from "../../accessibility/KeyboardShortcuts";
import { Landmark, LandmarkNavigation } from "../../accessibility/LandmarkNavigation";
import { _t } from "../../languageHandler";
import { useSettingValue } from "../../hooks/useSettings";
import UIStore from "../../stores/UIStore";
import { useDispatcher } from "../../hooks/useDispatcher";
import defaultDispatcher from "../../dispatcher/dispatcher";
import { ActionPayload } from "../../dispatcher/payloads";
import { Action } from "../../dispatcher/actions";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { PiCalendarCheckLight, PiVideoCameraLight } from "react-icons/pi";
import AccessibleButton from "./elements/AccessibleButton";
import { KeyboardShortcut } from "./settings/KeyboardShortcut";
import UserMenu from "../structures/UserMenu";

const StaticSidebar: React.FC = () => {

    const [dragging, setDragging] = useState(false);
    const [isPanelCollapsed, setPanelCollapsed] = useState(true);
    const ref = useRef<HTMLDivElement>(null);

    const newRoomListEnabled = useSettingValue("feature_new_room_list");

    useLayoutEffect(() => {
        if (ref.current) UIStore.instance.trackElementDimensions("StaticSidebar", ref.current);
        return () => UIStore.instance.stopTrackingElementDimensions("StaticSidebar");
    }, []);

    useDispatcher(defaultDispatcher, (payload: ActionPayload) => {
        if (payload.action === Action.ToggleStaticBar) {
            setPanelCollapsed(!isPanelCollapsed);
        }
    });

    return (
        // <RovingTabIndexProvider handleHomeEnd handleUpDown={!dragging}>
        //     {({ onKeyDownHandler, onDragEndHandler }) => (
        //         <DragDropContext
        //             onDragStart={() => {
        //                 setDragging(true);
        //             }}
        //             onDragEnd={(result) => {
        //                 setDragging(false);
        //                 if (!result.destination) return; // dropped outside the list
        //                 SpaceStore.instance.moveRootSpace(result.source.index, result.destination.index);
        //                 onDragEndHandler();
        //             }}
        //         >
        //             <nav
        //                 className={classNames("mx_SpacePanel", {
        //                     collapsed: isPanelCollapsed,
        //                     newUi: newRoomListEnabled,
        //                 })}
        //                 onKeyDown={(ev) => {
        //                     const navAction = getKeyBindingsManager().getNavigationAction(ev);
        //                     if (
        //                         navAction === KeyBindingAction.NextLandmark ||
        //                         navAction === KeyBindingAction.PreviousLandmark
        //                     ) {
        //                         LandmarkNavigation.findAndFocusNextLandmark(
        //                             Landmark.ACTIVE_SPACE_BUTTON,
        //                             navAction === KeyBindingAction.PreviousLandmark,
        //                         );
        //                         ev.stopPropagation();
        //                         ev.preventDefault();
        //                         return;
        //                     }
        //                     onKeyDownHandler(ev);
        //                 }}
        //                 ref={ref}
        //                 aria-label={_t("common|spaces")}
        //             >
        //                 <img src={require("../../../res/img/kumpaLOgo.png")} className="w-[90%] mx-auto" alt="Kumpa Logo" />
        //                 <UserMenu isPanelCollapsed={isPanelCollapsed}>
        //                     <AccessibleButton
        //                         className={classNames("mx_SpacePanel_toggleCollapse", { expanded: !isPanelCollapsed })}
        //                         onClick={() => setPanelCollapsed(!isPanelCollapsed)}
        //                         title={isPanelCollapsed ? _t("action|expand") : _t("action|collapse")}
        //                         caption={
        //                             <KeyboardShortcut
        //                                 value={{ ctrlOrCmdKey: true, shiftKey: true, key: "d" }}
        //                                 className="mx_SpacePanel_Tooltip_KeyboardShortcut"
        //                             />
        //                         }
        //                     />
        //                 </UserMenu>
        //             </nav>
        //         </DragDropContext>
        //     )}
        // </RovingTabIndexProvider>
        // <aside className="font-['Inter',sans-serif] w-28 min-h-screen p-2 gap-8 overflow-y-auto flex flex-col justify-between items-center border-r border-r-gray-200" style={{ scrollbarWidth: 'thin' }}>
        //     <img src={require("../../../res/img/kumpaLOgo.png")} className="w-[70%] h-auto object-cover mx-auto" alt="Kumpa Logo" />
        //     <nav className="flex flex-col justify-start items-center gap-5 h-full">
        //         <div className="w-full flex flex-col justify-center items-center gap-1">
        //             <ChatIcon width={32} height={32} />
        //             <span className="text-sm font-semibold text-[#39785A]">Chat</span>
        //         </div>
        //         <div className="w-full flex flex-col justify-center items-center gap-1">
        //             <VideoCameraIcon width={32} height={32} />
        //             <span className="text-sm">Reunion</span>
        //         </div>
        //         <div className="w-full flex flex-col justify-center items-center gap-1">
        //             <CalendarCheckIcon width={32} height={32} />
        //             <span className="text-sm">Calender</span>
        //         </div>
        //     </nav>
        //     <img src={require("../../../res/img/dummyUserPic.png")} className="w-12 h-12 rounded-full" alt="User Image" />
        // </aside>
        <aside className="font-['Inter',sans-serif] w-20 md:w-28 min-h-screen p-2 md:p-3 gap-8 overflow-y-auto flex flex-col justify-between items-center bg-white scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <img src={require("../../../res/img/kumpaLOgo.png")} className="w-[90%] md:w-[70%] h-auto object-cover mx-auto" alt="Kumpa Logo" />
            <nav className="flex flex-col justify-start items-center gap-6 flex-1 mt-4">
                <div className="w-full flex flex-col gap-0.5 justify-center items-center cursor-pointer text-[#39785A] hover:text-[#39785A]">
                    {/* <ChatIcon width={28} height={28} /> */}
                    <IoChatbubbleEllipsesOutline fontSize={28} />
                    <span className="text-xs md:text-sm font-semibold">Chat</span>
                </div>
                <div className="w-full flex flex-col gap-0.5 justify-center items-center cursor-pointer hover:text-[#39785A]">
                    <PiVideoCameraLight fontSize={28} />
                    <span className="text-xs md:text-sm">Reunion</span>
                </div>
                <div className="w-full flex flex-col gap-0.5 justify-center items-center cursor-pointer hover:text-[#39785A]">
                    <PiCalendarCheckLight fontSize={28} />
                    <span className="text-xs md:text-sm">Calendar</span>
                </div>
            </nav>
            <img src={require("../../../res/img/dummyUserPic.png")} className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover" alt="User Image" />
        </aside>

    )
}

export default StaticSidebar;