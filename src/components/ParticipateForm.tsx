"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { useRouter } from "next/navigation";
import PoolABI from "../contracts/abis/Pool.json";
import FeaturedTokensCarousel from "./FeaturedTokensCarousel"; // Import the smooth carousel
import TransactionList from "./TransactionList";
import SwapInterface from "./SwapInterface";

interface ParticipateFormProps {
  presale: {
    poolAddress: string;
    tokenName: string;
    tokenSymbol: string;
    presaleRate: string;
    softcap: string;
    hardcap: string;
    startTime: string;
    endTime: string;
    status: string;
  };
}

export default function ParticipateForm({ presale }: ParticipateFormProps) {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [presaleStatus, setPresaleStatus] = useState<any>(null);
  const [tokenImage, setTokenImage] = useState<string>("");
  const { address, isConnected } = useAccount();
  const router = useRouter();

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Read presale stats to check if it's finalized
  const { data: presaleStats } = useReadContract({
    address: presale.poolAddress as `0x${string}`,
    abi: PoolABI,
    functionName: "_presaleStats", // ✅ CORRECT
  });

  // Read pool data to get token address
  const { data: poolData } = useReadContract({
    address: presale.poolAddress as `0x${string}`,
    abi: PoolABI,
    functionName: "getPoolData",
  });

  useEffect(() => {
    if (presaleStats) {
      setPresaleStatus(presaleStats);
    }
  }, [presaleStats]);

  // Fetch token image from metadata
  useEffect(() => {
    const fetchTokenImage = async () => {
      try {
        const response = await fetch(
          `/api/token-metadata?address=${presale.poolAddress}`
        );
        if (response.ok) {
          const metadata = await response.json();
          setTokenImage(metadata.imageUrl || "");
        }
      } catch (error) {
        console.error("Failed to fetch token image:", error);
      }
    };

    if (presale.poolAddress) {
      fetchTokenImage();
    }
  }, [presale.poolAddress]);

  const formatRate = (rate: string) => {
    const rateNumber = Number(rate);
    return rateNumber.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    });
  };

  const formatAmount = (amount: string) => {
    return formatEther(BigInt(amount));
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const checkPresaleStatus = () => {
    const now = Math.floor(Date.now() / 1000);
    const startTime = Number(presale.startTime);
    const endTime = Number(presale.endTime);

    console.log("Presale status check:", {
      now,
      startTime,
      endTime,
      isFinalized: presaleStatus?.isFinalized,
      totalContributed: presaleStatus?.totalContributed,
      hardcap: presale.hardcap,
    });

    if (presaleStatus?.isFinalized) {
      return "Presale is already finalized";
    }

    if (now < startTime) {
      return "Presale has not started yet";
    }

    if (now > endTime) {
      return "Presale has ended";
    }

    if (presaleStatus?.totalContributed && presale.hardcap) {
      const remaining =
        BigInt(presale.hardcap) - BigInt(presaleStatus.totalContributed);
      if (remaining <= 0n) {
        return "Presale hardcap has been reached";
      }
    }

    return null; // Presale is active
  };

  const handleParticipate = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const statusError = checkPresaleStatus();
    if (statusError) {
      alert(statusError);
      return;
    }

    try {
      setIsLoading(true);

      console.log("Attempting to contribute:", {
        address: presale.poolAddress,
        amount: parseEther(amount),
        abi: PoolABI,
      });

      writeContract({
        address: presale.poolAddress as `0x${string}`,
        abi: PoolABI,
        functionName: "contribute",
        value: parseEther(amount),
      });
    } catch (error) {
      console.error("Error contributing:", error);
      alert("Failed to contribute. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/");
  };

  const calculateTokensToReceive = () => {
    if (!amount || parseFloat(amount) <= 0) return "0";
    const coreAmount = parseFloat(amount);
    const rate = Number(presale.presaleRate);
    const tokensToReceive = coreAmount * rate;
    return tokensToReceive.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    });
  };

  const statusError = checkPresaleStatus();

  // Add this function to determine the real status
  const getRealPresaleStatus = () => {
    if (presaleStatus?.isFinalized) {
      return "Finalized";
    }

    if (!presaleStatus) {
      return presale.status; // Fallback while loading
    }

    const now = Math.floor(Date.now() / 1000);
    const startTime = Number(presale.startTime);
    const endTime = Number(presale.endTime);

    if (now < startTime) {
      return "Upcoming";
    }

    if (now > endTime) {
      return "Ended";
    }

    if (presaleStatus.totalContributed && presale.hardcap) {
      const remaining =
        BigInt(presale.hardcap) - BigInt(presaleStatus.totalContributed);
      if (remaining <= 0n) {
        return "Hardcap Reached";
      }
    }

    return "Live";
  };

  // Update the button disabled logic
  const isPresaleActive = getRealPresaleStatus() === "Live";
  const shouldDisableButton =
    !amount ||
    parseFloat(amount) <= 0 ||
    isPending ||
    isConfirming ||
    !isPresaleActive;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 pb-12">
      {/* Featured Tokens Sidebar - Left Side */}
      <FeaturedTokensCarousel />

      {/* Main Content - Centered */}
      <div className="px-2 sm:px-4 lg:px-6">
        {" "}
        {/* Reduced padding to extend closer to edges */}
        <div className="w-full">
          {" "}
          {/* Removed max-width constraint to use full width */}
          {/* Header */}
          <div className="text-center mb-8">
            <button
              onClick={handleBack}
              className="mb-4 text-orange-600 hover:text-orange-700 font-medium"
            >
              ← Back to Launchpad
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {presaleStatus?.isFinalized
                ? `Swap ${presale.tokenName}`
                : `Participate in ${presale.tokenName}`}
            </h1>
            <p className="text-gray-600">
              {presaleStatus?.isFinalized
                ? `Trade ${presale.tokenSymbol} tokens on Core Launchpad`
                : `Contribute Core tokens to receive ${presale.tokenSymbol}`}
            </p>
          </div>
          {/* Conditional Rendering: Contribute Form or Swap Interface */}
          {presaleStatus?.isFinalized ? (
            // Show Swap Interface for finalized presales
            <SwapInterface
              poolAddress={presale.poolAddress}
              tokenName={presale.tokenName}
              tokenSymbol={presale.tokenSymbol}
              tokenAddress={(poolData as any)?.token || ""}
            />
          ) : (
            // Show Contribute Form for active presales
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Side - Token Data */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      {/* Token Image */}
                      {tokenImage ? (
                        <img
                          src={tokenImage}
                          alt="Token logo"
                          className="w-16 h-16 rounded-full object-cover border-2 border-orange-200 shadow-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg">
                          ⭐
                        </div>
                      )}

                      {/* Token Name */}
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          {presale.tokenName}
                        </h2>
                        <p className="text-sm text-gray-600">
                          {presale.tokenSymbol}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                        getRealPresaleStatus() === "Live"
                          ? "bg-green-100 text-green-800"
                          : getRealPresaleStatus() === "Finalized"
                          ? "bg-red-100 text-red-800"
                          : getRealPresaleStatus() === "Ended"
                          ? "bg-yellow-100 text-yellow-800"
                          : getRealPresaleStatus() === "Upcoming"
                          ? "bg-blue-100 text-blue-800"
                          : getRealPresaleStatus() === "Hardcap Reached"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {getRealPresaleStatus()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Rate:</span>
                      <span className="text-gray-900 font-semibold ml-2">
                        1 Core = {formatRate(presale.presaleRate)}{" "}
                        {presale.tokenSymbol}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Soft Cap:</span>
                      <span className="text-gray-900 font-semibold ml-2">
                        {formatAmount(presale.softcap)} Core
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Hard Cap:</span>
                      <span className="text-gray-900 font-semibold ml-2">
                        {formatAmount(presale.hardcap)} Core
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Start Time:</span>
                      <span className="text-gray-900 font-semibold ml-2">
                        {formatDateTime(presale.startTime)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">End Time:</span>
                      <span className="text-gray-900 font-semibold ml-2">
                        {formatDateTime(presale.endTime)}
                      </span>
                    </div>
                    {presaleStatus && (
                      <>
                        <div>
                          <span className="text-gray-600">
                            Total Contributed:
                          </span>
                          <span className="text-gray-900 font-semibold ml-2">
                            {formatAmount(presaleStatus.totalContributed)} Core
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Status Error */}
                  {statusError && (
                    <div className="mt-4 inline-block bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <p className="text-sm text-red-800">{statusError}</p>
                    </div>
                  )}
                </div>

                {/* Right Side - Contribute Form */}
                <div className="lg:w-96">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    Contribute Core Tokens
                  </h3>

                  {!isConnected ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">
                        Please connect your wallet to participate
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Amount Input */}
                      <div>
                        <label
                          htmlFor="amount"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Amount (Core)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            id="amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.0"
                            min="0"
                            step="0.01"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            disabled={
                              isPending || isConfirming || !!statusError
                            }
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            Core
                          </div>
                        </div>
                      </div>

                      {/* Tokens to Receive */}
                      {amount && parseFloat(amount) > 0 && (
                        <div className="bg-orange-50 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700">
                              You will receive:
                            </span>
                            <span
                              className="font-bold"
                              style={{
                                backgroundImage:
                                  'url("/MagmaBannerBackground.jpg")',
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                              }}
                            >
                              {calculateTokensToReceive()} {presale.tokenSymbol}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Debug Info */}
                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <p className="text-sm text-red-800">
                            Error: {error.message}
                          </p>
                        </div>
                      )}

                      {/* Participate Button */}
                      <button
                        onClick={handleParticipate}
                        disabled={shouldDisableButton}
                        className={`w-full py-3 px-6 rounded-lg font-bold transition-colors relative overflow-hidden ${
                          shouldDisableButton
                            ? "bg-gray-400 text-white cursor-not-allowed"
                            : "text-white cursor-pointer hover:opacity-90"
                        }`}
                        style={
                          !shouldDisableButton
                            ? {
                                backgroundImage:
                                  'url("/MagmaBannerBackground.jpg")',
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }
                            : {}
                        }
                      >
                        {/* Dark overlay for better text readability */}
                        {!shouldDisableButton && (
                          <div className="absolute inset-0 bg-black/30"></div>
                        )}

                        <div className="relative z-10 flex items-center justify-center">
                          {(isPending || isConfirming) && (
                            <svg
                              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                          )}
                          {isPending
                            ? "Confirming..."
                            : isConfirming
                            ? "Processing..."
                            : !isPresaleActive
                            ? getRealPresaleStatus()
                            : "Participate"}
                        </div>
                      </button>

                      {/* Transaction Status */}
                      {isSuccess && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <svg
                                className="h-5 w-5 text-green-400"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-green-800">
                                Transaction successful! You have successfully
                                contributed to the presale.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Transaction Hash */}
                      {hash && (
                        <div className="bg-blue-50 border text-center border-blue-200 text-wrap rounded-lg p-4">
                          <a
                            href={`https://scan.coredao.org/tx/${hash}`}
                            target="_blank"
                            className="w-full text-sm text-center text-blue-800 text-wrap underline"
                          >
                            Transaction on explorer
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Transaction List */}
          <TransactionList
            poolAddress={presale.poolAddress}
            tokenSymbol={presale.tokenSymbol}
          />
        </div>
      </div>
    </div>
  );
}
