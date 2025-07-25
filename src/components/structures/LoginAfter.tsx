import React from "react";

export default class LoginAfter extends React.Component {
  render(): React.ReactNode {
    return (
      <div className="flex min-h-screen bg-[#39785A] items-center justify-center p-4 relative">
        <div className="bg-white w-[90%] max-w-2xl min-h-[70vh] max-h-[80vh] flex flex-col justify-center md:justify-start md:flex-row rounded-xl overflow-auto shadow-xl relative z-10">
          {/* Left Form Section */}
          <div className="w-full h-full md:w-2/3 p-6 sm:px-16 flex flex-col justify-center md:justify-start gap-12">
              <img
                src={require("../../../res/img/kampa.png")}
                alt="Kumpa Logo"
                className="mx-auto md:mx-0 w-[20%] md:w-[25%] object-cover"
              />
            <form className="space-y-4 sm:space-y-6">
              <div>
                <label
                  className="block text-gray-700 font-semibold text-sm sm:text-base mb-1"
                  htmlFor="username"
                >
                  Identifiant
                </label>
                <input
                  id="username"
                //   type="text"
                  aria-label="Identifiant"
                  className="w-full border border-gray-600 rounded px-3 sm:px-4 py-2 text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-[#39785A]"
                />
              </div>
              <div>
                <label
                  className="block text-gray-700 font-semibold text-sm sm:text-base mb-1"
                  htmlFor="password"
                >
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  aria-label="Mot de passe"
                  className="w-full border border-gray-600 rounded px-3 sm:px-4 py-2 text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-[#39785A]"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#39785A] text-white py-2 rounded font-semibold text-sm sm:text-base hover:bg-[#2f624a] transition-colors"
              >
                Se connecter
              </button>
            </form>
          </div>

          {/* Right Image Section */}
          <div className="hidden md:block w-full md:w-1/3 max-h-[80vh]">
            <img
              src={require("../../../res/img/kumpaloginimg.png")}
              alt="Smiling Child"
              className="object-cover w-full h-full max-h-[80vh]"
            />
          </div>
        </div>
        <div className="hidden md:block absolute -top-36 -right-16 w-96 h-96 bg-transparent rounded-full border-20 border-white opacity-50"></div>
        <div className="hidden md:block absolute -bottom-12 -left-32 w-[450px] h-[450px] bg-transparent rounded-full border-20 border-white opacity-50"></div>
        <div className="hidden md:block absolute -top-12 -left-28 w-96 h-96 bg-transparent rounded-full border-20 border-white opacity-50"></div>
      </div>
    );
  }
}