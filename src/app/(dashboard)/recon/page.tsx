"use client"

import * as React from "react"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import {
    Timer,
    Settings,
    MoreHorizontal,
    Plus,
    Search,
    Filter,
    Car,
    ChevronRight,
    Clock,
    User as UserIcon,
    CheckCircle2,
    AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Define types
type Task = {
    id: string
    vehicle: string
    stock: string
    vin: string
    daysInStage: number
    totalDaysInRecon: number
    assignee?: { name: string, image?: string }
    priority: "low" | "medium" | "high" | "critical"
}

type Column = {
    id: string
    title: string
    tasks: Task[]
}

const initialData: Column[] = [
    {
        id: "inspection",
        title: "Inspection",
        tasks: [
            { id: "v1", vehicle: "2021 Toyota Camry", stock: "AA2045", vin: "4T1B...", daysInStage: 1, totalDaysInRecon: 1, priority: "high", assignee: { name: "John D." } },
            { id: "v2", vehicle: "2019 Jeep Wrangler", stock: "AA2046", vin: "1C4H...", daysInStage: 3, totalDaysInRecon: 3, priority: "medium" },
        ],
    },
    {
        id: "mechanical",
        title: "Mechanical",
        tasks: [
            { id: "v3", vehicle: "2022 Tesla Model Y", stock: "AA2047", vin: "5YJY...", daysInStage: 2, totalDaysInRecon: 5, priority: "critical", assignee: { name: "Mike R." } },
        ],
    },
    {
        id: "body-work",
        title: "Body / Paint",
        tasks: [
            { id: "v4", vehicle: "2018 Ford Mustang", stock: "AA2048", vin: "1FAF...", daysInStage: 4, totalDaysInRecon: 8, priority: "low", assignee: { name: "Sarah K." } },
            { id: "v5", vehicle: "2020 Honda Accord", stock: "AA2049", vin: "1HGC...", daysInStage: 1, totalDaysInRecon: 10, priority: "medium" },
        ],
    },
    {
        id: "detail",
        title: "Detail",
        tasks: [
            { id: "v6", vehicle: "2023 BMW X5", stock: "AA2050", vin: "5UXV...", daysInStage: 0, totalDaysInRecon: 4, priority: "high", assignee: { name: "Alex B." } },
        ],
    },
    {
        id: "photo",
        title: "Photography",
        tasks: [],
    },
]

export default function ReconPage() {
    const [columns, setColumns] = React.useState(initialData)

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result

        if (!destination) return
        if (destination.droppableId === source.droppableId && destination.index === source.index) return

        const sourceCol = columns.find(c => c.id === source.droppableId)
        const destCol = columns.find(c => c.id === destination.droppableId)

        if (!sourceCol || !destCol) return

        const sourceTasks = Array.from(sourceCol.tasks)
        const [movedTask] = sourceTasks.splice(source.index, 1)

        if (sourceCol === destCol) {
            sourceTasks.splice(destination.index, 0, movedTask)
            const newColumns = columns.map(c => c.id === sourceCol.id ? { ...c, tasks: sourceTasks } : c)
            setColumns(newColumns)
        } else {
            const destTasks = Array.from(destCol.tasks)
            destTasks.splice(destination.index, 0, movedTask)
            const newColumns = columns.map(c => {
                if (c.id === sourceCol.id) return { ...c, tasks: sourceTasks }
                if (c.id === destCol.id) return { ...c, tasks: destTasks }
                return c
            })
            setColumns(newColumns)
        }
    }

    return (
        <div className="flex flex-col h-full  bg-background">
            <div className="p-6 border-b bg-white">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Recon Workflow</h1>
                        <p className="text-muted-foreground text-sm">Track vehicle reconditioning progress from acquisition to frontline.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                            <Settings className="size-4" /> Workflow Settings
                        </Button>
                        <Button size="sm" className="gap-2 bg-primary">
                            <Plus className="size-4" /> Start Recon
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search vinyl or stock..." className="pl-8 h-9" />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="h-9 w-9">
                            <Filter className="size-4" />
                        </Button>
                        <div className="flex items-center gap-2 bg-secondary rounded-md p-1 border">
                            <Button variant="ghost" size="sm" className="h-7 bg-white shadow-sm text-xs font-bold">Pipeline</Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs">List View</Button>
                        </div>
                    </div>
                    <div className="ml-auto flex items-center gap-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-primary/100"></div> On Track</div>
                        <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-accent"></div> At Risk</div>
                        <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-destructive/100"></div> Delayed</div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto p-6 min-h-0">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex h-full gap-6 min-w-max pb-4">
                        {columns.map(column => (
                            <div key={column.id} className="flex flex-col w-80 shrink-0">
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-sm tracking-tight capitalize">{column.title}</h3>
                                        <Badge variant="secondary" className="rounded-full h-5 px-1.5 text-[10px]">{column.tasks.length}</Badge>
                                    </div>
                                    <MoreHorizontal className="size-4 text-muted-foreground cursor-pointer" />
                                </div>

                                <Droppable droppableId={column.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className={`flex-1 flex flex-col gap-3 rounded-lg p-2 transition-colors ${snapshot.isDraggingOver ? 'bg-muted/50' : 'bg-secondary/50 border-2 border-dashed border-border'}`}
                                        >
                                            {column.tasks.map((task, index) => (
                                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <Card
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`shadow-sm hover:shadow-md transition-shadow cursor-pointer ${snapshot.isDragging ? 'rotate-2 shadow-xl ring-2 ring-primary/20' : ''}`}
                                                        >
                                                            <CardContent className="p-4 space-y-4">
                                                                <div className="flex justify-between items-start">
                                                                    <div className="space-y-1">
                                                                        <h4 className="font-bold text-sm leading-tight text-foreground">{task.vehicle}</h4>
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="text-[10px] text-muted-foreground font-mono uppercase bg-secondary px-1 rounded">{task.stock}</span>
                                                                            <span className="text-[10px] text-muted-foreground font-mono">{task.vin}</span>
                                                                        </div>
                                                                    </div>
                                                                    {task.priority === 'critical' ? <AlertTriangle className="size-4 text-destructive" /> : null}
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-1">
                                                                        <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-tight">Time in Stage</p>
                                                                        <div className="flex items-center gap-1 text-[11px] font-bold text-foreground">
                                                                            <Clock className="size-3 text-accent-foreground" /> {task.daysInStage} days
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-tight">Total Recon</p>
                                                                        <div className="flex items-center gap-1 text-[11px] font-bold text-foreground">
                                                                            <Timer className="size-3 text-primary" /> {task.totalDaysInRecon} days
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center justify-between pt-2 border-t mt-2">
                                                                    <div className="flex items-center gap-1">
                                                                        <Avatar className="size-5">
                                                                            <AvatarFallback className="bg-muted text-[8px]">{task.assignee ? task.assignee.name.charAt(0) : '?'}</AvatarFallback>
                                                                        </Avatar>
                                                                        <span className="text-[10px] text-muted-foreground font-medium">{task.assignee ? task.assignee.name : 'Unassigned'}</span>
                                                                    </div>
                                                                    <div className="flex gap-1.5">
                                                                        <div className="size-5 rounded-full border border-border flex items-center justify-center hover:bg-primary/10 group">
                                                                            <CheckCircle2 className="size-3 text-muted-foreground group-hover:text-primary" />
                                                                        </div>
                                                                        <MoreHorizontal className="size-4 text-muted-foreground" />
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        ))}
                    </div>
                </DragDropContext>
            </div>
        </div>
    )
}
