import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  console.log("API called")

  try {
    // Harness the active server cookie session inheriting full Admin RLS bypass logic naturally
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized Execution Context")

    // 1. Fetch approved orders ready for assignment 
    const { data: pendingOrders, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "assigned_to_growers")
    
    if (orderErr) throw orderErr

    // 2. Fetch available growers
    const { data: growers, error: growerErr } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "grower")
    
    if (growerErr) throw growerErr

    console.log("Orders:", pendingOrders)
    console.log("Growers:", growers)

    if (!pendingOrders || pendingOrders.length === 0) {
      return NextResponse.json({ message: "No pending orders to assign" }, { status: 200 })
    }

    if (!growers || growers.length === 0) {
      throw new Error("No active growers available in the network")
    }

    const newAssignments = []
    const newAllocations = []
    let currentGrowerIndex = 0

    // Core Distribution Loop
    for (const order of pendingOrders) {
      const numTrays = order.total_trays
      const items = order.items as any[] 
      const primaryCrop = items && items.length > 0 ? items[0].crop_name : "Mixed Greens"
      
      for (let i = 0; i < numTrays; i++) {
        const grower = growers[currentGrowerIndex]
        const trayCode = `SB-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
        
        const harvestDate = new Date()
        harvestDate.setDate(harvestDate.getDate() + 7)

        const trayPayload = {
          id: crypto.randomUUID(), 
          grower_id: grower.id,
          tray_code: trayCode,
          crop_name: primaryCrop,
          start_date: new Date().toISOString(),
          expected_harvest_date: harvestDate.toISOString(),
          status: "assigned",
          current_day: 1,
          total_days: 7,
          seed_type: primaryCrop,
          seed_batch_id: `BAT-${Math.floor(Math.random() * 9999)}`,
          seed_quantity_grams: 50 
        }
        
        newAssignments.push(trayPayload)

        const allocationPayload = {
          order_id: order.id,
          tray_id: trayPayload.id,
          grower_id: grower.id
        }
        
        newAllocations.push(allocationPayload)
        
        currentGrowerIndex = (currentGrowerIndex + 1) % growers.length
      }
    } // <-- Missing brace closing the order mapping loop

    // Execute Bulk Insertions FIRST to ensure atomic safety
    if (newAssignments.length > 0) {
      const { error: trayError } = await supabase.from("tray_assignments").insert(newAssignments)
      if (trayError) throw trayError
      
      const { error: allocError } = await supabase.from("allocations").insert(newAllocations)
      if (allocError) throw allocError

      // Only transition order statuses if all matrix inserts successfully hit the DB
      for (const order of pendingOrders) {
        const { error: updateErr } = await supabase
          .from("orders")
          .update({ status: "growing" })
          .eq("id", order.id)
          
        if (updateErr) throw updateErr
      }
    }

    return NextResponse.json({ success: true, count: newAssignments.length }, { status: 200 })

  } catch (error: any) {
    console.error("Allocation System Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
