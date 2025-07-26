import React, { useState } from "react";
import {
    MdMic,
    MdMicOff,
    MdVideocam,
    MdVideocamOff,
    MdCallEnd,
    MdScreenShare,
    MdMoreHoriz,
    MdAttachFile,
    MdInsertEmoticon,
    MdSend,
    MdAccountCircle,
    MdArrowBack,
    MdPersonAdd,
} from "react-icons/md";

const participants = [
    { name: "Alice", avatar: require('../../../res/img/user3.png'), muted: false },
    { name: "Bob", avatar: require('../../../res/img/user4.png'), muted: true },
    { name: "Carol", avatar: require('../../../res/img/user2.png'), muted: false },
    { name: "Dan", avatar: "https://randomuser.me/api/portraits/men/48.jpg", muted: true },
    // { name: "Eve", avatar: "https://randomuser.me/api/portraits/women/49.jpg", muted: false },
];

const messages = [
    { from: "other", name: "Marissa Sall", text: "Lorem ipsum dolor sit amet consectetur. Vitae vulputate nec suscipit lacus at. Orci sollicitudin egestas arcu vel viverra amet. Elementum netus ullamcorper" },
    { from: "other", name: "Khadjy Sow", text: "Lorem ipsum dolor sit amet consectetur. Vitae vulputate nec suscipit lacus at." },
    { from: "other", name: "Khadjy Sow", text: "Lorem ipsum dolor sit amet consectetur." },
    { from: "me", text: "Lorem ipsum dolor sit amet consectetur." },
    { from: "other", name: "Assane Diabé", text: "Lorem ipsum dolor sit" },
    { from: "other", name: "Assane Diabé", text: "Lorem ipsum dolor sit amet consectetur. Scelerisque neque felis elit eu." },
    { from: "me", text: "Lorem ipsum dolor sit amet" },
];

