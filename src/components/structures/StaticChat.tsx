import React from "react";
import { FaAngleRight, FaChevronLeft, FaChevronRight, FaVideo } from "react-icons/fa6";
import { IoIosArrowDown, IoIosCall, IoIosInformationCircle } from "react-icons/io";
import { SlSettings } from "react-icons/sl";
import { HiOutlineEmojiHappy, HiOutlineSearch } from "react-icons/hi";
import { GoPlus } from "react-icons/go";
import { BsPlayCircle, BsThreeDotsVertical } from "react-icons/bs";
import chatBackground from "../../../res/img/chatBackground.png"
import { IoClose, IoDocumentOutline, IoFolderOpenOutline } from "react-icons/io5";
import { AiFillMessage, AiOutlineLink } from "react-icons/ai";
import { HiOutlinePhoto } from "react-icons/hi2";
import { PiFolders } from "react-icons/pi";
import { GiHamburgerMenu } from "react-icons/gi";
import { TbLibrary } from "react-icons/tb";
import { RiSendPlaneFill } from "react-icons/ri";
import { ImAttachment } from "react-icons/im";

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
      files
    } = this.state;

    return (
      <div className="flex min-h-screen text-sm lg:border lg:border-gray-300 rounded-4xl overflow-hidden p-2 lg:p-5">
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 bg-opacity-50 z-40 lg:hidden"
            onClick={this.toggleSidebar}
          />
        )}

        {/* Left Sidebar - Contacts Panel */}
        <aside
          className={`px-3 lg:pr-3 fixed lg:relative z-50 h-full bg-white flex flex-col gap-5 transition-all duration-300 ease-in-out
            ${isSidebarOpen ? "left-0" : "-left-full"} lg:left-0 w-72 lg:w-[25%] top-0 overflow-y-auto`}
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
              <button className="lg:hidden p-1.5 rounded-full hover:bg-gray-100 cursor-pointer" onClick={this.toggleSidebar}>
                <IoClose fontSize={20} />
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
          <div className="flex flex-col overflow-y-auto gap-2 min-h-[325.5px]" style={{ scrollbarWidth: 'none' }}>
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
        <main className="min-h-[90vh] w-full lg:w-[50%] flex flex-col overflow-hidden rounded-3xl p-3" style={{ backgroundImage: `url(${chatBackground})`, backgroundRepeat: 'no-repeat', backgroundSize: 'cover' }}>
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="w-full bg-transparent border-b border-gray-200 flex items-center justify-between sticky top-0 z-10 py-2">
                <div className="flex items-center gap-1.5">
                  <button
                    className="lg:hidden p-1.5 rounded-full hover:bg-gray-100"
                    onClick={this.toggleSidebar}
                  >
                    <GiHamburgerMenu />
                  </button>
                  <div className="flex items-center gap-2.5">
                    <img src={selectedContact.avatar} alt={selectedContact.name} className="w-6 h-6 rounded-full" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm truncate">{selectedContact.name}</p>
                      <p className="text-xs text-gray-600 truncate">
                        {selectedContact.isTyping ? "est en train d'écrire..." : "En ligne"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <button className="rounded-full hover:bg-gray-100 cursor-pointer">
                    <FaVideo fontSize={20} color="#636262" />
                  </button>
                  <button className="rounded-full hover:bg-gray-100 cursor-pointer">
                    <IoIosCall fontSize={20} color="#636262" />
                  </button>
                  <button className="rounded-full hover:bg-gray-100 cursor-pointer">
                    <AiFillMessage fontSize={20} color="#636262" />
                  </button>
                  <button className="rounded-full hover:bg-gray-100 cursor-pointer">
                    <IoIosInformationCircle fontSize={22} color="#636262" />
                  </button>
                  <button className="lg:hidden rounded-full hover:bg-gray-100" onClick={this.toggleMediaPanel} >
                    <TbLibrary fontSize={20} color="#636262" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto scrollbar-none bg-transparent p-3" style={{ scrollbarWidth: 'none' }}>
                <div className="w-full mx-auto flex flex-col gap-3">
                  {/* Date Separator */}
                  <span className="w-full text-left text-xs pl-4">Dim. 22 juin</span>

                  {/* Messages */}
                  {/* {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isOutgoing ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`w-auto max-h-[60%] px-3 py-2 rounded-2xl shadow-sm 
                          ${message.isOutgoing ? 'bg-[#DEDEDE] text-black' : 'bg-white text-gray-900'}`}
                      >
                        <p className="text-sm">{message.text}</p>
                      </div>
                    </div>
                  ))} */}
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isOutgoing ? 'justify-end pr-4' : 'justify-start pl-4'}`}
                    >
                      <div
                        className={`relative w-auto max-w-[80%] p-3 rounded-lg
                          ${message.isOutgoing ? 'bg-[#DEDEDE] text-black' : 'bg-white text-gray-900'}`}
                      >
                        <p className="text-sm">{message.text}</p>

                        {/* Tail using clip-path - Outgoing */}
                        {message.isOutgoing && (
                          <div
                            className="absolute -bottom-2.5 -right-2 w-4 h-6 bg-[#DEDEDE] rotate-[120deg]"
                            style={{ clipPath: 'polygon(100% 100%, 54% 0, 0 98%)' }}
                          />
                        )}

                        {/* Tail using clip-path - Incoming */}
                        {!message.isOutgoing && (
                          <div
                            className="absolute -bottom-2.5 -left-2 w-4 h-6 bg-white rotate-[-120deg]"
                            style={{ clipPath: 'polygon(0 100%, 46% 0, 100% 98%)' }}
                          />
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {selectedContact.isTyping && (
                    <div className="flex justify-start p-4">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Input */}
              <div className="bg-transparent p-3 sticky bottom-0 relative">
                {/* <div className="max-w-4xl mx-auto">
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
                </div> */}
                <input
                  placeholder="Écrire un message..."
                  className="w-full bg-white shadow-xl rounded-lg p-3 text-sm outline-none"
                />
                <div className="absolute top-1/2 -translate-y-1/2 right-5 flex justify-center items-center gap-1.5">
                  <button className="hover:bg-gray-200 hover:text-black text-gray-500 p-1.5 rounded-full transition-colors duration-150 cursor-pointer">
                    <HiOutlineEmojiHappy fontSize={12} />
                  </button>
                  <button className="hover:bg-gray-200 hover:text-black text-gray-500 p-1.5 rounded-full transition-colors duration-150 cursor-pointer">
                    <ImAttachment fontSize={12} />
                  </button>
                  <button className="bg-[#39785A] hover:bg-[#39785A]/90 text-white p-1.5 rounded-full transition-colors duration-150 cursor-pointer">
                    <RiSendPlaneFill fontSize={12} />
                  </button>
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
        {isMediaPanelOpen && (
          <div
            className="fixed inset-0 bg-black/50 bg-opacity-50 z-40 lg:hidden"
            onClick={this.toggleMediaPanel}
          />
        )}
        <aside
          className={`px-3 xl:pl-3 fixed xl:relative z-40 h-full bg-white flex flex-col gap-5 transition-all duration-300 ease-in-out
            ${isMediaPanelOpen ? "right-0" : "-right-full"} w-72 lg:w-[25%] lg:right-0 top-0 overflow-y-auto`}
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
              <button className="lg:hidden p-1.5 rounded-full hover:bg-gray-100 cursor-pointer" onClick={this.toggleMediaPanel}>
                <IoClose fontSize={20} />
              </button>
            </div>
          </div>

          {/* File Statistics */}
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
                <div key={fileType.type} className="w-full flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
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
          <div className="w-full overflow-y-auto min-h-[162px]" style={{ scrollbarWidth: 'none' }}>
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