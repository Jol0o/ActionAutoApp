import { Truck, X, Phone } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShipmentStats } from "@/types/transportation"

interface TransportationSidebarProps {
    activeTab: string
    setActiveTab: (tab: string) => void
    selectedStatus: string
    setSelectedStatus: (status: string) => void
    stats: ShipmentStats
    isSidebarOpen: boolean
    setIsSidebarOpen: (open: boolean) => void
}

export function TransportationSidebar({
    activeTab,
    setActiveTab,
    selectedStatus,
    setSelectedStatus,
    stats,
    isSidebarOpen,
    setIsSidebarOpen
}: TransportationSidebarProps) {
    const colorMap: Record<string, { light: string, dark: string, bg: string, bgDark: string }> = {
        'Available for Pickup': { 
            light: 'bg-yellow-50 text-yellow-700', 
            dark: 'dark:bg-yellow-950 dark:text-yellow-300',
            bg: 'bg-yellow-500',
            bgDark: 'dark:bg-yellow-400'
        },
        'Cancelled': { 
            light: 'bg-red-50 text-red-700', 
            dark: 'dark:bg-red-950 dark:text-red-300',
            bg: 'bg-red-500',
            bgDark: 'dark:bg-red-400'
        },
        'Delivered': { 
            light: 'bg-green-50 text-green-700', 
            dark: 'dark:bg-green-950 dark:text-green-300',
            bg: 'bg-green-500',
            bgDark: 'dark:bg-green-400'
        },
        'Dispatched': { 
            light: 'bg-blue-50 text-blue-700', 
            dark: 'dark:bg-blue-950 dark:text-blue-300',
            bg: 'bg-blue-500',
            bgDark: 'dark:bg-blue-400'
        },
        'In-Route': { 
            light: 'bg-blue-50 text-blue-700', 
            dark: 'dark:bg-blue-950 dark:text-blue-300',
            bg: 'bg-blue-500',
            bgDark: 'dark:bg-blue-400'
        }
    }

    return (
        <div className={`
            fixed lg:static inset-y-0 left-0 z-50
            w-64 sm:w-72 md:w-80 lg:w-64 bg-card border-r border-border min-h-screen p-4 sm:p-5 md:p-6
            transform transition-transform duration-300 ease-in-out
            overflow-y-auto
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
            <button 
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden absolute top-4 right-4 p-1 hover:bg-muted rounded"
            >
                <X className="w-5 h-5 text-foreground" />
            </button>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 h-8 sm:h-10">
                    <TabsTrigger value="shipments" className="text-[9px] sm:text-[10px] md:text-xs px-1 sm:px-2">
                        <Truck className="size-2.5 sm:size-3 mr-0.5 sm:mr-1" />
                        <span>SHIPMENTS</span>
                    </TabsTrigger>
                    <TabsTrigger value="drafts" className="text-[9px] sm:text-[10px] md:text-xs px-1 sm:px-2">
                        DRAFTS
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="space-y-1.5 sm:space-y-2">
                <button
                    onClick={() => {
                        setSelectedStatus('all')
                        setIsSidebarOpen(false)
                    }}
                    className={`w-full text-left px-2.5 sm:px-3 py-1.5 sm:py-2 rounded flex items-center justify-between text-xs sm:text-sm transition-colors ${
                        selectedStatus === 'all' 
                            ? 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300' 
                            : 'hover:bg-muted text-foreground'
                    }`}
                >
                    <span className="flex items-center gap-1.5 sm:gap-2">
                        <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-400 dark:bg-yellow-500 rounded-sm"></span>
                        <span className="truncate">Show All</span>
                    </span>
                    <span className="text-muted-foreground ml-2">{stats.all}</span>
                </button>
                
                {Object.entries(stats).map(([status, count]) => {
                    if (status === 'all') return null
                    const colors = colorMap[status]
                    
                    return (
                        <button
                            key={status}
                            onClick={() => {
                                setSelectedStatus(status)
                                setIsSidebarOpen(false)
                            }}
                            className={`w-full text-left px-2.5 sm:px-3 py-1.5 sm:py-2 rounded flex items-center justify-between text-xs sm:text-sm transition-colors ${
                                selectedStatus === status 
                                    ? `${colors.light} ${colors.dark}` 
                                    : 'hover:bg-muted text-foreground'
                            }`}
                        >
                            <span className="flex items-center gap-1.5 sm:gap-2">
                                <span className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${colors.bg} ${colors.bgDark} rounded-sm`}></span>
                                <span className="truncate">{status}</span>
                            </span>
                            <span className="text-muted-foreground ml-2">{count}</span>
                        </button>
                    )
                })}
            </div>

            <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-border">
                <p className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 text-foreground">Having Transportation Issues?</p>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <a href="mailto:carketach@acertusdeliver.com" className="flex items-center gap-1.5 sm:gap-2 text-blue-600 dark:text-blue-400 hover:underline break-all">
                        <span className="break-all">carketach@acertusdeliver.com</span>
                    </a>
                    <a href="tel:8554316570" className="flex items-center gap-1.5 sm:gap-2 text-blue-600 dark:text-blue-400 hover:underline">
                        <Phone className="size-3.5 sm:size-4" />
                        (855) 431-6570
                    </a>
                </div>
            </div>
        </div>
    )
}