"use client";

import { useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { parseEther } from "viem";
import { useEffect } from "react";

// PoolManager ABI - only the functions we need
const POOL_MANAGER_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "token", type: "address" },
          { internalType: "uint256", name: "presaleRate", type: "uint256" },
          { internalType: "uint256", name: "softcap", type: "uint256" },
          { internalType: "uint256", name: "hardcap", type: "uint256" },
          { internalType: "uint256", name: "liquidityRate", type: "uint256" },
          { internalType: "uint256", name: "listingRate", type: "uint256" },
          { internalType: "uint256", name: "startTime", type: "uint256" },
          { internalType: "uint256", name: "endTime", type: "uint256" },
          { internalType: "bool", name: "refund", type: "bool" },
          { internalType: "string", name: "tokenName", type: "string" },
          { internalType: "string", name: "tokenSymbol", type: "string" },
        ],
        internalType: "struct Presale",
        name: "newPresale",
        type: "tuple",
      },
    ],
    name: "createPresale",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const POOL_MANAGER_ADDRESS = "0x7173B2EA0C27Fa242B441Da725e0bE8F342Add80";

export default function CreateCoinForm() {
  const { isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [formData, setFormData] = useState({
    tokenName: "",
    tokenSymbol: "",
    presaleRate: "",
    softcap: "",
    hardcap: "",
    startTime: "",
    endTime: "",
    minBuy: "",
    maxBuy: "",
    description: "",
    website: "",
    telegram: "",
    twitter: "",
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess,
    data: receipt,
  } = useWaitForTransactionReceipt({ hash });

  // Save metadata when transaction is successful
  useEffect(() => {
    if (isSuccess && hash && receipt && imageUrl) {
      const saveMetadata = async () => {
        try {
          console.log("Transaction receipt:", receipt);
          console.log("Transaction logs:", receipt.logs);

          // Look for PresaleCreated event in the logs
          let poolAddress = null;

          console.log(
            "🔍 Looking for PoolManager logs to extract pool address..."
          );

          for (const log of receipt.logs) {
            console.log("Log:", log);

            // Look for logs from the PoolManager contract
            if (
              log.address?.toLowerCase() ===
              "0x7173B2EA0C27Fa242B441Da725e0bE8F342Add80".toLowerCase()
            ) {
              console.log("Found log from PoolManager contract");
              console.log("Topics count:", log.topics?.length);
              console.log("First topic:", log.topics?.[0]);

              // The PoolManager log contains the return value from createPresale
              // The first 32 bytes (66 chars including 0x) contain the presale address
              if (log.data && log.data !== "0x" && log.data.length >= 66) {
                console.log(
                  "🔍 Extracting pool address from data field:",
                  log.data
                );

                // Extract the first 32 bytes (after 0x) which contain the presale address
                const firstParam = log.data.slice(2, 66); // Remove 0x and get first 32 bytes
                if (firstParam.length === 64) {
                  // The presale address is the first parameter, extract the last 20 bytes
                  poolAddress = "0x" + firstParam.slice(-40);
                  console.log(
                    "✅ Extracted pool address from data field:",
                    poolAddress
                  );
                  break;
                }
              }
            }
          }

          // Fallback: use transaction hash if we can't extract pool address
          if (!poolAddress) {
            console.warn(
              "Could not extract pool address from receipt, using hash as fallback"
            );
            poolAddress = hash;
          }

          // Additional debugging: log all topics from PoolManager logs
          console.log("🔍 Debugging: All PoolManager logs:");
          for (const log of receipt.logs) {
            if (
              log.address?.toLowerCase() ===
              "0x7173B2EA0C27Fa242B441Da725e0bE8F342Add80".toLowerCase()
            ) {
              console.log("PoolManager log:", {
                address: log.address,
                topics: log.topics,
                data: log.data,
              });
            }
          }

          console.log("✅ Saving metadata for pool address:", poolAddress);
          console.log("📸 Image URL:", imageUrl);
          console.log("🏷️ Token name:", formData.tokenName);

          const metadataResponse = await fetch("/api/token-metadata", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contractAddress: poolAddress,
              name: formData.tokenName,
              symbol: formData.tokenSymbol,
              imageUrl: imageUrl,
              description: formData.description,
              website: formData.website,
              telegram: formData.telegram,
              twitter: formData.twitter,
            }),
          });

          if (metadataResponse.ok) {
            console.log(
              "✅ Metadata saved successfully for address:",
              poolAddress
            );
          } else {
            const errorText = await metadataResponse.text();
            console.error("❌ Failed to save metadata:", errorText);
          }
        } catch (error) {
          console.error("Failed to save metadata:", error);
        }
      };

      saveMetadata();
    }
  }, [isSuccess, hash, receipt, imageUrl, formData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Vercel Blob
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setImageUrl(result.url);
      } else {
        alert("Upload failed: " + result.error);
        setImagePreview("");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Please try again.");
      setImagePreview("");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    setIsLoading(true);

    try {
      // Convert form data to contract parameters
      const startTime = Math.floor(
        new Date(formData.startTime).getTime() / 1000
      );
      const endTime = Math.floor(new Date(formData.endTime).getTime() / 1000);

      // Validate times
      if (startTime <= Math.floor(Date.now() / 1000)) {
        alert("Start time must be in the future");
        setIsLoading(false);
        return;
      }

      if (endTime <= startTime) {
        alert("End time must be after start time");
        setIsLoading(false);
        return;
      }

      // Calculate listing rate as 80% of presale rate (standard practice)
      const presaleRate = BigInt(formData.presaleRate);
      const listingRate = (presaleRate * BigInt(80)) / BigInt(100); // 80% of presale rate

      // Create presale object for contract
      const presaleData = {
        token: "0x0000000000000000000000000000000000000000", // Will be set by contract
        presaleRate: presaleRate,
        softcap: parseEther(formData.softcap),
        hardcap: parseEther(formData.hardcap),
        liquidityRate: BigInt(0), // Set to 0 since it's not used by the contract
        listingRate: listingRate,
        startTime: BigInt(startTime),
        endTime: BigInt(endTime),
        refund: true, // Enable refunds
        tokenName: formData.tokenName,
        tokenSymbol: formData.tokenSymbol,
      };

      console.log("Creating presale with data:", presaleData);

      // Call the contract
      writeContract({
        address: POOL_MANAGER_ADDRESS,
        abi: POOL_MANAGER_ABI,
        functionName: "createPresale",
        args: [
          {
            ...presaleData,
            token: presaleData.token as `0x${string}`,
          },
        ],
      });
    } catch (error) {
      console.error("Error creating presale:", error);
      alert("Error creating presale. Please check your input and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate listing rate for display
  const calculatedListingRate = formData.presaleRate
    ? (Number(formData.presaleRate) * 80) / 100
    : 0;

  // Show success state when transaction is successful
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Presale Created Successfully!
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your token presale has been deployed to the blockchain and is now
              live.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Presale Deployed!
              </h2>
              <p className="text-gray-600 mb-6">
                Your presale is now active and ready to accept contributions.
              </p>
            </div>

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

            <div className="space-y-4">
              <button
                onClick={() => window.location.reload()}
                className="text-white font-bold py-3 px-6 rounded-lg transition-colors relative overflow-hidden cursor-pointer hover:cursor-pointer"
                style={{
                  backgroundImage: 'url("/MagmaBannerBackground.jpg")',
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {/* Dark overlay for better text readability */}
                <div className="absolute inset-0 bg-black/30"></div>

                <div className="relative z-10">Create Another Presale</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 py-12 px-4 sm:px-6 lg:px-8 animate-fadeInUp">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Create Your Token
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Launch your token with a professional presale. Set up your project
            details, configure the presale parameters, and start raising funds.
          </p>
        </div>

        {/* Transaction Status */}
        {(isPending || isConfirming) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
              <div>
                <p className="text-blue-800 font-medium">
                  {isPending
                    ? "Confirming transaction..."
                    : "Processing transaction..."}
                </p>
                {hash && (
                  <p className="text-blue-600 text-sm">
                    Hash: {hash.slice(0, 10)}...{hash.slice(-8)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Token Information */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Token Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Token Name *
                  </label>
                  <input
                    type="text"
                    name="tokenName"
                    value={formData.tokenName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-700"
                    placeholder="e.g., My Awesome Token"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Token Symbol *
                  </label>
                  <input
                    type="text"
                    name="tokenSymbol"
                    value={formData.tokenSymbol}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-700"
                    placeholder="e.g., MAT"
                    required
                  />
                </div>

                {/* Token Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Token Logo
                  </label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 text-gray-700"
                      disabled={isUploadingImage}
                    />

                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="flex items-center space-x-3">
                        <img
                          src={imagePreview}
                          alt="Token logo preview"
                          className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                        />
                        {isUploadingImage ? (
                          <span className="text-sm text-gray-500">
                            Uploading...
                          </span>
                        ) : imageUrl ? (
                          <span className="text-sm text-green-600">
                            ✓ Uploaded successfully
                          </span>
                        ) : null}
                      </div>
                    )}

                    <p className="text-xs text-gray-500">
                      Optional. Recommended size: 256x256px. Max file size: 5MB.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Presale Configuration */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Presale Configuration
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Presale Rate (tokens per Core) *
                  </label>
                  <input
                    type="number"
                    name="presaleRate"
                    value={formData.presaleRate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-700"
                    placeholder="e.g., 10000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Soft Cap (Core) *
                  </label>
                  <input
                    type="number"
                    name="softcap"
                    value={formData.softcap}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-700"
                    placeholder="e.g., 10"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hard Cap (Core) *
                  </label>
                  <input
                    type="number"
                    name="hardcap"
                    value={formData.hardcap}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-700"
                    placeholder="e.g., 100"
                    required
                  />
                </div>
              </div>

              {/* Auto-calculated Listing Rate Display */}
              {formData.presaleRate && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-800">
                      Listing Rate (Auto-calculated):
                    </span>
                    <span className="text-sm font-bold text-blue-900">
                      {calculatedListingRate.toLocaleString()} tokens per Core
                      (80% of presale rate)
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    This is the rate at which tokens will be added to liquidity
                    when the presale is finalized.
                  </p>
                </div>
              )}
            </div>

            {/* Presale Timeline */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Presale Timeline
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Investment Limits */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Investment Limits
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Buy (Core) *
                  </label>
                  <input
                    type="number"
                    name="minBuy"
                    value={formData.minBuy}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-700"
                    placeholder="e.g., 0.1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Buy (Core) *
                  </label>
                  <input
                    type="number"
                    name="maxBuy"
                    value={formData.maxBuy}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-700"
                    placeholder="e.g., 10"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center">
              {isConnected ? (
                <button
                  type="submit"
                  disabled={isPending || isConfirming || isLoading}
                  className={`font-bold py-4 px-8 rounded-lg text-lg transition-colors shadow-lg relative overflow-hidden cursor-pointer hover:cursor-pointer ${
                    isPending || isConfirming || isLoading
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "text-white"
                  }`}
                  style={
                    !isPending && !isConfirming && !isLoading
                      ? {
                          backgroundImage: 'url("/MagmaBannerBackground.jpg")',
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : {}
                  }
                >
                  {/* Dark overlay for better text readability */}
                  {!isPending && !isConfirming && !isLoading && (
                    <div className="absolute inset-0 bg-black/30"></div>
                  )}

                  <div className="relative z-10">
                    {isPending || isConfirming || isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        {isPending ? "Confirming..." : "Creating Presale..."}
                      </div>
                    ) : (
                      "Create Presale"
                    )}
                  </div>
                </button>
              ) : (
                <div className="flex flex-col items-center space-y-4">
                  <p className="text-gray-600 text-lg">
                    Connect your wallet to create a presale
                  </p>
                  <ConnectButton />
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