export default function StaticVideo() {
    const [chatTab, setChatTab] = useState<"messages" | "participants">("messages");
    const [input, setInput] = useState("");

    return (
        <div className="min-h-screen bg-gray-50 font-sans flex flex-col md:flex-row">
            {/* Left: Video Call Window with header */}
            <div className="md:w-[70%] w-full flex flex-col items-center justify-start bg-white rounded-t-2xl md:rounded-t-2xl md:rounded-bl-2xl md:rounded-br-none shadow-md md:shadow-lg md:ml-4 md:mt-4 md:mb-4 md:mr-0 overflow-auto">
                {/* Meeting Header (only above video, not global) */}
                <header className="bg-white border-b border-gray-200 w-full rounded-t-2xl">
                    <div className="flex flex-col gap-1 px-6 pt-4 pb-2">
                        {/* First Row: Back arrow and title */}
                        <div className="flex items-center gap-3 mb-2">
                            <button
                                className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                                aria-label="Retour"
                            >
                                <MdArrowBack className="w-5 h-5 text-gray-700" />
                            </button>
                            <span className="font-bold text-base md:text-[15px] text-gray-900">Titre de la Réunion</span>
                        </div>
                        {/* Second Row: Stats and Add button */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 w-full">
                            <div className="flex flex-row items-center gap-6 w-full md:w-auto">
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <span className="inline-flex items-center gap-1">
                                        <span className="text-lg"><svg width='18' height='18' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'><path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'></path><circle cx='9' cy='7' r='4'></circle><path d='M22 21v-2a4 4 0 0 0-3-3.87'></path><path d='M16 3.13a4 4 0 0 1 0 7.75'></path></svg></span>
                                        Personnes invitées :
                                        <span className="ml-1 font-medium text-green-700 bg-green-100 rounded-full px-2 py-0.5">12</span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <span className="inline-flex items-center gap-1">
                                        <span className="text-lg"><svg width='18' height='18' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'><path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'></path><circle cx='9' cy='7' r='4'></circle><path d='M22 21v-2a4 4 0 0 0-3-3.87'></path><path d='M16 3.13a4 4 0 0 1 0 7.75'></path></svg></span>
                                        Absent(e)(s) :
                                        <span className="ml-1 font-medium text-red-700 bg-red-100 rounded-full px-2 py-0.5">2</span>
                                    </span>
                                </div>
                            </div>
                            <button
                                className="flex items-center gap-2 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium rounded-md border border-green-200 transition-colors"
                                aria-label="Ajouter des participants"
                            >
                                <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center"><MdPersonAdd className="w-4 h-4" /></span>
                                <span>Ajouter participants</span>
                            </button>
                        </div>
                    </div>
                </header>
                {/* Main Video Feed */}
                <div className="w-full h-[320px] md:h-screen flex items-center justify-center p-5">
                    <div className="relative w-[90%] h-full mx-auto">
                        <img
                            src={require('../../../res/img/user1.png')}
                            alt="Main participant"
                            className="object-cover w-full h-full rounded-2xl shadow-lg"
                        />
                        <div className="absolute top-6 left-6 bg-gray-50/50 text-gray-800 px-2 rounded-full flex justify-center items-center gap-1 text-sm font-medium flex items-center shadow">
                            <p className="w-2 h-2 rounded-full bg-red-500 text-lg border-2 border-white"></p>
                            <span>15:20</span>
                        </div>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3">
                            {participants.slice(0, 4).map((p, i) => (
                                <div key={i} className="relative">
                                    <img
                                        src={p.avatar}
                                        alt={p.name}
                                        className="w-12 h-12 rounded-xl border-2 border-white shadow"
                                    />
                                    {p.muted && (
                                        <MdMicOff className="w-5 h-5 text-red-500 absolute bottom-0 right-0 bg-white rounded-full p-0.5 shadow" />
                                    )}
                                </div>
                            ))}
                            <div className=" rounded-xl flex items-center justify-center text-white font-semibold text-base">
                                +5
                            </div>
                        </div>
                        {/* Volume Slider (optional) */}
                        <div className="absolute left-4 bottom-1/2 translate-y-1/2 hidden md:block">
                            <input type="range" min="0" max="100" className="accent-green-500" />
                        </div>
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
                            <button className="cursor-pointer bg-gray-50/20 hover:bg-gray-50/50 hover:text-black text-white p-2 rounded-full">
                                <MdMic className="w-5 h-5" />
                            </button>
                            <button className="cursor-pointer bg-gray-50/20 hover:bg-gray-50/50 hover:text-black text-white p-2 rounded-full">
                                <MdVideocam className="w-5 h-5" />
                            </button>
                            <button className="cursor-pointer bg-red-500 hover:bg-red-600 p-2 rounded-lg">
                                <MdCallEnd className="w-6 h-6 text-white" />
                            </button>
                            <button className="cursor-pointer bg-gray-50/20 hover:bg-gray-50/50 hover:text-black text-white p-2 rounded-full">
                                <MdScreenShare className="w-5 h-5" />
                            </button>
                            <button className="cursor-pointer bg-gray-50/20 hover:bg-gray-50/50 hover:text-black text-white p-2 rounded-full">
                                <MdMoreHoriz className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    {/* Participant Thumbnails */}
                </div>
                {/* Control Bar */}
            </div>

            {/* Right: Chat Panel (no global header above) */}
            <div className="md:w-[30%] w-full flex flex-col h-[calc(100vh)] bg-gray-100 border-l border-gray-200 relative">
                {/* Chat Header */}
                <div className="sticky top-0 z-10 bg-gray-100/90 backdrop-blur px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <div className="font-semibold text-lg">Groupe de discussion</div>
                        <div className="flex gap-2 mt-2">
                            <button
                                className={`px-3 py-1 rounded-full text-sm font-medium ${chatTab === "messages" ? "bg-white shadow text-green-600" : "text-gray-500"}`}
                                onClick={() => setChatTab("messages")}
                            >
                                Messages
                            </button>
                            <button
                                className={`px-3 py-1 rounded-full text-sm font-medium ${chatTab === "participants" ? "bg-white shadow text-green-600" : "text-gray-500"}`}
                                onClick={() => setChatTab("participants")}
                            >
                                Participants
                            </button>
                        </div>
                    </div>
                </div>
                {/* Chat Body */}
                <div
                    className="flex-1 overflow-y-auto px-4 py-6"
                    style={{
                        backgroundImage:
                            "url('https://www.transparenttextures.com/patterns/paper-fibers.png')",
                    }}
                >
                    {chatTab === "messages" ? (
                        <div className="flex flex-col gap-4">
                            {messages.map((msg, i) =>
                                msg.from === "me" ? (
                                    <div key={i} className="flex justify-end">
                                        <div className="bg-gray-200 text-gray-800 rounded-xl px-4 py-2 max-w-xs shadow">
                                            {msg.text}
                                        </div>
                                    </div>
                                ) : (
                                    <div key={i} className="flex items-end gap-2">
                                        <MdAccountCircle className="w-8 h-8 text-gray-400" />
                                        <div>
                                            <div className="bg-white text-gray-800 rounded-xl px-4 py-2 max-w-xs shadow">
                                                {msg.text}
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    ) : (
                        <div className="text-gray-500 text-center mt-10">Liste des participants…</div>
                    )}
                </div>
                {/* Chat Input */}
                <div className="sticky bottom-0 z-10 bg-gray-100/90 backdrop-blur px-4 py-3 border-t border-gray-200">
                    <form
                        className="flex items-center gap-2"
                        onSubmit={e => {
                            e.preventDefault();
                            // handle send
                        }}
                    >
                        <button type="button" className="p-2 rounded-full hover:bg-gray-200">
                            <MdInsertEmoticon className="w-6 h-6 text-gray-500" />
                        </button>
                        <button type="button" className="p-2 rounded-full hover:bg-gray-200">
                            <MdAttachFile className="w-6 h-6 text-gray-500" />
                        </button>
                        <input
                            className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                            placeholder="Écrire un message…"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="bg-green-500 hover:bg-green-600 p-2 rounded-full"
                        >
                            <MdSend className="w-6 h-6 text-white" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}