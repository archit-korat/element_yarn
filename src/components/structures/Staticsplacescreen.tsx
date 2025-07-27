import React from "react";
import logo from "../../../res/img/kampa.png";

export default function StaticSplaceScreen() {
    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-center">
            <img src={logo} alt="Kumpa Logo" className="w-35 mb-4" />
            <div className="text-xl md:text-xl font-bold text-center mb-2">République du Sénégal</div> 
            <p className="text-gray-700 text-center text-base md:text-sm">
                La plateforme nationale d'échanges sécurisés
            </p>
        </div>
    );
}