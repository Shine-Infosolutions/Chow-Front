import React from "react";
import { Link } from "react-router-dom";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import { useSeo } from "../../hooks/useSeo.js";
import amavatBarfi from "../../assets/Amavat Barfi (1).jpg";
import chocolateBarfi from "../../assets/Chocolate Fruits Barfi (1).jpg";

const About = () => {
  useSeo({ title: 'About Us — Gorakhpur Sweet House Since 1970', description: 'The story of Chowdhry Sweet House at Vijay Chowk, Golghar, Gorakhpur — a legacy of authentic Indian sweets, mithai and vegetarian delights since 1970.', path: '/about' });
  return (
    <div className="mithai-bg min-h-screen">
      <Breadcrumb currentPage="About" />

      {/* Top Images */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 animate-fade-up">
          <img
            src={amavatBarfi}
            alt="Traditional Indian barfi at Chowdhry Sweet House, Gorakhpur"
            className="w-full h-48 sm:h-64 md:h-80 object-cover rounded-2xl shadow-sm"
          />
          <img
            src={chocolateBarfi}
            alt="Traditional Indian barfi at Chowdhry Sweet House, Gorakhpur"
            className="w-full h-48 sm:h-64 md:h-80 object-cover rounded-2xl shadow-sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 sm:p-7 md:p-10 animate-fade-up">
          <span className="inline-block rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-[#d80a4e] mb-3">
            About Us
          </span>

          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 leading-tight text-gray-900">
            The Story of Chowdhry Sweet House – A Legacy of Sweetness Since 1970
          </h1>

          <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6 leading-relaxed">
            In the heart of Gorakhpur, at Vijay Chowk, stands{" "}
            <strong>Chowdhry Sweet House</strong>, a name synonymous with
            tradition, taste, and trust. Since{" "}
            <strong>1970</strong>, this beloved establishment has been serving
            generations with the finest Indian sweets and savory delights,
            making it a cherished part of the city's culinary heritage.
          </p>

          {/* Section */}
          <h3 className="text-base sm:text-lg font-bold text-[#d80a4e] mb-2 sm:mb-3">
            A Tradition of Authenticity & Quality
          </h3>

          <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6 leading-relaxed">
            From the melt-in-your-mouth <strong>Rajbhog</strong> to the rich,
            creamy <strong>Rasmalai</strong>, every sweet at Chowdhry Sweet
            House is crafted with love and perfection. Our commitment to using{" "}
            <strong>pure ingredients</strong> and maintaining the{" "}
            <strong>highest hygiene standards</strong> has earned us the trust
            of thousands of customers.
          </p>

          {/* Section */}
          <h3 className="text-base sm:text-lg font-bold text-[#d80a4e] mb-2 sm:mb-3">
            A Culinary Destination Beyond Sweets
          </h3>

          <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6 leading-relaxed">
            More than just a sweet shop, <strong>Chowdhry Sweet House</strong>{" "}
            is a <strong>family-friendly vegetarian restaurant</strong>,
            offering a delightful mix of traditional{" "}
            <strong>North Indian dishes</strong>, snacks, and desserts.
            Whether you're indulging in a plate of{" "}
            <strong>chaat</strong>, savoring a warm{" "}
            <strong>gulab jamun</strong>, or enjoying a hearty meal, every
            visit here is a flavorful experience.
          </p>

          {/* Section */}
          <h3 className="text-base sm:text-lg font-bold text-[#d80a4e] mb-3 sm:mb-4">
            Why Gorakhpur Loves Us?
          </h3>

          <ul className="space-y-2 text-sm sm:text-base text-gray-700 mb-8 sm:mb-12">
            <li>⭐ <strong>Over 50 Years of Excellence</strong></li>
            <li>⭐ <strong>4.4/5 Swiggy | 4.3/5 Zomato | 3.9/5 Justdial</strong></li>
            <li>⭐ <strong>Top Choice for Festivals & Celebrations</strong></li>
            <li>⭐ <strong>Hygienic & Authentic Preparation</strong></li>
          </ul>

          {/* Visit */}
          <div className="mt-8 sm:mt-12 text-center">
            <div className="bg-rose-50/50 border border-amber-100 p-5 sm:p-6 rounded-2xl mb-4 sm:mb-6">
              <div className="space-y-3 sm:space-y-4 text-gray-700">
                <div>
                  <div className="flex items-center justify-center gap-2 text-[#d80a4e] font-semibold mb-1 sm:mb-2">
                    <span className="text-base sm:text-lg">📍</span>
                    <span className="text-sm sm:text-base">Visit Us:</span>
                  </div>
                  <p className="text-xs sm:text-sm md:text-base">Vijay Chowk, in front of Vijay Talkies, Golghar, Gorakhpur</p>
                </div>
                
                <div>
                  <div className="flex items-center justify-center gap-2 text-[#d80a4e] font-semibold mb-1 sm:mb-2">
                    <span className="text-base sm:text-lg">📞</span>
                    <span className="text-sm sm:text-base">Call Now:</span>
                  </div>
                  <p className="text-xs sm:text-sm md:text-base">075250 25100</p>
                </div>
                
                <div>
                  <div className="flex items-center justify-center gap-2 text-[#d80a4e] font-semibold mb-1 sm:mb-2">
                    <span className="text-base sm:text-lg">📲</span>
                    <span className="text-sm sm:text-base">Order Online:</span>
                  </div>
                  <p className="text-xs sm:text-sm md:text-base">Swiggy | Zomato</p>
                </div>
                
                <p className="text-[#d80a4e] font-semibold mt-3 sm:mt-4 text-sm sm:text-base">
                  Taste the tradition, indulge in excellence! 🍬✨
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link to="/contact" className="shine-on-hover bg-[#d80a4e] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#b8083e] transition-colors text-sm sm:text-base">
                Contact Us
              </Link>
              <Link to="/shop" className="bg-gray-800 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors text-sm sm:text-base">
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;