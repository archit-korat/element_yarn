import React, { useLayoutEffect, useRef, useState } from "react";
import { _t } from "../../languageHandler";
import UIStore from "../../stores/UIStore";
import { useDispatcher } from "../../hooks/useDispatcher";
import defaultDispatcher from "../../dispatcher/dispatcher";
import { ActionPayload } from "../../dispatcher/payloads";
import { Action } from "../../dispatcher/actions";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { FaRegShareFromSquare } from "react-icons/fa6";
import { TbEdit } from "react-icons/tb";
import QuickSettingsButton from "./spaces/QuickSettingsButton";

const StaticSidebar: React.FC = () => {

    const [isPanelCollapsed, setPanelCollapsed] = useState(true);
    const ref = useRef<HTMLDivElement>(null);

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
        <aside className="font-['Inter',sans-serif] w-20 md:w-28 min-h-screen p-2 md:p-3 gap-8 overflow-y-auto flex flex-col justify-between items-center bg-white dark:bg-black dark:text-white scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <img src={require("../../../res/img/kumpaLOgo.png")} className="w-[90%] md:w-[70%] h-auto object-cover mx-auto" alt="Kumpa Logo" />
            <nav className="flex flex-col justify-start items-center gap-6 flex-1 mt-4">
                <div className="w-full flex flex-col gap-0.5 justify-center items-center cursor-pointer text-[#39785A] hover:text-[#39785A]">
                    {/* <ChatIcon width={28} height={28} /> */}
                    <IoChatbubbleEllipsesOutline fontSize={28} />
                    <span className="text-xs md:text-sm font-semibold">Chat</span>
                </div>
                <div className="w-full flex flex-col gap-0.5 justify-center items-center cursor-pointer hover:text-[#39785A]">
                    <FaRegShareFromSquare fontSize={26} />
                    <span className="text-xs md:text-sm">Inviter</span>
                </div>
                <div className="w-full flex flex-col gap-0.5 justify-center items-center cursor-pointer hover:text-[#39785A]">
                    <TbEdit fontSize={28} />
                    <span className="text-xs md:text-sm">Créer</span>
                </div>
            </nav>
            <div className="w-full flex flex-col justify-center items-center">
                <div className="w-full flex flex-col gap-0.5 justify-center items-center cursor-pointer hover:text-[#39785A]">
                    {/* <SlSettings fontSize={28} /> */}
                    <QuickSettingsButton isPanelCollapsed={isPanelCollapsed} />
                </div>
                <img src={require("../../../res/img/dummyUserPic.png")} className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover" alt="User Image" />
            </div>
        </aside>

    )
}

export default StaticSidebar;