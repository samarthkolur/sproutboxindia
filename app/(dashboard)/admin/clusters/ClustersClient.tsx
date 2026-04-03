"use client"

import { useMemo } from "react"
import { Map, Users, Target } from "lucide-react"

export default function ClustersClient({ growers, trays }: { growers: any[], trays: any[] }) {
  
  // Logical network grouping. (If regional tags were in schema, we'd group them here).
  // Without schema modifications we construct the "Central SproutBox Network" default cluster.
  const clusters = useMemo(() => {
    return [
      {
        id: "C1",
        name: "Primary Core Network",
        growers: growers,
        trays: trays,
        completionRate: trays.length ? Math.round((trays.filter(t => t.status === "completed" || t.status === "delivered").length / trays.length) * 100) : 0
      }
    ]
  }, [growers, trays])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {clusters.map(cluster => (
          <div key={cluster.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-sprout-500/20 text-sprout-400">
                <Map className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{cluster.name}</h3>
                <p className="text-xs text-muted-foreground">Active Hub</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                <Users className="h-4 w-4 text-blue-400 mb-2 opacity-50" />
                <p className="text-xl font-bold">{cluster.growers.length}</p>
                <p className="text-xs text-muted-foreground">Active Growers</p>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                <Target className="h-4 w-4 text-sprout-400 mb-2 opacity-50" />
                <p className="text-xl font-bold">{cluster.trays.length}</p>
                <p className="text-xs text-muted-foreground">Total Production Trays</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-muted-foreground">Cluster Output Reliability</span>
                <span className="text-sprout-400">{cluster.completionRate}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-sprout-500 rounded-full" 
                  style={{ width: `${cluster.completionRate}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
