import React from "react";
import bgImage from "../../../res/img/Backgroundimage.png";
import logo from "../../../res/img/kampa.png";
import childImg from "../../../res/img/kumpaloginimg.png";
import sliderImg from "../../../res/img/sliderImage.png";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

const slides = [
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

export default function LoginAfter() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="bg-white w-[90%] max-w-4xl max-h-[80vh] flex flex-col justify-center md:justify-start md:flex-row rounded-xl overflow-hidden shadow-xl relative z-10">
        {/* Left: Welcome */}
        <div className="w-full md:w-2/5  flex flex-col items-center justify-center p-8 bg-white">
          <img src={logo} alt="Kumpa Logo" className="w-26 mb-3" />
          <div className="text-sm md:text-sm font-bold text-center text-gray-900 mb-4">
            Bienvenue dans votre plateforme d'échanges sécurisés
          </div>
          <button className="bg-[#2A7856] text-white px-6 py-2 rounded font-semibold text-lg hover:bg-[#256346] transition-colors w-full max-w-xs">
            Se connecter
          </button>
        </div>
        {/* Right: Swiper Image, overlay, text, dots */}
        <div className="hidden md:flex w-full md:w-3/5 relative items-center justify-center min-h-[350px]">
          <Swiper
            modules={[Pagination, Autoplay]}
            pagination={{
              clickable: true,
              bulletClass: "swiper-pagination-bullet custom-bullet",
              bulletActiveClass: "swiper-pagination-bullet-active custom-bullet-active",
            }}
            effect="fade"
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
            }}
            className="w-full h-full flex flex-col items-center justify-center"
          >
            {slides.map((slide, idx) => (
              <SwiperSlide key={idx}>
                <div className="w-full h-full relative flex flex-col items-center justify-center gap-2">
                  <img src={slide.img} className="w-full h-full object-cover" alt="slide img" />
                  <div className="absolute w-full h-full bg-black/50 top-0 left-0"></div>
                  <div className="absolute w-[90%] max-h-[90px] bottom-12 left-1/2 -translate-x-1/2 flex flex-col gap-1">
                    <p className="font-semibold text-white text-center text-sm md:text-base truncate">{slide.title}</p>
                    <p className="text-white text-center text-xs md:text-sm">{slide.desc}</p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          <style>{`
            .custom-bullet {
              background: #facc15;
              opacity: 0.5;
              width: 12px;
              height: 12px;
              margin: 0 6px !important;
              border-radius: 50%;
              transition: opacity 0.2s;
            }
            .custom-bullet-active {
              opacity: 1;
              border: 2px solid #2A7856;
            }
            .swiper-pagination {
              bottom: 16px !important;
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}