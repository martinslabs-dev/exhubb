"use client";

import { useState, useEffect, useActionState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ArrowUpRight, Loader2, CheckCircle2, AlertCircle,
  Building2, CreditCard, Search, ShieldCheck, ChevronDown,
} from "lucide-react";
import { withdrawAction, type WalletActionResult } from "@/lib/actions/wallet";

interface Bank {
  id: number;
  name: string;
  code: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  currentBalance: number;
  savedBank?: {
    bankName?: string | null;
    bankCode?: string | null;
    bankAccountNumber?: string | null;
    bankAccountName?: string | null;
  } | null;
}

type Step = "bank" | "amount" | "confirm" | "done";

export default function WithdrawModal({ open, onClose, currentBalance, savedBank }: Props) {
  const [step,         setStep]         = useState<Step>("bank");
  const [banks,        setBanks]        = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [bankSearch,   setBankSearch]   = useState("");
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [bankDropOpen, setBankDropOpen] = useState(false);
  const [acctNumber,   setAcctNumber]   = useState(savedBank?.bankAccountNumber ?? "");
  const [acctName,     setAcctName]     = useState(savedBank?.bankAccountName   ?? "");
  const [verifying,    setVerifying]    = useState(false);
  const [verifyError,  setVerifyError]  = useState("");
  const [amount,       setAmount]       = useState("");
  const [fieldError,   setFieldError]   = useState("");

  const [state, formAction, isPending] = useActionState(withdrawAction, null);

  const verifyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const numAmount = Number(amount.replace(/,/g, ""));
  const filteredBanks = banks.filter((b) =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

  // Pre-select saved bank when modal opens
  useEffect(() => {
    if (open && savedBank?.bankCode && savedBank?.bankName && banks.length > 0) {
      const found = banks.find((b) => b.code === savedBank.bankCode);
      if (found) setSelectedBank(found);
    }
  }, [open, banks, savedBank]);

  // Fetch banks on first open
  useEffect(() => {
    if (!open || banks.length > 0) return;
    setBanksLoading(true);
    fetch("/api/flutterwave/banks")
      .then((r) => r.json())
      .then((d: { banks?: Bank[] }) => setBanks(d.banks ?? []))
      .catch(() => {})
      .finally(() => setBanksLoading(false));
  }, [open]);

  // Auto-verify account number when 10 digits + bank selected
  useEffect(() => {
    if (!selectedBank || acctNumber.length !== 10) { setAcctName(""); return; }
    if (verifyTimer.current) clearTimeout(verifyTimer.current);
    verifyTimer.current = setTimeout(async () => {
      setVerifying(true);
      setVerifyError("");
      setAcctName("");
      try {
        const res = await fetch(
          `/api/flutterwave/verify-account?account_number=${acctNumber}&account_bank=${selectedBank.code}`
        );
        const data = await res.json() as { accountName?: string; error?: string };
        if (data.accountName) {
          setAcctName(data.accountName);
          setVerifyError("");
        } else {
          setVerifyError(data.error ?? "Account not found. Check the number.");
        }
      } catch {
        setVerifyError("Could not verify. Check your connection.");
      } finally {
        setVerifying(false);
      }
    }, 700);
  }, [acctNumber, selectedBank]);

  // On success redirect to done
  useEffect(() => {
    if (state?.success) setStep("done");
  }, [state?.success]);

  function handleClose() {
    if (isPending) return;
    setStep("bank");
    setAmount("");
    setFieldError("");
    setBankSearch("");
    onClose();
  }

  function handleAmountInput(val: string) {
    const digits = val.replace(/\D/g, "");
    setAmount(digits ? Number(digits).toLocaleString() : "");
    setFieldError("");
  }

  function canProceedBank() {
    return !!selectedBank && acctNumber.length === 10 && !!acctName && !verifying && !verifyError;
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 380 }}
            className="fixed bottom-0 left-0 right-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50 pointer-events-none"
          >
            <div className="w-full sm:w-[440px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl pointer-events-auto overflow-y-auto max-h-[92vh] sm:max-h-[85vh] flex flex-col">

              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>

              <AnimatePresence mode="wait">

                {/* ── Step 1: Bank details ────────────────── */}
                {step === "bank" && (
                  <motion.div
                    key="bank"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.22 }}
                    className="p-6 overflow-y-auto"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                          <ArrowUpRight className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h2 className="text-lg font-black text-gray-900">Withdraw Funds</h2>
                          <p className="text-xs text-gray-400">Step 1 of 2 — Bank details</p>
                        </div>
                      </div>
                      <button onClick={handleClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>

                    {/* Progress */}
                    <div className="flex gap-1.5 mb-6">
                      <div className="h-1 flex-1 rounded-full bg-indigo-500" />
                      <div className="h-1 flex-1 rounded-full bg-gray-200" />
                    </div>

                    {/* Bank selector */}
                    <div className="mb-4">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Bank</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setBankDropOpen((v) => !v)}
                          className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 border-gray-200 hover:border-gray-300 focus:border-primary-500 bg-white text-sm font-semibold text-left transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className={selectedBank ? "text-gray-900" : "text-gray-400"}>
                              {selectedBank?.name ?? (banksLoading ? "Loading banks..." : "Select your bank")}
                            </span>
                          </span>
                          <motion.div animate={{ rotate: bankDropOpen ? 180 : 0 }} transition={{ duration: 0.18 }}>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          </motion.div>
                        </button>

                        <AnimatePresence>
                          {bankDropOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -8, scale: 0.97 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -8, scale: 0.97 }}
                              transition={{ duration: 0.16 }}
                              className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-gray-200 shadow-xl z-20 overflow-hidden"
                            >
                              {/* Search */}
                              <div className="p-2 border-b border-gray-100">
                                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
                                  <Search className="w-3.5 h-3.5 text-gray-400" />
                                  <input
                                    autoFocus
                                    value={bankSearch}
                                    onChange={(e) => setBankSearch(e.target.value)}
                                    placeholder="Search banks..."
                                    className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
                                  />
                                </div>
                              </div>
                              <div className="max-h-52 overflow-y-auto">
                                {filteredBanks.map((bank) => (
                                  <button
                                    key={bank.code}
                                    type="button"
                                    onClick={() => { setSelectedBank(bank); setBankDropOpen(false); setBankSearch(""); setAcctName(""); setVerifyError(""); }}
                                    className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                                      selectedBank?.code === bank.code
                                        ? "bg-primary-50 text-primary-700 font-semibold"
                                        : "hover:bg-gray-50 text-gray-700"
                                    }`}
                                  >
                                    {bank.name}
                                  </button>
                                ))}
                                {filteredBanks.length === 0 && (
                                  <p className="px-4 py-3 text-sm text-gray-400">No banks found</p>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Account number */}
                    <div className="mb-4">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Account Number</label>
                      <div className={`flex items-center rounded-2xl border-2 transition-colors ${
                        verifyError ? "border-red-400" : acctName ? "border-green-400" : "border-gray-200 focus-within:border-primary-500"
                      }`}>
                        <CreditCard className="w-4 h-4 text-gray-400 ml-4 flex-shrink-0" />
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={10}
                          value={acctNumber}
                          onChange={(e) => { setAcctNumber(e.target.value.replace(/\D/g, "")); setVerifyError(""); setAcctName(""); }}
                          placeholder="0000000000"
                          className="flex-1 px-3 py-4 text-sm font-mono font-semibold text-gray-900 bg-transparent outline-none placeholder-gray-300"
                        />
                        <div className="pr-4">
                          {verifying && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                          {acctName && !verifying && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                          {verifyError && !verifying && <AlertCircle className="w-4 h-4 text-red-400" />}
                        </div>
                      </div>
                    </div>

                    {/* Account name (auto-verified) */}
                    <AnimatePresence>
                      {acctName && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-4 overflow-hidden"
                        >
                          <div className="flex items-center gap-2.5 px-4 py-3 bg-green-50 border border-green-200 rounded-2xl">
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-green-600 font-medium">Account verified</p>
                              <p className="text-sm font-black text-green-800">{acctName}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                      {verifyError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-4 overflow-hidden"
                        >
                          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl">
                            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                            <p className="text-xs text-red-600 font-medium">{verifyError}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Next */}
                    <motion.button
                      whileHover={{ scale: canProceedBank() ? 1.02 : 1 }}
                      whileTap={{ scale: canProceedBank() ? 0.97 : 1 }}
                      type="button"
                      disabled={!canProceedBank()}
                      onClick={() => setStep("amount")}
                      className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-base flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-200 mt-2"
                    >
                      Continue
                      <ArrowUpRight className="w-5 h-5" />
                    </motion.button>
                  </motion.div>
                )}

                {/* ── Step 2: Amount ──────────────────────── */}
                {step === "amount" && (
                  <motion.div
                    key="amount"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.22 }}
                    className="p-6"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-lg font-black text-gray-900">How much?</h2>
                        <p className="text-xs text-gray-400">Step 2 of 2 — Enter amount</p>
                      </div>
                      <button onClick={handleClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>

                    {/* Progress */}
                    <div className="flex gap-1.5 mb-5">
                      <div className="h-1 flex-1 rounded-full bg-indigo-500" />
                      <div className="h-1 flex-1 rounded-full bg-indigo-500" />
                    </div>

                    {/* Balance pill */}
                    <div className="flex items-center justify-center mb-5">
                      <div className="px-4 py-2 bg-gray-50 rounded-full border border-gray-200">
                        <p className="text-sm text-gray-500">
                          Available: <span className="font-black text-gray-800">₦{currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </p>
                      </div>
                    </div>

                    {/* To account */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 rounded-2xl border border-indigo-100 mb-5">
                      <Building2 className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-indigo-500 font-medium">To</p>
                        <p className="text-sm font-black text-indigo-900 truncate">{acctName}</p>
                        <p className="text-xs text-indigo-400">{selectedBank?.name} · ···{acctNumber.slice(-4)}</p>
                      </div>
                    </div>

                    {/* Amount input */}
                    <form action={formAction}>
                      <input type="hidden" name="bankCode"      value={selectedBank?.code ?? ""} />
                      <input type="hidden" name="accountNumber" value={acctNumber} />
                      <input type="hidden" name="accountName"   value={acctName} />
                      <input type="hidden" name="bankName"      value={selectedBank?.name ?? ""} />
                      <input type="hidden" name="amount"        value={numAmount} />

                      <div className="mb-4">
                        <div className={`relative flex items-center rounded-2xl border-2 transition-colors ${
                          fieldError || state?.error ? "border-red-400" : "border-gray-200 focus-within:border-indigo-500"
                        } bg-white`}>
                          <span className="pl-4 text-2xl font-black text-gray-400 select-none">₦</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={amount}
                            onChange={(e) => handleAmountInput(e.target.value)}
                            placeholder="0"
                            className="flex-1 px-2 py-4 text-3xl font-black text-gray-900 bg-transparent outline-none placeholder-gray-200"
                          />
                        </div>

                        <AnimatePresence>
                          {(fieldError || state?.error) && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex items-center gap-1.5 text-xs text-red-500 font-medium mt-1.5"
                            >
                              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                              {fieldError || state?.error}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setStep("bank")}
                          className="flex-1 h-14 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
                        >
                          Back
                        </button>
                        <motion.button
                          whileHover={{ scale: numAmount >= 1000 && !isPending ? 1.02 : 1 }}
                          whileTap={{ scale: numAmount >= 1000 && !isPending ? 0.97 : 1 }}
                          type="submit"
                          disabled={!numAmount || numAmount < 1000 || numAmount > currentBalance || isPending}
                          className="flex-[2] h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-base flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-200"
                        >
                          {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Withdraw <ArrowUpRight className="w-5 h-5" /></>}
                        </motion.button>
                      </div>
                    </form>

                    <div className="flex items-center justify-center gap-1.5 mt-4">
                      <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                      <p className="text-xs text-gray-400">Transfers usually arrive within 5 minutes</p>
                    </div>
                  </motion.div>
                )}

                {/* ── Done ───────────────────────────────── */}
                {step === "done" && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="p-10 flex flex-col items-center text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 10, delay: 0.1 }}
                      className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6"
                    >
                      <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </motion.div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">Withdrawal initiated!</h3>
                    <p className="text-sm text-gray-400 mb-6">{state?.success}</p>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleClose}
                      className="px-8 py-3 rounded-2xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-800 transition-colors"
                    >
                      Done
                    </motion.button>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
