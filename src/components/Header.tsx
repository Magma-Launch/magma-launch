"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "@/contexts/FormContext";
import { useAccount } from "wagmi";

export default function Header() {
  const { setActiveForm } = useForm();
  const { isConnected } = useAccount();

  return (
    <header className="w-full backdrop-blur-md border-b border-white/20 sticky top-0 z-50 relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/MagmaBannerBackground.jpg"
          alt="Magma Banner Background"
          fill
          style={{ objectFit: "cover" }}
          priority
        />
      </div>

      {/* Header Content */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Side - Logo */}
          <div className="flex items-center -ml-4">
            <Link
              href="/"
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity brightness-110 hover:scale-105"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = "/";
              }}
            >
              <Image
                src="/Magma Logo.svg"
                alt="Magma Logo"
                width={124}
                height={124}
                className="w-40 h-auto"
              />
            </Link>
          </div>

          {/* Center - Create Token (always centered) */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <div className="animate-subtleBounceInfinite">
              <button
                className="relative group cursor-pointer"
                onClick={() => {
                  setActiveForm("create");
                  window.location.href = "/?form=create";
                }}
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 rounded-lg blur-lg opacity-75 group-hover:opacity-100 transition-all duration-300 animate-pulse"></div>

                {/* Button Content */}
                <div
                  className="relative bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white px-6 py-2 rounded-lg font-bold transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-2xl cursor-pointer"
                  style={{
                    boxShadow:
                      "0 4px 15px rgba(168, 85, 247, 0.4), 0 0 20px rgba(236, 72, 153, 0.3), 0 0 30px rgba(239, 68, 68, 0.2)",
                  }}
                >
                  Create Token
                </div>

                {/* Wild Fire Effect Under Button - Full Length */}
                <div className="absolute -bottom-3 left-0 right-0 h-8">
                  {/* Base Fire Layer */}
                  <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-orange-600 via-orange-500 to-transparent rounded-t-full animate-pulse"></div>

                  {/* Multiple Flame Rows - Full Width Coverage */}
                  <div className="relative w-full h-full">
                    {/* Row 1 - Large Flames (Sides Big, Center Small) */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between items-end px-1">
                      <div
                        className="w-6 h-8 bg-gradient-to-t from-orange-600 via-yellow-400 to-red-500 rounded-t-full"
                        style={{
                          animation: "flicker 0.8s infinite",
                          animationDelay: "0s",
                        }}
                      ></div>
                      <div
                        className="w-3 h-5 bg-gradient-to-t from-orange-500 via-yellow-300 to-red-400 rounded-t-full"
                        style={{
                          animation: "flicker 0.6s infinite",
                          animationDelay: "0.1s",
                        }}
                      ></div>
                      <div
                        className="w-2 h-4 bg-gradient-to-t from-orange-600 via-yellow-400 to-red-500 rounded-t-full"
                        style={{
                          animation: "flicker 0.7s infinite",
                          animationDelay: "0.2s",
                        }}
                      ></div>
                      <div
                        className="w-3 h-5 bg-gradient-to-t from-orange-500 via-yellow-300 to-red-400 rounded-t-full"
                        style={{
                          animation: "flicker 0.5s infinite",
                          animationDelay: "0.3s",
                        }}
                      ></div>
                      <div
                        className="w-6 h-8 bg-gradient-to-t from-orange-600 via-yellow-400 to-red-500 rounded-t-full"
                        style={{
                          animation: "flicker 0.8s infinite",
                          animationDelay: "0.4s",
                        }}
                      ></div>
                    </div>

                    {/* Row 2 - Medium Flames (offset, sides bigger) */}
                    <div className="absolute bottom-1 left-0 right-0 flex justify-center items-end space-x-3">
                      <div
                        className="w-4 h-6 bg-gradient-to-t from-orange-500 via-yellow-300 to-red-400 rounded-t-full"
                        style={{
                          animation: "flicker 0.7s infinite",
                          animationDelay: "0.15s",
                        }}
                      ></div>
                      <div
                        className="w-2 h-4 bg-gradient-to-t from-orange-600 via-yellow-400 to-red-500 rounded-t-full"
                        style={{
                          animation: "flicker 0.6s infinite",
                          animationDelay: "0.25s",
                        }}
                      ></div>
                      <div
                        className="w-4 h-6 bg-gradient-to-t from-orange-500 via-yellow-300 to-red-400 rounded-t-full"
                        style={{
                          animation: "flicker 0.7s infinite",
                          animationDelay: "0.35s",
                        }}
                      ></div>
                    </div>

                    {/* Row 3 - Small Flames (more offset, sides bigger) */}
                    <div className="absolute bottom-2 left-0 right-0 flex justify-between items-end px-3">
                      <div
                        className="w-3 h-5 bg-gradient-to-t from-orange-400 via-yellow-200 to-red-300 rounded-t-full"
                        style={{
                          animation: "flicker 0.6s infinite",
                          animationDelay: "0.2s",
                        }}
                      ></div>
                      <div
                        className="w-1.5 h-3 bg-gradient-to-t from-orange-500 via-yellow-300 to-red-400 rounded-t-full"
                        style={{
                          animation: "flicker 0.5s infinite",
                          animationDelay: "0.3s",
                        }}
                      ></div>
                      <div
                        className="w-3 h-5 bg-gradient-to-t from-orange-400 via-yellow-200 to-red-300 rounded-t-full"
                        style={{
                          animation: "flicker 0.6s infinite",
                          animationDelay: "0.4s",
                        }}
                      ></div>
                    </div>

                    {/* Floating Embers - Full Width Distribution */}
                    <div className="absolute -top-2 left-0 right-0 flex justify-between items-center px-2">
                      <div
                        className="w-1.5 h-1.5 bg-yellow-300 rounded-full"
                        style={{
                          animation: "bounce 0.4s infinite",
                          animationDelay: "0s",
                        }}
                      ></div>
                      <div
                        className="w-1 h-1 bg-orange-400 rounded-full"
                        style={{
                          animation: "bounce 0.3s infinite",
                          animationDelay: "0.1s",
                        }}
                      ></div>
                      <div
                        className="w-0.5 h-0.5 bg-yellow-200 rounded-full"
                        style={{
                          animation: "bounce 0.5s infinite",
                          animationDelay: "0.2s",
                        }}
                      ></div>
                      <div
                        className="w-1 h-1 bg-red-400 rounded-full"
                        style={{
                          animation: "bounce 0.4s infinite",
                          animationDelay: "0.3s",
                        }}
                      ></div>
                      <div
                        className="w-1.5 h-1.5 bg-yellow-300 rounded-full"
                        style={{
                          animation: "bounce 0.3s infinite",
                          animationDelay: "0.4s",
                        }}
                      ></div>
                    </div>

                    {/* Additional Spark Layer */}
                    <div className="absolute -top-1 left-0 right-0 flex justify-center space-x-4">
                      <div
                        className="w-0.5 h-0.5 bg-yellow-200 rounded-full"
                        style={{
                          animation: "ping 0.3s infinite",
                          animationDelay: "0.1s",
                        }}
                      ></div>
                      <div
                        className="w-0.5 h-0.5 bg-orange-300 rounded-full"
                        style={{
                          animation: "ping 0.2s infinite",
                          animationDelay: "0.2s",
                        }}
                      ></div>
                      <div
                        className="w-0.5 h-0.5 bg-yellow-200 rounded-full"
                        style={{
                          animation: "ping 0.3s infinite",
                          animationDelay: "0.3s",
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Glow Effect Under Fire */}
                  <div className="absolute -bottom-1 left-0 right-0 h-2 bg-gradient-to-t from-orange-400 via-yellow-300 to-transparent rounded-full blur-sm opacity-60"></div>
                </div>
              </button>
            </div>
          </div>

          {/* My Positions Button - Between Home and Create Token */}
          {isConnected && (
            <div
              className="absolute left-1/2 transform -translate-x-1/2"
              style={{ marginLeft: "-160px" }}
            >
              <button
                style={{
                  backgroundColor: "#F6E7C1",
                  color: "#000000",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                  display: "inline-block",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#F0DDB8";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#F6E7C1";
                  e.currentTarget.style.transform = "scale(1)";
                }}
                onClick={() => (window.location.href = "/my-positions")}
              >
                Profile
              </button>
            </div>
          )}

          {/* Right Side - Connect Button */}
          <div className="flex items-center">
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}
