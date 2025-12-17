import React, { useEffect, useState } from "react";
import { ShoppingCart, Users, CheckCircle, DollarSign } from "lucide-react";
import { useApi } from "../../context/ApiContext.jsx";

const Dashboard = () => {
  const { loading } = useApi();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-red-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
        
        {/* New Orders */}
        <div className="relative h-36 rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 text-white shadow-lg overflow-hidden">
          <div className="relative z-10 h-full flex items-center justify-between px-6">
            <div>
              <p className="text-sm font-medium opacity-90">New Orders</p>
              <h2 className="text-3xl font-bold mt-2">3,243</h2>
            </div>
          </div>
          <ShoppingCart className="absolute right-4 top-1/2 -translate-y-1/2 w-24 h-24 opacity-20" />
        </div>

        {/* Customers */}
        <div className="relative h-36 rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-lg overflow-hidden">
          <div className="relative z-10 h-full flex items-center justify-between px-6">
            <div>
              <p className="text-sm font-medium opacity-90">Customers</p>
              <h2 className="text-3xl font-bold mt-2">15.07k</h2>
            </div>
          </div>
          <Users className="absolute right-4 top-1/2 -translate-y-1/2 w-24 h-24 opacity-20" />
        </div>

        {/* Ticket Resolved */}
        <div className="relative h-36 rounded-xl bg-gradient-to-r from-emerald-700 to-green-400 text-white shadow-lg overflow-hidden">
          <div className="relative z-10 h-full flex items-center justify-between px-6">
            <div>
              <p className="text-sm font-medium opacity-90">Ticket Resolved</p>
              <h2 className="text-3xl font-bold mt-2">578</h2>
            </div>
          </div>
          <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-24 h-24 opacity-20" />
        </div>

        {/* Revenue Today */}
        <div className="relative h-36 rounded-xl bg-gradient-to-r from-orange-600 to-yellow-400 text-white shadow-lg overflow-hidden">
          <div className="relative z-10 h-full flex items-center justify-between px-6">
            <div>
              <p className="text-sm font-medium opacity-90">Revenue Today</p>
              <h2 className="text-3xl font-bold mt-2">INR 11.61k</h2>
            </div>
          </div>
          <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 w-24 h-24 opacity-20" />
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
