/**
 * NodeDetailPanel.jsx — Flowsint-style node detail view.
 * Shows: label, type badge, risk pill, all properties, degree + centrality score,
 * neighbor list (clickable), and a free-text annotation field.
 */

import React, { useState } from "react";
import { Copy, FileText } from "lucide-react";
import { TYPE_COLOR } from "./ReactFlowGraph";

const RISK_CLS = { high: "high", med: "med", low: "low" };

export default function NodeDetailPanel({
  nodes,
  edges,
  selectedId,
  analysisScores,  // { [nodeId]: score (0..1) } — from last centrality run
  annotations,     // { [nodeId]: string }
  onAnnotate,      // (nodeId, text) => void
  onSelectNode,
}) {
  const [copyFlash, setCopyFlash] = useState(false);
  const node = nodes.find((n) => n.id === selectedId);

  if (!node) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", gap: 8 }}>
        <FileText size={32} style={{ opacity: 0.3 }} />
        <span style={{ fontSize: 12 }}>Click a node to view details</span>
      </div>
    );
  }

  const color = TYPE_COLOR[node.type] || "#888";
  const score = analysisScores?.[node.id];

  // Neighbors
  const neighbors = edges
    .filter((e) => e.source === node.id || e.target === node.id)
    .map((e) => {
      const otherId = e.source === node.id ? e.target : e.source;
      const other = nodes.find((n) => n.id === otherId);
      return { id: otherId, label: other?.label ?? otherId, type: other?.type, edgeLabel: e.label };
    });

  const handleCopy = () => {
    navigator.clipboard?.writeText(node.id);
    setCopyFlash(true);
    setTimeout(() => setCopyFlash(false), 1400);
  };

  // All displayable properties
  const props = Object.entries(node).filter(
    ([k]) => !["id", "label", "type"].includes(k)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div className="node-detail-header">
        <div className="ndh-top">
          <div>
            <div className="ndh-label">{node.label}</div>
            <div className="ndh-meta" style={{ marginTop: 6 }}>
              <span
                className={`pill ${node.type}`}
                style={{ borderLeft: `3px solid ${color}` }}
              >
                {node.type}
              </span>
              {node.risk && node.risk !== "—" && (
                <span className={`pill ${RISK_CLS[node.risk] || "muted"}`}>
                  {node.risk} risk
                </span>
              )}
              {neighbors.length > 0 && (
                <span className="pill muted">{neighbors.length} neighbors</span>
              )}
            </div>
          </div>
          <button
            className="icon-btn"
            onClick={handleCopy}
            title="Copy node ID"
            style={copyFlash ? { background: "var(--green-s)", borderColor: "var(--green)", color: "var(--green)" } : {}}
          >
            <Copy size={13} />
          </button>
        </div>

        {score != null && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>
              <span>Centrality score</span>
              <span style={{ color: "var(--orange)", fontWeight: 600 }}>{(score * 100).toFixed(1)}%</span>
            </div>
            <div className="result-bar-track">
              <div className="result-bar-fill" style={{ width: `${score * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="panel-scroll">
        {/* Properties */}
        {props.length > 0 && (
          <div className="panel-section">
            <div className="section-title">Properties</div>
            <table className="prop-table">
              <tbody>
                {props.map(([k, v]) => (
                  <tr key={k}>
                    <td>{k}</td>
                    <td style={{ fontFamily: typeof v === "string" && v.includes("@") ? "monospace" : undefined }}>
                      {String(v)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Neighbors */}
        {neighbors.length > 0 && (
          <div className="panel-section">
            <div className="section-title">Connections ({neighbors.length})</div>
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {neighbors.map((nb) => (
                <div
                  key={nb.id + nb.edgeLabel}
                  className="neighbor-item"
                  onClick={() => onSelectNode?.(nb.id)}
                >
                  <span
                    className="ni-dot"
                    style={{ background: TYPE_COLOR[nb.type] || "#888" }}
                  />
                  <span className="ni-label">{nb.label}</span>
                  <span className="ni-edge">{nb.edgeLabel}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Annotation */}
        <div className="panel-section">
          <div className="section-title">Notes</div>
          <textarea
            className="field"
            placeholder="Add investigation notes…"
            value={annotations?.[node.id] || ""}
            onChange={(e) => onAnnotate?.(node.id, e.target.value)}
            style={{ minHeight: 80, fontSize: 12 }}
          />
        </div>
      </div>
    </div>
  );
}
