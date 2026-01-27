"use client"

import * as React from "react"
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface InventoryPaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    limit?: number
    onLimitChange?: (limit: number) => void
    totalCount?: number
}

export function InventoryPagination({
    currentPage,
    totalPages,
    onPageChange,
    limit,
    onLimitChange,
    totalCount,
}: InventoryPaginationProps) {
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
            {totalCount !== undefined && (
                <div className="text-sm text-muted-foreground order-2 sm:order-1">
                    Showing {limit ? Math.min((currentPage - 1) * limit + 1, totalCount) : 0} to{" "}
                    {limit ? Math.min(currentPage * limit, totalCount) : 0} of {totalCount} vehicles
                </div>
            )}
            <div className="flex items-center space-x-6 lg:space-x-8 order-1 sm:order-2">
                {limit && onLimitChange && (
                    <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">Rows per page</p>
                        <Select
                            value={`${limit}`}
                            onValueChange={(value: string) => {
                                onLimitChange(Number(value))
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={String(limit)} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[12, 24, 36, 48].map((pageSize) => (
                                    <SelectItem key={pageSize} value={`${pageSize}`}>
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        className="hidden h-8 w-8 p-0 lg:flex"
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1}
                    >
                        <span className="sr-only">Go to first page</span>
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        <span className="sr-only">Go to previous page</span>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        <span className="sr-only">Go to next page</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="hidden h-8 w-8 p-0 lg:flex"
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage === totalPages}
                    >
                        <span className="sr-only">Go to last page</span>
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
