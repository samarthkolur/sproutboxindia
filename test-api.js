fetch('http://localhost:3000/api/admin/allocate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ planId: "test", allocations: [{ growerId: "test", trayCount: 1 }] })
}).then(res => res.json()).then(console.log).catch(console.error);
