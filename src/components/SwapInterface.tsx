"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import PoolABI from "@/contracts/abis/Pool.json";

// Uniswap V2 Router ABI for getAmountsOut and swap functions
const ROUTER_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amountIn",
        "type": "uint256"
      },
      {
        "internalType": "address[]",
        "name": "path",
        "type": "address[]"
      }
    ],
    "name": "getAmountsOut",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "amounts",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amountIn",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "amountOutMin",
        "type": "uint256"
      },
      {
        "internalType": "address[]",
        "name": "path",
        "type": "address[]"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      }
    ],
    "name": "swapExactTokensForETH",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "amounts",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amountIn",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "amountOutMin",
        "type": "uint256"
      },
      {
        "internalType": "address[]",
        "name": "path",
        "type": "address[]"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      }
    ],
    "name": "swapExactTokensForTokens",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "amounts",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amountOutMin",
        "type": "uint256"
      },
      {
        "internalType": "address[]",
        "name": "path",
        "type": "address[]"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      }
    ],
    "name": "swapExactETHForTokens",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "amounts",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  }
] as const;

interface SwapInterfaceProps {
  poolAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenAddress: string;
}

export default function SwapInterface({ poolAddress, tokenName, tokenSymbol, tokenAddress }: SwapInterfaceProps) {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [swapDirection, setSwapDirection] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [amountOut, setAmountOut] = useState<string>("0");

  // State for approval
  const [needsApproval, setNeedsApproval] = useState(false);
  const [approvalAmount, setApprovalAmount] = useState<string>("0");

  // Write contract hook for swap transactions
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });



  // Hardcoded addresses
  const WCORE_ADDRESS = "0x40375c92d9faf44d2f9db9bd9ba41a3317a2404f";
  const ROUTER_ADDRESS = "0xBb5e1777A331ED93E07cF043363e48d320eb96c4";

  // Get pool data to check if finalized
  const { data: poolData } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: PoolABI,
    functionName: 'getPoolData',
  });

  // Function to approve tokens
  const handleApprove = async () => {
    if (!isConnected || !publicClient || !tokenAddress) {
      alert("Please connect your wallet first");
      return false;
    }

    try {
      console.log("🔐 Approving tokens for router...");
      
      // Call approve function on the token contract
      const result = await writeContract({
        address: tokenAddress as `0x${string}`,
        abi: [
          {
            "inputs": [
              {"internalType": "address", "name": "spender", "type": "address"},
              {"internalType": "uint256", "name": "amount", "type": "uint256"}
            ],
            "name": "approve",
            "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        functionName: 'approve',
        args: [
          ROUTER_ADDRESS as `0x${string}`,
          parseEther(approvalAmount)
        ],
      });
      
      console.log("🔐 Approval transaction sent:", result);
      
      // Wait for the approval transaction to be confirmed
      console.log("⏳ Waiting for approval confirmation...");
      await new Promise((resolve) => {
        const checkApproval = async () => {
          try {
            const newAllowance = await publicClient.readContract({
              address: tokenAddress as `0x${string}`,
              abi: [
                {
                  "inputs": [
                    {"internalType": "address", "name": "owner", "type": "address"},
                    {"internalType": "address", "name": "spender", "type": "address"}
                  ],
                  "name": "allowance",
                  "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                  "stateMutability": "view",
                  "type": "function"
                }
              ],
              functionName: 'allowance',
              args: [address as `0x${string}`, ROUTER_ADDRESS as `0x${string}`],
            });
            
            const amountToApprove = parseEther(approvalAmount);
            if (newAllowance >= amountToApprove) {
              console.log("✅ Approval confirmed on blockchain!");
              resolve(true);
            } else {
              // Check again in 1 second
              setTimeout(checkApproval, 1000);
            }
          } catch (error) {
            console.error("Error checking approval status:", error);
            resolve(false);
          }
        };
        
        // Start checking after 2 seconds
        setTimeout(checkApproval, 2000);
      });
      
      return true;
      
    } catch (error) {
      console.error("Error approving tokens:", error);
      alert("Approval failed. Please try again.");
      return false;
    }
  };

  const handleSwap = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (!publicClient) {
      alert("Blockchain connection not available");
      return;
    }

    console.log("🚀 handleSwap called with:", {
      swapDirection,
      needsApproval,
      amount,
      tokenAddress
    });

    // For selling tokens, check and handle approval if needed
    if (swapDirection === "sell") {
      try {
        console.log("🔍 Checking approval status...");
        const allowance = await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: [
            {
              "inputs": [
                {"internalType": "address", "name": "owner", "type": "address"},
                {"internalType": "address", "name": "spender", "type": "address"}
              ],
              "name": "allowance",
              "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
              "stateMutability": "view",
              "type": "function"
            }
          ],
          functionName: 'allowance',
          args: [address as `0x${string}`, ROUTER_ADDRESS as `0x${string}`],
        });
        
        const amountToApprove = parseEther(amount);
        console.log("🔐 Current allowance:", formatEther(allowance), "Amount needed:", amount);
        
                if (allowance < amountToApprove) {
          console.log("⚠️ Insufficient allowance, approving first...");
          
          // Call approve and wait for the transaction to be confirmed
          const approveResult = await handleApprove();
          
          if (!approveResult) {
            console.log("❌ Approval failed, cannot proceed");
            alert("Token approval failed. Please try again.");
            return;
          }
          
          console.log("✅ Approval successful, proceeding with swap...");
        }
      } catch (error) {
        console.error("Error checking/handling approval:", error);
        alert("Could not verify token approval. Please try again.");
        return;
      }
    }

    try {
      setIsLoading(true);
      
      console.log("🚀 Starting swap execution...");
      console.log("📊 Swap details:", {
        direction: swapDirection,
        amount: amount,
        tokenAddress: tokenAddress,
        wcoreAddress: WCORE_ADDRESS,
        routerAddress: ROUTER_ADDRESS,
        userAddress: address
      });
      
      // Convert amount to wei (18 decimals)
      const amountInWei = parseEther(amount);
      console.log("💰 Amount in wei:", amountInWei.toString());
      
      // Calculate minimum amount out based on slippage
      const slippage = 5; // Default 5% slippage
      // Convert amountOut to wei first, then apply slippage
      const amountOutWei = parseEther(amountOut);
      const minAmountOut = (amountOutWei * BigInt(100 - slippage)) / BigInt(100);
      console.log("📉 Min amount out:", minAmountOut.toString());
      
      // Determine the path based on swap direction
      let path: `0x${string}`[];
      if (swapDirection === "buy") {
        // Buy tokens: Core -> Token (using WETH address for path, but sending native ETH)
        path = [WCORE_ADDRESS as `0x${string}`, tokenAddress as `0x${string}`];
      } else {
        // Sell tokens: Token -> Core (using WETH address for path, but receiving native ETH)
        path = [tokenAddress as `0x${string}`, WCORE_ADDRESS as `0x${string}`];
      }
      console.log("🛤️ Swap path:", path);
      
      // Set deadline to current block timestamp + 30 seconds
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 30);
      console.log("⏰ Deadline:", deadline.toString());
      
      console.log("📝 Calling writeContract with args:", [
        amountInWei.toString(),
        minAmountOut.toString(),
        path,
        address,
        deadline.toString()
      ]);

      // Execute the swap based on direction
      if (swapDirection === "buy") {
        // Buy tokens: Core -> Token (use swapExactETHForTokens)
        console.log("🟢 Executing buy swap with swapExactETHForTokens");
        writeContract({
          address: ROUTER_ADDRESS as `0x${string}`,
          abi: ROUTER_ABI,
          functionName: 'swapExactETHForTokens',
          args: [
            minAmountOut,
            path,
            address as `0x${string}`, // recipient address
            deadline
          ],
          value: amountInWei, // Send Core ETH with the transaction
        });
      } else {
        // Sell tokens: Token -> Core (use swapExactTokensForETH)
        console.log("🔴 Executing sell swap with swapExactTokensForETH");
        writeContract({
          address: ROUTER_ADDRESS as `0x${string}`,
          abi: ROUTER_ABI,
          functionName: 'swapExactTokensForETH',
          args: [
            amountInWei,
            minAmountOut,
            path,
            address as `0x${string}`, // recipient address
            deadline
          ],
        });
      }

    } catch (error) {
      console.error("❌ Error during swap:", error);
      alert(`Swap failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get swap amounts from Uniswap V2 router
  const getSwapAmounts = async (amountIn: string, direction: "buy" | "sell") => {
    if (!amountIn || parseFloat(amountIn) <= 0 || !publicClient) {
      setAmountOut("0");
      return;
    }

    try {
      // Convert amount to wei (18 decimals)
      const amountInWei = parseEther(amountIn);
      
      // Determine the path based on swap direction
      let path: `0x${string}`[];
      if (direction === "buy") {
        // Buy tokens: Core -> Token (using WETH address for path, but sending native ETH)
        path = [WCORE_ADDRESS as `0x${string}`, tokenAddress as `0x${string}`];
      } else {
        // Sell tokens: Token -> Core (using WETH address for path, but receiving native ETH)
        path = [tokenAddress as `0x${string}`, WCORE_ADDRESS as `0x${string}`];
      }

      // Call getAmountsOut on the router
      const amounts = await publicClient.readContract({
        address: ROUTER_ADDRESS as `0x${string}`,
        abi: ROUTER_ABI,
        functionName: 'getAmountsOut',
        args: [amountInWei, path],
      });

      if (amounts && amounts.length >= 2) {
        // amounts[0] is amount in, amounts[1] is amount out
        const outputAmount = formatEther(amounts[1]);
        setAmountOut(outputAmount);
      } else {
        setAmountOut("0");
      }
    } catch (error) {
      console.error("Error getting swap amounts:", error);
      setAmountOut("0");
    }
  };

  // Update amounts when amount or direction changes
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      getSwapAmounts(amount, swapDirection);
    } else {
      setAmountOut("0");
    }
  }, [amount, swapDirection, tokenAddress]);

  // Check if liquidity pair exists and get token balances
  useEffect(() => {
    const checkLiquidityPair = async () => {
      if (!publicClient || !tokenAddress || !address) return;
      
      try {
        // Try to get amounts for a small amount to check if pair exists
        const testAmount = parseEther("0.001");
        const testPath = [WCORE_ADDRESS as `0x${string}`, tokenAddress as `0x${string}`];
        
        const amounts = await publicClient.readContract({
          address: ROUTER_ADDRESS as `0x${string}`,
          abi: ROUTER_ABI,
          functionName: 'getAmountsOut',
          args: [testAmount, testPath],
        });
        
        console.log("✅ Liquidity pair exists, test amounts:", amounts);
        
        // Check Core ETH balance (for buy operations)
        const coreBalance = await publicClient.getBalance({ address: address as `0x${string}` });
        console.log("💰 Core ETH Balance:", formatEther(coreBalance));
        
        // Check token balance and approval (if selling)
        if (swapDirection === "sell") {
          try {
            const [tokenBalance, allowance] = await Promise.all([
              publicClient.readContract({
                address: tokenAddress as `0x${string}`,
                abi: [
                  {
                    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
                    "name": "balanceOf",
                    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                    "stateMutability": "view",
                    "type": "function"
                  }
                ],
                functionName: 'balanceOf',
                args: [address as `0x${string}`],
              }),
              publicClient.readContract({
                address: tokenAddress as `0x${string}`,
                abi: [
                  {
                    "inputs": [
                      {"internalType": "address", "name": "owner", "type": "address"},
                      {"internalType": "address", "name": "spender", "type": "address"}
                    ],
                    "name": "allowance",
                    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                    "stateMutability": "view",
                    "type": "function"
                  }
                ],
                functionName: 'allowance',
                args: [address as `0x${string}`, ROUTER_ADDRESS as `0x${string}`],
              })
            ]);
            
            console.log("🪙 Token Balance:", formatEther(tokenBalance));
            console.log("🔐 Current Allowance:", formatEther(allowance));
            
            // Check if approval is needed
            const amountToApprove = parseEther(amount);
            console.log("🔍 Approval check:", {
              currentAllowance: formatEther(allowance),
              amountToApprove: amount,
              needsApproval: allowance < amountToApprove
            });
            
            if (allowance < amountToApprove) {
              setNeedsApproval(true);
              setApprovalAmount(amount);
              console.log("⚠️ Approval needed for amount:", amount);
            } else {
              setNeedsApproval(false);
              setApprovalAmount("0");
              console.log("✅ Sufficient allowance, no approval needed");
            }
          } catch (error) {
            console.log("⚠️ Could not check token balance/approval:", error);
          }
        }
        
      } catch (error) {
        console.error("❌ No liquidity pair found:", error);
      }
    };
    
    checkLiquidityPair();
  }, [publicClient, tokenAddress, address, swapDirection, amount]);

  // Refresh approval status after successful approval
  useEffect(() => {
    if (isSuccess && needsApproval) {
      console.log("✅ Approval successful, refreshing status...");
      // Trigger a re-check by updating the amount (which will trigger the liquidity check)
      setAmount(amount);
    }
  }, [isSuccess, needsApproval, amount]);

  const calculateOutput = () => {
    if (!amount || parseFloat(amount) <= 0) return "0";
    
    // Return the real amount from blockchain
    return parseFloat(amountOut).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side - Token Info */}
        <div className="flex-1">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
              ⭐
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{tokenName}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <span className="text-gray-600">Token:</span>
              <span className="font-semibold ml-2">{tokenName} ({tokenSymbol})</span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className="font-semibold ml-2 text-green-600">Finalized & Listed</span>
            </div>
            <div>
              <span className="text-gray-600">Token Address:</span>
              <a 
                href={`https://scan.coredao.org/token/${tokenAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs font-semibold ml-2 text-blue-600 hover:text-blue-800 underline cursor-pointer"
              >
                {tokenAddress}
              </a>
            </div>
          </div>


        </div>

        {/* Right Side - Swap Form */}
        <div className="lg:w-96">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Swap Interface</h3>
          
          {!isConnected ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Please connect your wallet to swap</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Swap Direction Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setSwapDirection("buy")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    swapDirection === "buy"
                      ? "bg-green-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-green-600"
                  }`}
                >
                  Buy {tokenSymbol}
                </button>
                <button
                  onClick={() => setSwapDirection("sell")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    swapDirection === "sell"
                      ? "bg-red-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-red-600"
                  }`}
                >
                  Sell {tokenSymbol}
                </button>
              </div>

              {/* Amount Input */}
              <div>
                <label htmlFor="swapAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  {swapDirection === "buy" ? "Amount (Core)" : `Amount (${tokenSymbol})`}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="swapAmount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    min="0"
                    step="0.001"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    {swapDirection === "buy" ? "Core" : tokenSymbol}
                  </div>
                </div>
              </div>

              {/* Swap Arrow */}
              <div className="flex justify-center">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
              </div>

              {/* Output Amount */}
              {amount && parseFloat(amount) > 0 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">You will receive approximately:</span>
                    <span className="font-bold text-green-800">
                      {calculateOutput()} {swapDirection === "buy" ? tokenSymbol : "Core"}
                    </span>
                  </div>
                </div>
              )}

              {/* Slippage Input */}
              <div>
                <label htmlFor="slippage" className="block text-sm font-medium text-gray-700 mb-2">
                  Slippage Tolerance (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="slippage"
                    defaultValue="5"
                    min="0.1"
                    max="50"
                    step="0.1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="5.0"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    %
                  </div>
                </div>
              </div>

              {/* Unified Swap Button */}
              <button
                onClick={handleSwap}
                disabled={!amount || parseFloat(amount) <= 0 || isPending || isConfirming}
                className={`w-full py-3 px-6 rounded-lg font-bold transition-colors ${
                  !amount || parseFloat(amount) <= 0 || isPending || isConfirming
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : swapDirection === "buy"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                {isPending ? "Confirming..." : 
                 isConfirming ? "Processing..." : 
                 swapDirection === "buy" ? `Buy ${tokenSymbol}` : `Sell ${tokenSymbol}`}
              </button>



              {/* Transaction Status */}
              {isSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        Swap successful! Your transaction has been completed.
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        You received: {calculateOutput()} {swapDirection === "buy" ? tokenSymbol : "Core"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    Error: {error.message}
                  </p>
                </div>
              )}



            </div>
          )}
        </div>
      </div>
    </div>
  );
} 