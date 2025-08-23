// // src/pages/AdminAIDashboard.tsx
// import { useEffect, useMemo, useState } from 'react';
// import { Card } from '@/components/ui/card'; // אם יש לך shadcn
// import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// type AiResponse = {
//   kpis:{avgAttendanceRate:number; lateArrivalsPct:number; sickDaysThisMonth:number; overtimeHours:number};
//   trends:{metric:string; period:string; value:number}[];
//   segments:{name:string; attendanceRate:number; avgOvertime:number}[];
//   risks:{type:string; employeeId:string; reason:string; confidence:number}[];
//   insights:string[];
//   actions:string[];
// };

// export default function AdminAIDashboard() {
//   const [ai, setAi] = useState<AiResponse | null>(null);
//   const [loading, setLoading] = useState(false);

//   // TODO: למשוך/לחשב סיכומים מקומיים מהמסכים הקיימים (attendance, leaves, overtime)
//   const summary = useMemo(() => ({
//     month: "2025-08",
//     depts: [
//       { name: "R&D", headcount: 18, attendance: 0.92, avgOvertime: 3.1, sickDays: 6 },
//       { name: "Support", headcount: 12, attendance: 0.88, avgOvertime: 4.6, sickDays: 9 }
//     ],
//     weekly: [
//       { week: "2025-W30", attendance: 0.93, latePct: 0.06 },
//       { week: "2025-W31", attendance: 0.91, latePct: 0.08 }
//     ]
//   }), []);

//   useEffect(() => {
//     (async () => {
//       setLoading(true);
//       const res = await fetch('http://localhost:5050/ai/insights', {
//         method: 'POST',
//         headers: { 'Content-Type':'application/json' },
//         body: JSON.stringify({ summary })
//       });
//       const data = await res.json();
//       setAi(data);
//       setLoading(false);
//     })();
//   }, [summary]);

//   if (loading) return <div className="p-6 text-xl">מנתח נתונים…</div>;
//   if (!ai)     return <div className="p-6 text-xl">אין נתונים להצגה</div>;

//   return (
//     <div className="p-6 space-y-6">
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//         <Kpi title="נוכחות ממוצעת" value={(ai.kpis.avgAttendanceRate*100).toFixed(1) + '%'} />
//         <Kpi title="איחורים (%)" value={(ai.kpis.lateArrivalsPct*100).toFixed(1) + '%'} />
//         <Kpi title="ימי מחלה (חודש)" value={ai.kpis.sickDaysThisMonth.toFixed(0)} />
//         <Kpi title="שעות נוספות" value={ai.kpis.overtimeHours.toFixed(1)} />
//       </div>

//       <Card className="p-4">
//         <h3 className="text-lg font-semibold mb-3">מגמת נוכחות</h3>
//         <div style={{ width: '100%', height: 260 }}>
//           <ResponsiveContainer>
//             <LineChart data={ai.trends.filter(t => t.metric==='attendance').map(t => ({ period:t.period, value:t.value }))}>
//               <XAxis dataKey="period" />
//               <YAxis domain={[0,1]} tickFormatter={(v)=>`${Math.round(v*100)}%`} />
//               <Tooltip formatter={(v:number)=>`${Math.round(v*100)}%`} />
//               <Line type="monotone" dataKey="value" />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//       </Card>

//       <Card className="p-4">
//         <h3 className="text-lg font-semibold mb-2">התובנות של המודל</h3>
//         <ul className="list-disc mr-6 space-y-1">
//           {ai.insights.map((s,i)=>(<li key={i}>{s}</li>))}
//         </ul>
//       </Card>

//       {ai.actions.length > 0 && (
//         <Card className="p-4">
//           <h3 className="text-lg font-semibold mb-2">צעדים מומלצים</h3>
//           <ol className="list-decimal mr-6 space-y-1">
//             {ai.actions.map((a,i)=>(<li key={i}>{a}</li>))}
//           </ol>
//         </Card>
//       )}

//       {ai.risks.length > 0 && (
//         <Card className="p-4">
//           <h3 className="text-lg font-semibold mb-2">נקודות סיכון</h3>
//           <table className="w-full text-sm">
//             <thead><tr className="text-left"><th>סוג</th><th>עובד</th><th>סיבה</th><th>ודאות</th></tr></thead>
//             <tbody>
//               {ai.risks.map((r,i)=>(
//                 <tr key={i} className="border-t">
//                   <td>{r.type}</td>
//                   <td>{r.employeeId}</td>
//                   <td>{r.reason.replaceAll('_',' ')}</td>
//                   <td>{Math.round(r.confidence*100)}%</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </Card>
//       )}
//     </div>
//   );
// }

// function Kpi({ title, value }: { title:string; value:string }) {
//   return (
//     <Card className="p-4">
//       <div className="text-sm text-gray-500">{title}</div>
//       <div className="text-2xl font-semibold">{value}</div>
//     </Card>
//   );
// }
