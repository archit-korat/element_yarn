import React, { useState, useEffect } from "react";
import { FaAngleRight, FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { IoIosArrowDown } from "react-icons/io";
import { SlSettings } from "react-icons/sl";
import { HiOutlinePhotograph, HiOutlineSearch } from "react-icons/hi";
import { GoPlus } from "react-icons/go";
import { BsPlayCircle, BsThreeDotsVertical } from "react-icons/bs";
import chatBackground from "../../../res/img/chatBackground.png"
import { IoDocumentOutline, IoFolderOpenOutline } from "react-icons/io5";
import { AiOutlineLink } from "react-icons/ai";
import { HiOutlinePhoto } from "react-icons/hi2";
import { PiFolders } from "react-icons/pi";

interface Contact {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  isOnline: boolean;
  isTyping: boolean;
  unreadCount: number;
}

interface Message {
  id: number;
  text: string;
  timestamp: string;
  isOutgoing: boolean;
  type: 'text' | 'emoji' | 'file';
  fileInfo?: {
    name: string;
    type: string;
    size: string;
  };
}

interface FileItem {
  id: number;
  name: string;
  type: 'document' | 'photo' | 'video' | 'other';
  timestamp: string;
  size: string;
}

interface StaticChatState {
  isSidebarOpen: boolean;
  isMediaPanelOpen: boolean;
  selectedContact: Contact | null;
  messages: Message[];
  contacts: Contact[];
  files: FileItem[];
  isLoading: boolean;
  currentView: 'contacts' | 'chat' | 'media';
}

export default class StaticChat extends React.Component<{}, StaticChatState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      isSidebarOpen: false,
      isMediaPanelOpen: false,
      selectedContact: null,
      messages: [],
      contacts: [],
      files: [],
      isLoading: false,
      currentView: 'contacts',
    };
  }

  componentDidMount() {
    this.loadMockData();
  }

  loadMockData = () => {
    const mockContacts: Contact[] = [
      {
        id: 1,
        name: "Moussa Sall",
        avatar: "https://i.pravatar.cc/40?img=1",
        lastMessage: "Salut! Comment ça va?",
        lastMessageTime: "12:25",
        isOnline: true,
        isTyping: true,
        unreadCount: 2,
      },
      {
        id: 2,
        name: "Pathé Faye",
        avatar: "https://i.pravatar.cc/40?img=2",
        lastMessage: "Je souhaiterais vous rencontrer",
        lastMessageTime: "12:02",
        isOnline: true,
        isTyping: false,
        unreadCount: 0,
      },
      {
        id: 3,
        name: "Abdou Niang",
        avatar: "https://i.pravatar.cc/40?img=3",
        lastMessage: "Merci pour l'information",
        lastMessageTime: "11:45",
        isOnline: false,
        isTyping: false,
        unreadCount: 1,
      },
      {
        id: 4,
        name: "Khady Sow",
        avatar: "https://i.pravatar.cc/40?img=4",
        lastMessage: "À bientôt!",
        lastMessageTime: "11:30",
        isOnline: true,
        isTyping: false,
        unreadCount: 0,
      },
      {
        id: 5,
        name: "Mory Soumaré",
        avatar: "https://i.pravatar.cc/40?img=5",
        lastMessage: "D'accord, on se voit demain",
        lastMessageTime: "10:15",
        isOnline: false,
        isTyping: false,
        unreadCount: 0,
      },
      {
        id: 5,
        name: "Hello Soumaré",
        avatar: "https://i.pravatar.cc/40?img=6",
        lastMessage: "D'accord1, no se voit demain dello",
        lastMessageTime: "10:20",
        isOnline: false,
        isTyping: false,
        unreadCount: 0,
      },
    ];

    const mockMessages: Message[] = [
      {
        id: 1,
        text: "Salut! Comment ça va?",
        timestamp: "12:20",
        isOutgoing: false,
        type: 'text',
      },
      {
        id: 2,
        text: "Ça va bien, merci! Et toi?",
        timestamp: "12:22",
        isOutgoing: true,
        type: 'text',
      },
      {
        id: 3,
        text: "Très bien aussi! Tu as reçu le document?",
        timestamp: "12:23",
        isOutgoing: false,
        type: 'text',
      },
      {
        id: 4,
        text: "Oui, je l'ai reçu. Je vais le regarder ce soir.",
        timestamp: "12:24",
        isOutgoing: true,
        type: 'text',
      },
      {
        id: 5,
        text: "Parfait! 😊",
        timestamp: "12:25",
        isOutgoing: false,
        type: 'emoji',
      },
    ];

    const mockFiles: FileItem[] = [
      {
        id: 1,
        name: "rapport_2024.pdf",
        type: 'document',
        timestamp: "Aujourd'hui à 12:20",
        size: "2.5 MB",
      },
      {
        id: 2,
        name: "photo_equipe.jpg",
        type: 'photo',
        timestamp: "Hier à 15:30",
        size: "1.8 MB",
      },
      {
        id: 3,
        name: "presentation.mp4",
        type: 'video',
        timestamp: "22 juin à 10:15",
        size: "15.2 MB",
      },
      {
        id: 4,
        name: "donnees.xlsx",
        type: 'document',
        timestamp: "20 juin à 14:45",
        size: "850 KB",
      },
    ];

    this.setState({
      contacts: mockContacts,
      messages: mockMessages,
      files: mockFiles,
      selectedContact: mockContacts[0],
    });
  };

  toggleSidebar = () => {
    this.setState((prevState) => ({
      isSidebarOpen: !prevState.isSidebarOpen,
      currentView: !prevState.isSidebarOpen ? 'contacts' : 'chat',
    }));
  };

  toggleMediaPanel = () => {
    this.setState((prevState) => ({
      isMediaPanelOpen: !prevState.isMediaPanelOpen,
    }));
  };

  selectContact = (contact: Contact) => {
    this.setState({
      selectedContact: contact,
      currentView: 'chat',
      isSidebarOpen: false,
    });
  };

  getFileIcon = (type: string) => {
    switch (type) {
      case 'document':
        return "📄";
      case 'photo':
        return "🖼️";
      case 'video':
        return "🎥";
      default:
        return "📁";
    }
  };

  getFileTypeColor = (type: string) => {
    switch (type) {
      case 'document':
        return "bg-blue-100 text-blue-800";
      case 'photo':
        return "bg-green-100 text-green-800";
      case 'video':
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-red-100 text-red-800";
    }
  };

  render(): React.ReactNode {
    const {
      isSidebarOpen,
      isMediaPanelOpen,
      selectedContact,
      messages,
      contacts,
      files,
      isLoading,
      currentView,
    } = this.state;

    return (
      <div className="flex min-h-screen text-sm border border-gray-300 rounded-4xl overflow-hidden p-5">
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 bg-opacity-50 z-40 lg:hidden"
            onClick={this.toggleSidebar}
          />
        )}

        {/* Left Sidebar - Contacts Panel */}
        <aside
          className={`pr-3 fixed lg:relative z-50 h-full w-72 bg-white flex flex-col gap-5 transition-all duration-300 ease-in-out
            ${isSidebarOpen ? "left-0" : "-left-full"} lg:left-0 lg:w-72 xl:w-80`}
        >
          {/* Header */}
          <div className="w-full p-4 border-b border-gray-200">
            <div className="w-full flex items-center justify-between">
              <div className="flex justify-start items-center gap-3">
                <button className="p-2 rounded-full bg-gray-200 text-black cursor-pointer outline-none">
                  <FaChevronLeft />
                </button>
                <p className="text-lg">Chat</p>
              </div>
              <button
                className="lg:hidden p-1.5 rounded-full hover:bg-gray-100"
                onClick={this.toggleSidebar}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* User Profile Section */}
          <div className="w-full">
            <div className="w-full flex flex-col items-center gap-3">
              <div className="w-full flex justify-end items-center">
                <button className="text-gray-500 cursor-pointer"><SlSettings fontSize={24} /></button>
              </div>
              <div className="relative">
                <img
                  src="https://i.pravatar.cc/84"
                  alt="Profile"
                  className="w-[84px] h-[84px] rounded-full border-2 border-white shadow-sm"
                />
                <div className="absolute top-2 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="w-full flex flex-col justify-center items-center gap-3">
                <h3 className="w-full text-center text-gray-900 text-xl truncate">Abdoulaye Fall</h3>
                <div className="flex justify-center items-center relative">
                  <select className="bg-[#33C41329] p-1.5 px-8 rounded-lg font-normal appearance-none outline-none">
                    <option>Disponible</option>
                  </select>
                  <p className="absolute top-1/2 -translate-y-1/2 right-2.5"><IoIosArrowDown /></p>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="w-full">
            <div className="relative">
              <input
                placeholder="Rechercher..."
                className="w-full pr-8 p-2 rounded-lg bg-[#C7C7C729] text-black outline-none text-sm"
              />
              <button className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B5B5B5]">
                <HiOutlineSearch fontSize={16} />
              </button>
            </div>
          </div>

          <div className="w-full flex justify-between items-center">
            <div className="flex justify-start items-center">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Derniers messages</h4>
            </div>
            <div className="flex justify-end items-center gap-2">
              <button className="p-1 bg-[#DEF6D9] rounded-full cursor-pointer">
                <GoPlus color="#39785A" fontSize={16} />
              </button>
              <button className="cursor-pointer">
                <BsThreeDotsVertical fontSize={16} />
              </button>
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex flex-col overflow-y-auto gap-2" style={{ scrollbarWidth: 'none' }}>
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className={`px-3 py-2.5 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors duration-150 ${selectedContact?.id === contact.id ? 'bg-gray-200' : ''
                  }`}
                onClick={() => this.selectContact(contact)}
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={contact.avatar}
                    alt={contact.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex justify-start items-center gap-1">
                        <h5 className="font-medium text-gray-900 truncate text-sm">{contact.name}</h5>
                        {contact.unreadCount > 0 && (
                          <span className="bg-[#39785A] text-white text-[10px] rounded-full min-w-[16px] min-h-[16px] grid items-center text-center">
                            {contact.unreadCount}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 ml-2">{contact.lastMessageTime}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-gray-600 truncate">
                        {contact.lastMessage}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Center Panel - Chat Window */}
        <main className="min-h-[90vh] flex-1 flex flex-col overflow-hidden rounded-3xl" style={{ backgroundImage: `url(${chatBackground})` }}>
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="bg-transparent border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center space-x-3">
                  <button
                    className="lg:hidden p-1.5 rounded-full hover:bg-gray-100"
                    onClick={this.toggleSidebar}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <div className="flex items-center space-x-3">
                    <img
                      src={selectedContact.avatar}
                      alt={selectedContact.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <h2 className="font-semibold text-gray-900 text-sm">{selectedContact.name}</h2>
                      <p className="text-xs text-gray-600">
                        {selectedContact.isTyping ? "est en train d'écrire..." : "En ligne"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button className="p-1.5 rounded-full hover:bg-gray-100">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                  <button className="p-1.5 rounded-full hover:bg-gray-100">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    className="xl:hidden p-1.5 rounded-full hover:bg-gray-100"
                    onClick={this.toggleMediaPanel}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto scrollbar-none bg-transparent p-4" style={{ scrollbarWidth: 'none' }}>
                <div className="max-w-4xl mx-auto space-y-3">
                  {/* Date Separator */}
                  <div className="text-center">
                    <span className="bg-white px-3 py-1.5 rounded-full text-xs text-gray-500 shadow-sm">
                      Dim. 22 juin
                    </span>
                  </div>

                  {/* Messages */}
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isOutgoing ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-3 py-2 rounded-2xl shadow-sm ${message.isOutgoing
                          ? 'bg-[ #DEDEDE] text-black'
                          : 'bg-white text-gray-900'
                          }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p className={`text-xs mt-1 ${message.isOutgoing ? 'text-black-100' : 'text-gray-500'
                          }`}>
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {selectedContact.isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white px-3 py-2 rounded-2xl shadow-sm">
                        <div className="flex space-x-1">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Input */}
              <div className="bg-transparent border-t border-gray-200 p-3 sticky bottom-0">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center space-x-2">
                    <button className="p-1.5 rounded-full hover:bg-gray-100">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <button className="p-1.5 rounded-full hover:bg-gray-100">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828L18 9.828a2 2 0 000-2.828z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21l4-4 4 4" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </button>
                    <input
                      type="text"
                      placeholder="Écrire un message..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    />
                    <button className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition-colors duration-150">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-base font-medium text-gray-900 mb-1">Sélectionnez une conversation</h3>
                <p className="text-sm text-gray-500">Choisissez un contact pour commencer à discuter</p>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar - Media Panel */}
        <aside
          className={`pl-3 fixed xl:relative z-40 h-full w-72 bg-white flex flex-col gap-5 transition-all duration-300 ease-in-out
            ${isMediaPanelOpen ? "right-0" : "-right-full"} xl:right-0 xl:w-80`}
        >
          {/* Header */}
          <div className="w-full p-4 border-b border-gray-200">
            <div className="w-full flex items-center justify-between">
              <div className="flex justify-start items-center gap-3">
                <button className="p-2 rounded-full bg-gray-200 text-black cursor-pointer outline-none">
                  <FaChevronRight />
                </button>
                <p className="text-lg">Media</p>
              </div>
            </div>
          </div>

          {/* File Statistics */}
          {/* <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total fichiers</p>
                    <p className="text-lg font-bold text-gray-900">150</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Liens reçus</p>
                    <p className="text-lg font-bold text-gray-900">15</p>
                  </div>
                </div>
              </div>
            </div>
          </div> */}
          <div className="w-full flex flex-col gap-3">
            <p className="text-">Fichiers</p>
            <div className="w-full grid grid-cols-2 gap-3">
              <div className="w-full rounded-lg flex flex-col gap-1 p-5 bg-[#19AFD829]">
                <p>Total fichiers</p>
                <div className="flex justify-start items-center gap-1">
                  <IoFolderOpenOutline fontSize={20} color="#85C9DC" />
                  <p>150</p>
                </div>
              </div>
              <div className="w-full rounded-lg flex flex-col gap-1 p-5 bg-[#83838329]">
                <p>Les liens</p>
                <div className="flex justify-start items-center gap-1">
                  <AiOutlineLink fontSize={20} color="#B2B2B2" />
                  <p>15</p>
                </div>
              </div>
            </div>
          </div>

          {/* File Types */}
          <div className="w-full border-t border-b border-gray-200 py-3">
            <div className="w-full flex items-center justify-between mb-3">
              <h3 className="text-gray-900 text-sm">Types de fichiers</h3>
              <button className="rounded-full hover:bg-gray-100 cursor-pointer">
                <BsThreeDotsVertical fontSize={16} />
              </button>
            </div>
            <div className="w-full flex flex-col gap-3">
              {[
                { type: 'document', color: '#65CDEB', bgColor: '#DAF2F9', label: 'Documents', count: 45, icon: <IoFolderOpenOutline fontSize={20} /> },
                { type: 'photo', color: '#6BD154', bgColor: '#DEF6D9', label: 'Photos', count: 20, icon: <HiOutlinePhoto fontSize={20} /> },
                { type: 'video', color: '#FFD84B', bgColor: '#FFD84B4D', label: 'Vidéos', count: 5, icon: <BsPlayCircle fontSize={20} /> },
                { type: 'other', color: '#FF4B4B', bgColor: '#FF4B4B4D', label: 'Autres', count: 15, icon: <PiFolders fontSize={20} /> },
              ].map((fileType) => (
                <div key={fileType.type} className="w-full flex justify-between items-center p-2">
                  <div className="flex justify-start items-center gap-2">
                    <div className="p-3 rounded-full" style={{ backgroundColor: fileType.bgColor, color: fileType.color }}>
                      {fileType.icon}
                    </div>
                    <div className="flex flex-col justify-between">
                      <p className="text-sm">{fileType.label}</p>
                      <span className="text-xs text-gray-400">{fileType.count} {fileType.type}</span>
                    </div>
                  </div>
                  <FaAngleRight />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Files */}
          <div className="w-full overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            <div className="w-full flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-sm">Derniers fichiers reçus</h3>
              <button className="text-xs text-green-600 hover:text-green-700 font-medium cursor-pointer">
                Voir tout
              </button>
            </div>
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center space-x-2.5 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                >
                  <div className={`p-3 rounded-full bg-[#EBEBEB]`}>
                    <IoDocumentOutline color="#A1A1A1" fontSize={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 truncate text-sm">{file.name}</p>
                    <p className="text-xs text-gray-400">{file.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    );
  }
}