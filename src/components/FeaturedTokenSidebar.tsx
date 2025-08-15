"use client";

import { useReadContract } from "wagmi";
import { useRouter } from "next/navigation";
import { CONTRACTS } from "@/contracts/addresses";
import PoolManagerABI from "@/contracts/abis/PoolManager.json";
import PoolABI from "@/contracts/abis/Pool.json";

export default function FeaturedTokenSidebar() {
  const router = useRouter();

  // Get all presales
  const { data: presales } = useReadContract({
    address: CONTRACTS.POOL_MANAGER,
    abi: PoolManagerABI,
    functionName: "getAllPresales",
  });

  // Get data for up to 3 presales
  const featuredPresales =
    Array.isArray(presales) && presales.length > 0 ? presales.slice(0, 3) : [];

  // Get data for each featured presale
  const { data: presaleData1 } = useReadContract({
    address: featuredPresales[0] as `0x${string}`,
    abi: PoolABI,
    functionName: "getPoolData",
    // enabled: !!featuredPresales[0],
  });

  const { data: presaleData2 } = useReadContract({
    address: featuredPresales[1] as `0x${string}`,
    abi: PoolABI,
    functionName: "getPoolData",
    // enabled: !!featuredPresales[1],
  });

  const { data: presaleData3 } = useReadContract({
    address: featuredPresales[2] as `0x${string}`,
    abi: PoolABI,
    functionName: "getPoolData",
    // enabled: !!featuredPresales[2],
  });

  const handleParticipate = (presaleData: any, poolAddress: string) => {
    if (presaleData) {
      // Create the presale data object that matches what ParticipateForm expects
      const presaleDataObj = {
        poolAddress: poolAddress,
        tokenName: presaleData.tokenName,
        tokenSymbol: presaleData.tokenSymbol,
        presaleRate: presaleData.presaleRate.toString(),
        softcap: presaleData.softcap.toString(),
        hardcap: presaleData.hardcap.toString(),
        startTime: presaleData.startTime.toString(),
        endTime: presaleData.endTime.toString(),
        status: "Live", // Default status, you might want to calculate this based on time
      };

      // Navigate to participate page with the presale data
      const encodedData = encodeURIComponent(JSON.stringify(presaleDataObj));
      router.push(`/participate?data=${encodedData}`);
    }
  };

  if (!presales || (Array.isArray(presales) && presales.length === 0)) {
    return (
      <div className="fixed left-0 top-16 h-full w-56 bg-gradient-to-b from-orange-100 to-yellow-100 border-r border-orange-200 shadow-lg z-40 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-xl font-bold text-orange-800 mb-4">
            Featured Tokens
          </h2>
          <div className="text-center text-gray-500 text-sm">
            Loading featured tokens...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed left-0 top-16 h-full w-56 bg-gradient-to-b from-orange-100 to-yellow-100 border-r border-orange-200 shadow-lg z-40 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-xl font-bold text-orange-800 mb-4">
          Featured Tokens
        </h2>

        {/* Featured Token Cards */}
        <div className="space-y-4">
          {/* Token 1 */}
          {featuredPresales[0] && presaleData1 && (
            <div className="rounded-lg p-4 border border-orange-200 shadow-md animate-featuredWiggle relative overflow-hidden">
              <div
                className="absolute inset-0 rounded-lg"
                style={{
                  backgroundImage: 'url("/Magma Logo.svg")',
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  scale: "1.3",
                }}
              ></div>
              <div className="absolute inset-0 bg-black/30 rounded-lg"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 via-red-500/30 to-red-600/20 rounded-lg animate-pulse"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-red-400/15 rounded-lg"></div>

              <div className="relative z-10">
                <div className="text-center mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-lg font-bold animate-bounce">
                    ⭐
                  </div>
                  <h3 className="text-base font-bold text-white">
                    Featured #1
                  </h3>
                </div>

                <div className="space-y-2">
                  <div className="text-xs">
                    <span className="text-white">Token:</span>
                    <div className="font-semibold text-sm text-white p-1.5 rounded mt-1">
                      {(presaleData1 as any)?.tokenName ?? "N/A"}
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={() =>
                        handleParticipate(presaleData1, featuredPresales[0])
                      }
                      className="px-3 py-1.5 rounded text-xs font-semibold transition-all duration-300 text-white animate-pulse cursor-pointer relative overflow-hidden"
                      style={{
                        backgroundImage: 'url("/MagmaBannerBackground.jpg")',
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      {/* Dark overlay for better text readability */}
                      <div className="absolute inset-0 bg-black/30"></div>
                      <div className="relative z-10">Participate Now</div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="absolute -inset-1 bg-gradient-to-r from-red-400 via-red-500 to-red-600 rounded-lg blur opacity-25 animate-ping"></div>
              <div className="absolute -inset-2 bg-gradient-to-r from-red-300 via-red-400 to-red-500 rounded-lg blur opacity-15 animate-pulse"></div>
            </div>
          )}

          {/* Token 2 */}
          {featuredPresales[1] && presaleData2 && (
            <div className="rounded-lg p-4 border border-orange-200 shadow-md relative overflow-hidden">
              <div
                className="absolute inset-0 rounded-lg"
                style={{
                  backgroundImage: 'url("/Magma Logo.svg")',
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  scale: "1.3",
                }}
              ></div>
              <div className="absolute inset-0 bg-black/30 rounded-lg"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-blue-500/30 to-blue-600/20 rounded-lg animate-pulse"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-blue-400/15 rounded-lg"></div>

              <div className="relative z-10">
                <div className="text-center mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-lg font-bold animate-bounce">
                    🚀
                  </div>
                  <h3 className="text-base font-bold text-white">
                    Featured #2
                  </h3>
                </div>

                <div className="space-y-2">
                  <div className="text-xs">
                    <span className="text-white">Token:</span>
                    <div className="font-semibold text-sm text-white p-1.5 rounded mt-1">
                      {(presaleData2 as any)?.tokenName ?? "N/A"}
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={() =>
                        handleParticipate(presaleData2, featuredPresales[1])
                      }
                      className="px-3 py-1.5 rounded text-xs font-semibold transition-all duration-300 text-white animate-pulse cursor-pointer relative overflow-hidden"
                      style={{
                        backgroundImage: 'url("/MagmaBannerBackground.jpg")',
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      {/* Dark overlay for better text readability */}
                      <div className="absolute inset-0 bg-black/30"></div>
                      <div className="relative z-10">Participate Now</div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 rounded-lg blur opacity-25 animate-ping"></div>
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-300 via-blue-400 to-blue-500 rounded-lg blur opacity-15 animate-pulse"></div>
            </div>
          )}

          {/* Token 3 */}
          {featuredPresales[2] && presaleData3 && (
            <div className="rounded-lg p-4 border border-orange-200 shadow-md relative overflow-hidden">
              <div
                className="absolute inset-0 rounded-lg"
                style={{
                  backgroundImage: 'url("/Magma Logo.svg")',
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  scale: "1.3",
                }}
              ></div>
              <div className="absolute inset-0 bg-black/30 rounded-lg"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-green-500/30 to-green-600/20 rounded-lg animate-pulse"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-green-400/15 rounded-lg"></div>

              <div className="relative z-10">
                <div className="text-center mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-500 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-lg font-bold animate-bounce">
                    💎
                  </div>
                  <h3 className="text-base font-bold text-white">
                    Featured #3
                  </h3>
                </div>

                <div className="space-y-2">
                  <div className="text-xs">
                    <span className="text-white">Token:</span>
                    <div className="font-semibold text-sm text-white p-1.5 rounded mt-1">
                      {(presaleData3 as any)?.tokenName ?? "N/A"}
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={() =>
                        handleParticipate(presaleData3, featuredPresales[2])
                      }
                      className="px-3 py-1.5 rounded text-xs font-semibold transition-all duration-300 text-white animate-pulse cursor-pointer relative overflow-hidden"
                      style={{
                        backgroundImage: 'url("/MagmaBannerBackground.jpg")',
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      {/* Dark overlay for better text readability */}
                      <div className="absolute inset-0 bg-black/30"></div>
                      <div className="relative z-10">Participate Now</div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="absolute -inset-1 bg-gradient-to-r from-green-400 via-green-500 to-green-600 rounded-lg blur opacity-25 animate-ping"></div>
              <div className="absolute -inset-2 bg-gradient-to-r from-green-300 via-green-400 to-green-500 rounded-lg blur opacity-15 animate-pulse"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
