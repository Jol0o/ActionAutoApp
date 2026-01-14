import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Users, Car, DollarSign, Calendar, MapPin } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="p-6 space-y-8">
      {/* Header section */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Region</h1>
          <p className="text-muted-foreground mt-1">
            Includes all dealers within <span className="text-primary font-bold">20</span> miles of zipcode <span className="text-primary font-bold underline">94043</span>. <button className="text-primary font-medium ml-2">Edit Region</button> <button className="text-primary font-medium ml-2">PDF</button>
          </p>
        </div>
        <div className="bg-white border rounded-md px-3 py-2 flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">View Local Dealer</span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </div>
      </div>

      {/* KPI Cards & Map Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:col-span-2">
          <MetricCard
            title="306"
            label="Dealers"
            icon={<Users className="size-6 text-primary" />}
          />
          <MetricCard
            title="71"
            label="Avg. cars on lot"
            icon={<Car className="size-6 text-primary" />}
          />
          <MetricCard
            title="$26,366"
            label="Avg. list price"
            icon={<DollarSign className="size-6 text-primary" />}
          />
          <MetricCard
            title="75"
            label="Avg. days on lot"
            icon={<Calendar className="size-6 text-primary" />}
          />
        </div>

        <Card className="overflow-hidden border-none shadow-md p-0">
          <div className="relative h-full min-h-[240px] bg-muted flex items-center justify-center">
            {/* Simplified Map Placeholder */}
            <div className="absolute inset-0 bg-muted flex flex-col items-center justify-center gap-2">
              <MapPin className="size-10 text-primary animate-bounce" />
              <p className="text-sm font-medium text-muted-foreground">Interactive Regional Map</p>
            </div>
            <div className="absolute top-3 left-3 flex gap-1 p-1 bg-card rounded shadow-sm border">
              <button className="px-2 py-1 text-xs font-bold bg-secondary rounded">Map</button>
              <button className="px-2 py-1 text-xs">Satellite</button>
            </div>
            <div className="absolute top-3 right-3 p-1 bg-card rounded shadow-sm border">
              <Maximize2 className="size-4 text-muted-foreground" />
            </div>
            <div className="absolute bottom-10 right-3 flex flex-col gap-0.5 bg-card rounded shadow-sm border overflow-hidden">
              <button className="p-1 px-2 border-b hover:bg-secondary text-xl leading-none">+</button>
              <button className="p-1 px-2 hover:bg-secondary text-xl leading-none">−</button>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="dealer" className="w-full">
        <TabsList className="bg-transparent h-auto p-0 border-b w-full justify-start rounded-none gap-8">
          <TabsTrigger value="trends" className="rounded-lg border-b-2 border-transparent px-0 py-2  data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground font-semibold uppercase text-[11px] tracking-wider transition-all duration-300">Regional Trends</TabsTrigger>
          <TabsTrigger value="levels" className="rounded-lg border-b-2 border-transparent px-0 py-2  data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground font-semibold uppercase text-[11px] tracking-wider transition-all duration-300">Inventory Levels</TabsTrigger>
          <TabsTrigger value="sales" className="rounded-lg border-b-2 border-transparent px-0 py-2  data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground font-semibold uppercase text-[11px] tracking-wider transition-all duration-300">Sales By Model</TabsTrigger>
          <TabsTrigger value="dealer" className="rounded-lg border-b-2 border-transparent px-0 py-2  data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground font-semibold uppercase text-[11px] tracking-wider transition-all duration-300">Dealer Performance</TabsTrigger>
        </TabsList>
        <TabsContent value="trends" className="pt-6 space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
          <div>
            <h2 className="text-xl font-bold">Regional Trends</h2>
            <p className="text-sm text-muted-foreground">Market analysis and regional pricing trends</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-2">Avg Price Trend</p>
                <p className="text-3xl font-bold text-primary">+5.2%</p>
                <p className="text-xs text-muted-foreground mt-1">vs last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-2">Market Volume</p>
                <p className="text-3xl font-bold">12,450</p>
                <p className="text-xs text-muted-foreground mt-1">units listed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-2">Competition</p>
                <p className="text-3xl font-bold">306</p>
                <p className="text-xs text-muted-foreground mt-1">active dealers</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="levels" className="pt-6 space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
          <div>
            <h2 className="text-xl font-bold">Inventory Levels</h2>
            <p className="text-sm text-muted-foreground">Current stock distribution across categories</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-2">Sedans</p>
                <p className="text-3xl font-bold">145</p>
                <p className="text-xs text-primary mt-1">18% of inventory</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-2">SUVs</p>
                <p className="text-3xl font-bold">289</p>
                <p className="text-xs text-primary mt-1">36% of inventory</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-2">Trucks</p>
                <p className="text-3xl font-bold">234</p>
                <p className="text-xs text-primary mt-1">29% of inventory</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-2">Other</p>
                <p className="text-3xl font-bold">132</p>
                <p className="text-xs text-muted-foreground mt-1">17% of inventory</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="sales" className="pt-6 space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
          <div>
            <h2 className="text-xl font-bold">Sales By Model</h2>
            <p className="text-sm text-muted-foreground">Top performing vehicle models in the past 90 days</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Best Sellers</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-sm font-medium">Honda Accord</span>
                    <span className="text-sm font-bold">342 sold</span>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-sm font-medium">Toyota Camry</span>
                    <span className="text-sm font-bold">298 sold</span>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-sm font-medium">Ford F-150</span>
                    <span className="text-sm font-bold">256 sold</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fastest Movers</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-sm font-medium">Tesla Model 3</span>
                    <span className="text-sm font-bold text-primary">8.2 days</span>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-sm font-medium">Toyota RAV4</span>
                    <span className="text-sm font-bold text-primary">12.5 days</span>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-sm font-medium">Honda CR-V</span>
                    <span className="text-sm font-bold text-primary">14.1 days</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="dealer" className="pt-6 space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
          <div>
            <h2 className="text-xl font-bold">Dealer Performance</h2>
            <p className="text-sm text-muted-foreground">Regional dealer performance for all dealers</p>
          </div>

          <div className="w-[180px]">
            <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Dealer Type</label>
            <div className="border bg-white rounded px-3 py-1.5 flex justify-between items-center text-sm">
              All Dealers <ChevronDown className="size-4" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <PerformanceTable
              title="Most Active Dealers"
              subtitle="Dealers with the highest sales activity in the past 90 days"
              data={activeDealers}
              suffix="sold"
            />
            <PerformanceTable
              title="Lowest Days On Lot"
              subtitle="Dealers with the quickest average sales turnover in the past 90 days"
              data={lowestDays}
              suffix="days"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MetricCard({ title, label, icon }: { title: string, label: string, icon: React.ReactNode }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6 flex items-center gap-6">
        <div className="p-4 bg-secondary rounded-lg">
          {icon}
        </div>
        <div>
          <h3 className="text-3xl font-bold">{title}</h3>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function PerformanceTable({ title, subtitle, data, suffix }: { title: string, subtitle: string, data: any[], suffix: string }) {
  return (
    <Card className="border-none shadow-sm overflow-hidden">
      <CardHeader className="px-6 py-4">
        <CardTitle className="text-lg font-bold">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableBody>
            {data.map((item, i) => (
              <TableRow key={item.name} className="hover:bg-secondary/50">
                <TableCell className="w-12 text-center text-muted-foreground text-xs">{i + 1}</TableCell>
                <TableCell className="font-medium text-sm">{item.name}</TableCell>
                <TableCell className="text-right font-bold text-sm">{item.value} <span className="font-normal text-muted-foreground text-[10px] uppercase ml-1">{suffix}</span></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="p-3 flex justify-center border-t bg-secondary/30">
          <div className="flex gap-2 text-[10px] font-bold text-muted-foreground items-center">
            <span className="cursor-pointer">&lt;</span>
            <span className="p-1 px-2 bg-muted rounded-sm">1</span>
            <span className="cursor-pointer">2</span>
            <span className="cursor-pointer">3</span>
            <span className="cursor-pointer">4</span>
            <span className="cursor-pointer">5</span>
            <span className="px-1 text-muted-foreground">...</span>
            <span className="cursor-pointer">10</span>
            <span className="cursor-pointer">&gt;</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const activeDealers = [
  { name: "Hertz Car Sales Santa Clara, Ca", value: "2538" },
  { name: "Hertz Car Sales Oklahoma City", value: "1135" },
  { name: "Carmax Capitol Expressway", value: "896" },
  { name: "Carmax Fremont", value: "796" },
  { name: "Capitol Subaru", value: "483" },
  { name: "Fletcher Jones Motorcars Of Fremont", value: "421" },
  { name: "Stevens Creek Toyota", value: "405" },
  { name: "Toyota Of Milpitas", value: "389" },
  { name: "Mini Of Stevens Creek", value: "341" },
  { name: "Capitol Toyota", value: "326" },
]

const lowestDays = [
  { name: "Highway Fetch Auto", value: "9.6" },
  { name: "Icar Sales Llc", value: "13.4" },
  { name: "Hertz Car Sales Santa Clara, Ca", value: "16.8" },
  { name: "Stevens Creek Lincoln", value: "16.9" },
  { name: "Hertz Car Sales Oklahoma City", value: "19.3" },
  { name: "Putnam Toyota", value: "20.9" },
  { name: "Putnam Lexus", value: "21.9" },
  { name: "Capitol Honda", value: "23.2" },
  { name: "Autonation Acura Stevens Creek", value: "23.9" },
  { name: "Autoway - 20 Cars For Sale", value: "24.9" },
]

import { ChevronDown, Maximize2 } from "lucide-react"
