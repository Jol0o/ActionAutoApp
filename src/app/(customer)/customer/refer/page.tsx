"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Share2, Wallet, ArrowUpRight, TrendingUp, Users, CheckCircle2 } from "lucide-react"

const MOCK_TRANSACTIONS = [
    { id: 1, type: "deposit", amount: 200, date: "2024-12-05", note: "Referral Bonus - Sarah Jenkins Purchase" },
    { id: 2, type: "deposit", amount: 200, date: "2024-11-20", note: "Referral Bonus - Mike Thompson Purchase" },
    { id: 3, type: "withdrawal", amount: -400, date: "2024-11-25", note: "Withdrawn to Bank Account ending in 4421" },
]

export default function ReferAndEarnPage() {
    const referralCode = "ACTION-CRIS-992"
    const walletBalance = 200.00
    const totalEarned = 600.00
    const pendingLeads = 3

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border/50 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                        <Wallet className="w-8 h-8 text-green-500" /> Refer & Earn
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl text-lg">
                        Share Action Auto with friends and family. When they buy a car using your code, you instantly earn <strong className="text-green-600 dark:text-green-400">$200 cash</strong>.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Col: Digital Wallet & Link (Takes 2 columns) */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Action Auto Black Card (Digital Wallet) */}
                    <div className="relative overflow-hidden rounded-3xl bg-zinc-950 text-white shadow-2xl border border-zinc-800 p-8 sm:p-10 group">
                        {/* Abstract background blobs */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-green-500/20 rounded-full blur-3xl group-hover:bg-green-500/30 transition-colors duration-1000" />
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-colors duration-1000" />

                        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-8">
                            <div>
                                <p className="text-zinc-400 font-medium tracking-widest uppercase mb-2">Available Balance</p>
                                <h2 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-400">
                                    ${walletBalance.toFixed(2)}
                                </h2>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button className="bg-green-600 hover:bg-green-500 text-white border-none shadow-lg h-12 px-6 rounded-xl font-bold">
                                    Withdraw Funds
                                </Button>
                                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 h-12 px-6 rounded-xl font-medium">
                                    View History
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Share Code Section */}
                    <Card className="p-8 rounded-3xl shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                        <h3 className="text-xl font-bold mb-2">Your Unique Referral Code</h3>
                        <p className="text-muted-foreground mb-6">Tell your friends to show this code to their salesperson, or share the direct link below.</p>

                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                            <div className="flex-1 w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex justify-between items-center">
                                <span className="font-mono text-lg font-bold tracking-wider text-green-700 dark:text-green-400">{referralCode}</span>
                                <Button variant="ghost" size="icon" className="hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-400 text-zinc-400">
                                    <Copy className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                            <Button variant="outline" className="w-full h-12 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white border-[#25D366]/20 transition-colors">
                                WhatsApp
                            </Button>
                            <Button variant="outline" className="w-full h-12 bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2] hover:text-white border-[#1DA1F2]/20 transition-colors">
                                Twitter
                            </Button>
                            <Button variant="outline" className="w-full h-12 bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white border-blue-600/20 transition-colors">
                                Facebook
                            </Button>
                            <Button className="w-full h-12 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                                <Share2 className="w-4 h-4 mr-2" /> Share Options
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Right Col: Stats & History */}
                <div className="flex flex-col gap-6">

                    <div className="grid grid-cols-2 gap-4">
                        <Card className="p-6 rounded-3xl border-border/40 bg-zinc-50 dark:bg-zinc-900">
                            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <p className="text-zinc-500 text-sm font-medium mb-1">Total Earned</p>
                            <h4 className="text-2xl font-bold">${totalEarned.toFixed(0)}</h4>
                        </Card>

                        <Card className="p-6 rounded-3xl border-border/40 bg-zinc-50 dark:bg-zinc-900">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="text-zinc-500 text-sm font-medium mb-1">Pending Deals</p>
                            <h4 className="text-2xl font-bold">{pendingLeads} active</h4>
                        </Card>
                    </div>

                    <Card className="flex-1 p-6 rounded-3xl border-border/40 bg-white dark:bg-zinc-950 shadow-sm flex flex-col">
                        <h3 className="font-bold text-lg mb-6 flex justify-between items-center">
                            Recent Transactions
                            <Button variant="link" className="text-green-600 p-0 h-auto font-semibold text-sm">View All <ArrowUpRight className="w-3 h-3 ml-1" /></Button>
                        </h3>

                        <div className="space-y-5 flex-1 overflow-y-auto">
                            {MOCK_TRANSACTIONS.map((t) => (
                                <div key={t.id} className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.type === 'deposit' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                                            {t.type === 'deposit' ? <ArrowUpRight className="w-5 h-5 rotate-180" /> : <ArrowUpRight className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-foreground">{t.type === 'deposit' ? 'Referral Bonus' : 'Withdrawal'}</p>
                                            <p className="text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-[160px]">{t.note}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${t.type === 'deposit' ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                                            {t.type === 'deposit' ? '+' : ''}{t.amount.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{t.date}</p>
                                    </div>
                                </div>
                            ))}

                            <div className="py-8 text-center border-t border-dashed border-zinc-200 dark:border-zinc-800 mt-4">
                                <CheckCircle2 className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                                <p className="text-sm text-zinc-400 font-medium tracking-wide">End of recent history</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
