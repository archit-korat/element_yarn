import React, { useState, useEffect } from "react";

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
      <div className="flex h-screen bg-gray-50 text-sm overflow-hidden">
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 bg-opacity-50 z-40 lg:hidden"
            onClick={this.toggleSidebar}
          />
        )}

        {/* Left Sidebar - Contacts Panel */}
        <aside
          className={`fixed lg:relative z-50 h-full w-72 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out
            ${isSidebarOpen ? "left-0" : "-left-full"} lg:left-0 lg:w-72 xl:w-80`}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">K</span>
                </div>
                <h1 className="text-lg font-bold text-gray-900">Kumpa</h1>
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
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src="https://i.pravatar.cc/84"
                  alt="Profile"
                  className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm truncate">Abdoulaye Fall</h3>
                <div className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  <span className="text-xs text-gray-600">Disponible</span>
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <input
                placeholder="Rechercher..."
                className="w-full pr-8 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
              <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-3 py-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Derniers messages</h4>
            </div>
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className={`px-3 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${selectedContact?.id === contact.id ? 'bg-green-50 border-r-2 border-green-500' : ''
                  }`}
                onClick={() => this.selectContact(contact)}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-10 h-10 rounded-full"
                    />
                    {contact.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-900 truncate text-sm">{contact.name}</h5>
                      <span className="text-xs text-gray-500 ml-2">{contact.lastMessageTime}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-gray-600 truncate">
                        {contact.isTyping ? (
                          <span className="text-green-600">est en train d'écrire...</span>
                        ) : (
                          contact.lastMessage
                        )}
                      </p>
                      {contact.unreadCount > 0 && (
                        <span className="ml-2 bg-green-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[16px] text-center">
                          {contact.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Center Panel - Chat Window */}
        <main className="flex-1 flex flex-col min-w-0">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
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
              <div className="flex-1 overflow-y-auto scrollbar-none bg-gray-50 p-4" style={{ scrollbarWidth: 'none' }}>
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
              <div className="bg-white border-t border-gray-200 p-3 sticky bottom-0">
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
          className={`fixed xl:relative z-40 h-full w-72 bg-white border-l border-gray-200 flex flex-col transition-all duration-300 ease-in-out
            ${isMediaPanelOpen ? "right-0" : "-right-full"} xl:right-0 xl:w-80`}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Médias</h2>
              <button
                className="xl:hidden p-1.5 rounded-full hover:bg-gray-100"
                onClick={this.toggleMediaPanel}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* File Statistics */}
          <div className="p-4 border-b border-gray-200">
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
          </div>

          {/* File Types */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-sm">Types de fichiers</h3>
              <button className="p-1 rounded-full hover:bg-gray-100">
                <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {[
                { type: 'document', label: 'Documents', count: 45, icon: '📄' },
                { type: 'photo', label: 'Photos', count: 20, icon: '🖼️' },
                { type: 'video', label: 'Vidéos', count: 5, icon: '🎥' },
                { type: 'other', label: 'Autres', count: 15, icon: '📁' },
              ].map((fileType) => (
                <div
                  key={fileType.type}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{fileType.icon}</span>
                    <span className="font-medium text-gray-900 text-sm">{fileType.label}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs text-gray-500">{fileType.count} fichiers</span>
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Files */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-sm">Derniers fichiers reçus</h3>
              <button className="text-xs text-green-600 hover:text-green-700 font-medium">
                Voir tout
              </button>
            </div>
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center space-x-2.5 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${this.getFileTypeColor(file.type)}`}>
                    <span className="text-sm">{this.getFileIcon(file.type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate text-sm">{file.name}</p>
                    <p className="text-xs text-gray-500">{file.timestamp}</p>
                  </div>
                  <span className="text-xs text-gray-400">{file.size}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    );
  }
}