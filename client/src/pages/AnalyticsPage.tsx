import { useEffect, useMemo, useState } from "react";
import { BarChart3, Download, IndianRupee, RefreshCw, Users, CalendarCheck, Clock3 } from "lucide-react";
import toast from "react-hot-toast";
import {
  AnalyticsFilters,
  exportAnalytics,
  getAnalyticsFilters,
  getAnalyticsOverview,
  getMembershipReport,
  getRevenueReport,
} from "../features/analytics/analytics.api";

const initialFilters: AnalyticsFilters = { range: "this_month" };
const money = (value: number) => `₹${(value || 0).toLocaleString("en-IN")}`;
const label = (value: string) => value?.replace(/_/g, " ") || "Unknown";

function FilterBar({ filters, options, onChange }: any) {
  const update = (key: string, value: string) => onChange({ ...filters, [key]: value || undefined });
  return <div className="analytics-filters">
    <select className="form-input" value={filters.range || ""} onChange={e => update("range", e.target.value)}>
      <option value="today">Today</option><option value="this_week">This week</option><option value="this_month">This month</option><option value="this_year">This year</option><option value="">Custom range</option>
    </select>
    {filters.range === "" && <><input className="form-input" type="date" value={filters.dateFrom || ""} onChange={e => update("dateFrom", e.target.value)} /><input className="form-input" type="date" value={filters.dateTo || ""} onChange={e => update("dateTo", e.target.value)} /></>}
    <select className="form-input" value={filters.branchCode || ""} onChange={e => update("branchCode", e.target.value)}><option value="">All branches</option>{options.branches?.map((item: any) => <option key={item._id} value={item.branchCode || "MAIN"}>{item.name}</option>)}</select>
    <select className="form-input" value={filters.planId || ""} onChange={e => update("planId", e.target.value)}><option value="">All plans</option>{options.plans?.map((item: any) => <option key={item._id} value={item._id}>{item.name}</option>)}</select>
    <select className="form-input" value={filters.paymentStatus || ""} onChange={e => update("paymentStatus", e.target.value)}><option value="">All payment statuses</option>{options.paymentStatuses?.map((item: string) => <option key={item} value={item}>{label(item)}</option>)}</select>
    <select className="form-input" value={filters.paymentMethod || ""} onChange={e => update("paymentMethod", e.target.value)}><option value="">All payment methods</option>{options.paymentMethods?.map((item: string) => <option key={item} value={item}>{label(item)}</option>)}</select>
    <select className="form-input" value={filters.trainerId || ""} onChange={e => update("trainerId", e.target.value)}><option value="">All trainers</option>{options.trainers?.map((item: any) => <option key={item._id} value={item._id}>{item.name}</option>)}</select>
  </div>;
}

function Series({ values, labels, color = "var(--clr-primary)" }: any) {
  const max = Math.max(...(values || [0]), 1);
  return <div className="analytics-series">{values?.length ? values.map((value: number, index: number) => <div className="analytics-series-item" key={`${labels[index]}-${index}`}><div className="analytics-bar" style={{ height: `${Math.max((value / max) * 100, value ? 4 : 1)}%`, background: color }} title={`${labels[index]}: ${value}`} /><span>{labels[index]}</span></div>) : <p className="text-muted">No data available for the selected period.</p>}</div>;
}

