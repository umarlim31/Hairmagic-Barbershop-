"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Annoyed, Frown, Laugh, LoaderCircle, Meh, MessageSquare, RefreshCw, Smile } from "lucide-react";
import { FEEDBACK_RATINGS, type FeedbackReport } from "@/lib/feedback-config";

const faces = [Frown, Annoyed, Meh, Smile, Laugh];
const dayFormat = new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "Asia/Makassar" });

export function FeedbackReportView() {
  const [report, setReport] = useState<FeedbackReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);

  const load = useCallback(async (cursor?: string) => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/owner/feedback${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`, { cache: "no-store", signal: controller.signal });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) setReport(null);
        const failure = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(failure?.error || "Penilaian belum dapat dimuat.");
      }
      const data = await response.json() as FeedbackReport;
      if (!Array.isArray(data?.items) || !data.summary) throw new Error("Penilaian belum dapat dimuat.");
      if (controller.signal.aborted) return;
      setReport(previous => cursor && previous ? { ...data, items: [...previous.items, ...data.items.filter((item: { id: string }) => !previous.items.some(old => old.id === item.id))] } : data);
    } catch (reason) {
      if (!controller.signal.aborted) setError(reason instanceof Error && !/fetch|network|json/i.test(reason.message) ? reason.message : "Koneksi terputus. Silakan coba lagi.");
    } finally { if (!controller.signal.aborted) setLoading(false); }
  }, []);

  useEffect(() => { const frame = requestAnimationFrame(() => void load()); return () => { cancelAnimationFrame(frame); request.current?.abort(); }; }, [load]);
  const summary = report?.summary;

  return (
    <div className="hm-owner-report">
      <div className="hm-owner-toolbar"><p>Semua penilaian · anonim</p><button type="button" disabled={loading} onClick={() => void load()}><RefreshCw className={loading ? "hm-spin" : ""} aria-hidden="true" /> Perbarui</button></div>
      {error && <div className="hm-feedback-error" role="alert">{error}<button type="button" onClick={() => void load()} disabled={loading}>Coba lagi</button></div>}
      {!report && loading && <div className="hm-owner-empty" role="status"><LoaderCircle className="hm-spin" aria-hidden="true" /><p>Memuat penilaian pelanggan…</p></div>}
      {report && summary && <>
        <div className="hm-owner-stats"><div><span>Total penilaian</span><strong>{summary.total.toLocaleString("id-ID")}</strong></div><div><span>Rata-rata kepuasan</span><strong>{summary.total ? summary.average.toLocaleString("id-ID", { maximumFractionDigits: 1, minimumFractionDigits: 1 }) : "—"}<small>/ 5</small></strong></div><div><span>Puas & sangat puas</span><strong>{summary.total ? `${Math.round(summary.satisfied / summary.total * 100)}%` : "—"}</strong></div></div>
        {summary.total === 0 ? <section className="hm-owner-empty"><MessageSquare aria-hidden="true" /><h2>Belum ada penilaian.</h2><p>Penilaian pelanggan akan muncul di sini setelah berhasil dikirim dari layar penilaian.</p><a className="hm-button hm-button-blue" href="/penilaian">Buka penilaian</a></section> : <div className="hm-owner-content">
          <aside className="hm-rating-distribution"><h2>Gambaran kepuasan</h2>{[...summary.distribution].reverse().map(row => <div key={row.rating} className="hm-distribution-row" data-rating={row.rating}><div><span>{FEEDBACK_RATINGS[row.rating - 1].description}</span><strong>{row.count}</strong></div><div className="hm-distribution-track" aria-hidden="true"><span style={{ width: `${row.count / summary.total * 100}%` }} /></div></div>)}<p>Hanya tanggal penilaian yang disimpan, tanpa waktu terperinci atau identitas pelanggan.</p></aside>
          <section className="hm-owner-messages"><h2>Penilaian & kritik</h2>{report.items.map(item => { const Face = faces[item.rating - 1]; return <article key={item.id} className="hm-owner-message" data-rating={item.rating}><header><span className="hm-owner-rating"><Face aria-hidden="true" />{FEEDBACK_RATINGS[item.rating - 1].description}</span><time dateTime={item.submittedDay}>{dayFormat.format(new Date(`${item.submittedDay}T12:00:00+08:00`))}</time></header>{item.message ? <p>{item.message}</p> : <p className="hm-no-comment">Tanpa pesan tambahan.</p>}</article>; })}{report.nextCursor && <button type="button" className="hm-button hm-button-outline hm-load-more" disabled={loading} onClick={() => void load(report.nextCursor!)}>{loading ? "Memuat…" : "Muat penilaian berikutnya"}</button>}</section>
        </div>}
      </>}
    </div>
  );
}
