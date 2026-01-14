"use client"

import * as React from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Filter, Download, Plus, Search as SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const data: InventoryItem[] = [
    {
        id: "1",
        vehicle: "2022 Tesla Model 3 Long Range",
        vin: "5YJ3E1EB7NF...",
        stock: "AA1024",
        location: "Lehi, UT",
        status: "Frontline",
        daysOnLot: 12,
        price: 34500,
        marketPrice: 35200,
    },
    {
        id: "2",
        vehicle: "2021 Ford F-150 Lariat",
        vin: "1FTEW1CP4MF...",
        stock: "AA1025",
        location: "Orem, UT",
        status: "Recon",
        daysOnLot: 4,
        price: 48900,
        marketPrice: 47500,
    },
    {
        id: "3",
        vehicle: "2023 Honda CR-V Hybrid Sport",
        vin: "5J8YK1H57PL...",
        stock: "AA1026",
        location: "Lehi, UT",
        status: "In-Transit",
        daysOnLot: 1,
        price: 38200,
        marketPrice: 39000,
    },
    {
        id: "4",
        vehicle: "2020 Toyota RAV4 XLE",
        vin: "2T3L1RFV4LC...",
        stock: "AA1027",
        location: "Orem, UT",
        status: "Frontline",
        daysOnLot: 28,
        price: 26400,
        marketPrice: 27100,
    },
    {
        id: "5",
        vehicle: "2021 Chevrolet Silverado 1500",
        vin: "1GCPYEEK0MZ...",
        stock: "AA1028",
        location: "Lehi, UT",
        status: "Sold",
        daysOnLot: 45,
        price: 42000,
        marketPrice: 41500,
    },
]

export type InventoryItem = {
    id: string
    vehicle: string
    vin: string
    stock: string
    location: "Lehi, UT" | "Orem, UT"
    status: "Frontline" | "Recon" | "In-Transit" | "Sold"
    daysOnLot: number
    price: number
    marketPrice: number
}

export const columns: ColumnDef<InventoryItem>[] = [
    {
        accessorKey: "vehicle",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Vehicle
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => (
            <div className="flex flex-col">
                <span className="font-bold text-sm">{row.getValue("vehicle")}</span>
                <span className="text-[10px] text-muted-foreground font-mono uppercase">{row.original.vin}</span>
            </div>
        ),
    },
    {
        accessorKey: "location",
        header: "Location",
        cell: ({ row }) => <div className="text-xs">{row.getValue("location")}</div>,
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <Badge
                    variant={
                        status === "Frontline" ? "default" :
                            status === "Recon" ? "secondary" :
                                status === "Sold" ? "outline" : "outline"
                    }
                    className={
                        status === "Frontline" ? "bg-primary/100 hover:bg-primary" :
                            status === "Recon" ? "bg-accent hover:bg-accent-foreground text-white" :
                                status === "In-Transit" ? "bg-primary/100 hover:bg-primary text-white" : ""
                    }
                >
                    {status}
                </Badge>
            )
        },
    },
    {
        accessorKey: "daysOnLot",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Days
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => <div className="text-center">{row.getValue("daysOnLot")}</div>,
    },
    {
        accessorKey: "price",
        header: () => <div className="text-right">Price</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("price"))
            const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
            }).format(amount)
            return <div className="text-right font-medium">{formatted}</div>
        },
    },
    {
        accessorKey: "marketPrice",
        header: () => <div className="text-right whitespace-nowrap">Price-to-Market</div>,
        cell: ({ row }) => {
            const price = row.original.price
            const market = row.original.marketPrice
            const diff = ((price / market) * 100).toFixed(1)
            const isAbove = price > market

            return (
                <div className="text-right flex flex-col">
                    <span className={`text-xs font-bold ${isAbove ? "text-destructive" : "text-primary"}`}>
                        {diff}%
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        ${(market / 1000).toFixed(1)}k Market
                    </span>
                </div>
            )
        }
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
            const payment = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(payment.vin)}
                        >
                            Copy VIN
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>View Vehicle Details</DropdownMenuItem>
                        <DropdownMenuItem>Move to Recon</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Mark as Sold</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]

export default function InventoryPage() {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        []
    )
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    })

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">All Inventory</h1>
                    <p className="text-muted-foreground text-sm">Manage and track your dealership inventory across all locations.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                        <Download className="size-4" /> Export
                    </Button>
                    <Button size="sm" className="gap-2 bg-primary">
                        <Plus className="size-4" /> Add Vehicle
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3 border-b">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by vehicle or VIN..."
                                value={(table.getColumn("vehicle")?.getFilterValue() as string) ?? ""}
                                onChange={(event) =>
                                    table.getColumn("vehicle")?.setFilterValue(event.target.value)
                                }
                                className="pl-8"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Filter className="size-4" /> Filter <ChevronDown className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Filter by Location</DropdownMenuLabel>
                                    <DropdownMenuItem>Lehi, UT</DropdownMenuItem>
                                    <DropdownMenuItem>Orem, UT</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                                    <DropdownMenuItem>Frontline</DropdownMenuItem>
                                    <DropdownMenuItem>Recon</DropdownMenuItem>
                                    <DropdownMenuItem>In-Transit</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        Columns <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {table
                                        .getAllColumns()
                                        .filter((column) => column.getCanHide())
                                        .map((column) => {
                                            return (
                                                <DropdownMenuCheckboxItem
                                                    key={column.id}
                                                    className="capitalize"
                                                    checked={column.getIsVisible()}
                                                    onCheckedChange={(value) =>
                                                        column.toggleVisibility(!!value)
                                                    }
                                                >
                                                    {column.id}
                                                </DropdownMenuCheckboxItem>
                                            )
                                        })}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="rounded-md">
                        <Table>
                            <TableHeader className="bg-secondary">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => {
                                            return (
                                                <TableHead key={header.id}>
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                </TableHead>
                                            )
                                        })}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                            className="hover:bg-background"
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-24 text-center"
                                        >
                                            No results.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="flex items-center justify-end space-x-2 p-4 border-t">
                        <div className="flex-1 text-sm text-muted-foreground">
                            {table.getFilteredSelectedRowModel().rows.length} of{" "}
                            {table.getFilteredRowModel().rows.length} row(s) selected.
                        </div>
                        <div className="space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