export default function AnalyticsPage() {
  const [filters, setFilters] = useState<AnalyticsFilters>(initialFilters);
  const [options, setOptions] = useState<any>({});
  const [overview, setOverview] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [memberships, setMemberships] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState("");
  const query = useMemo(() => Object.fromEntries(Object.entries(filters).filter(([, value]) => value)), [filters]);

  useEffect(() => { getAnalyticsFilters().then(res => setOptions(res.data?.data || {})).catch(() => toast.error("Unable to load report filters.")); }, []);
  useEffect(() => {
    setLoading(true);
    Promise.all([getAnalyticsOverview(query), getRevenueReport(query), getMembershipReport(query)])
      .then(([overviewResponse, revenueResponse, membershipResponse]) => { setOverview(overviewResponse.data?.data); setRevenue(revenueResponse.data?.data); setMemberships(membershipResponse.data?.data); })
      .catch(() => { setOverview(null); toast.error("Unable to load analytics. Please try again."); })
      .finally(() => setLoading(false));
  }, [query]);

  const download = async (format: string, report: string) => {
    setExporting(format); try { const response = await exportAnalytics({ ...query, format, report }); const url = URL.createObjectURL(response.data); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `a1-fitness-${report}.${format === "pdf" ? "pdf" : "csv"}`; anchor.click(); URL.revokeObjectURL(url); toast.success("Report exported successfully."); } catch { toast.error("Unable to export this report."); } finally { setExporting(""); }
  };
  const kpis = overview?.kpis;
  return <div className="analytics-page">
    <div className="page-header flex-responsive"><div><h1>Analytics & Reports</h1><p className="text-muted">Operational performance from your live gym data.</p></div><div className="analytics-actions"><button className="btn btn-secondary" disabled={!!exporting} onClick={() => download("csv", "overview")}><Download size={17} />{exporting === "csv" ? "Exporting..." : "CSV"}</button><button className="btn btn-primary" disabled={!!exporting} onClick={() => download("pdf", "overview")}><Download size={17} />{exporting === "pdf" ? "Exporting..." : "PDF"}</button></div></div>
    <FilterBar filters={filters} options={options} onChange={setFilters} />
    {loading ? <div className="glass-panel analytics-empty"><RefreshCw className="spin" /> Loading analytics...</div> : !overview ? <div className="glass-panel analytics-empty">Unable to load analytics. Please try again.</div> : <>
      <div className="grid-stats analytics-kpis">{[["Total Revenue", money(kpis.totalRevenue), IndianRupee], ["New Members", kpis.newMembers, Users], ["Active Members", kpis.activeMembers, Users], ["Attendance", kpis.attendanceCount, CalendarCheck], ["Renewals", kpis.renewalsCount, RefreshCw], ["Pending Payments", kpis.pendingPaymentsCount, Clock3]].map(([name, value, Icon]: any) => <div className="stat-card analytics-kpi" key={name}><Icon size={20} /><div><h3>{name}</h3><p className="stat-value">{value}</p></div></div>)}</div>
      <div className="analytics-chart-grid"><section className="glass-panel analytics-panel"><div className="analytics-panel-heading"><h2>Revenue over time</h2><span>{money(kpis.totalRevenue)}</span></div><Series values={overview.series.revenue} labels={overview.series.labels} color="var(--clr-success)" /></section><section className="glass-panel analytics-panel"><div className="analytics-panel-heading"><h2>Member growth</h2><span>{kpis.newMembers} new</span></div><Series values={overview.series.newMembers} labels={overview.series.labels} color="var(--clr-secondary)" /></section><section className="glass-panel analytics-panel"><div className="analytics-panel-heading"><h2>Attendance trend</h2><span>{kpis.attendanceCount} visits</span></div><Series values={overview.series.attendance} labels={overview.series.labels} color="var(--clr-warning)" /></section><section className="glass-panel analytics-panel"><div className="analytics-panel-heading"><h2>Payment methods</h2><BarChart3 size={20} /></div>{overview.breakdowns.revenueByMethod?.length ? overview.breakdowns.revenueByMethod.map((item: any) => <div className="breakdown-row" key={item._id}><span>{label(item._id)}</span><strong>{money(item.total)} <small>({item.count})</small></strong></div>) : <p className="text-muted">No data available for the selected period.</p>}</section></div>
      <section className="glass-panel analytics-panel analytics-table-panel"><div className="analytics-panel-heading"><h2>Revenue report</h2><button className="btn btn-secondary" disabled={!!exporting} onClick={() => download("csv", "revenue")}><Download size={16} /> Export</button></div><div className="table-container"><table className="data-table"><thead><tr><th>Period</th><th>Transactions</th><th>Revenue</th></tr></thead><tbody>{revenue?.items?.length ? revenue.items.map((item: any) => <tr key={item._id}><td>{item.label}</td><td>{item.count}</td><td>{money(item.total)}</td></tr>) : <tr><td colSpan={3}>No data available for the selected period.</td></tr>}</tbody></table></div></section>
      <section className="glass-panel analytics-panel analytics-table-panel"><div className="analytics-panel-heading"><h2>Membership plan distribution</h2><button className="btn btn-secondary" disabled={!!exporting} onClick={() => download("csv", "membership")}><Download size={16} /> Export</button></div><div className="table-container"><table className="data-table"><thead><tr><th>Plan</th><th>Members</th><th>Active</th><th>Expired</th><th>Renewals</th></tr></thead><tbody>{memberships?.items?.length ? memberships.items.map((item: any) => <tr key={item._id || item.name}><td>{item.name}</td><td>{item.totalMembers}</td><td>{item.activeMembers}</td><td>{item.expiredMembers}</td><td>{item.totalRenewals}</td></tr>) : <tr><td colSpan={5}>No membership data available.</td></tr>}</tbody></table></div></section>
    </>}
  </div>;
}