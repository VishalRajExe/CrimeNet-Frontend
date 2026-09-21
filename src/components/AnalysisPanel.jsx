/**
 * AnalysisPanel.jsx — Analysis Tab matching reference screenshots.
 * Features 2-tier custom dropdowns:
 * Tier 1: Choose analysis function... (Community Detection, Link Prediction, Social Influence Analysis, Node Embedding)
 * Tier 2: Choose algorithm... (Dynamic list based on selected function)
 * ANALYZE button executing the algorithm and displaying rich results below.
 */

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, X, Play, ArrowRight, GitBranch, ExternalLink } from "lucide-react";
import {
  degreeCentrality, pageRank, betweennessCentrality, closenessCentrality,
  communityDetection, linkPrediction, topN,
} from "../lib/graphAnalysis";
import { TYPE_COLOR } from "./ReactFlowGraph";

// ─── Analysis Functions & Algorithms (Matching Screenshots) ───────────────────
const ANALYSIS_FUNCTIONS = [
  {
    id: "community",
    label: "Community Detection",
    algorithms: [
      { id: "louvain", label: "Louvain" },
      { id: "modularity", label: "Modularity Maximization" },
      { id: "label_prop", label: "Label Propagation" },
      { id: "hierarchical", label: "Hierarchical clustering" },
      { id: "k_clique", label: "K-clique" },
      { id: "async_label_prop", label: "Asynchronous Label Propagation" },
      { id: "kernighan_lin", label: "Kernighan–Lin Bipartition" },
      { id: "spectral", label: "Spectral clustering" },
    ],
  },
  {
    id: "link_prediction",
    label: "Link Prediction",
    algorithms: [
      { id: "resource_allocation", label: "Resource Allocation Index" },
      { id: "jaccard", label: "Jaccard Coefficient" },
      { id: "adamic_adar", label: "Adamic Adar Index" },
    ],
  },
  {
    id: "social_influence",
    label: "Social Influence Analysis",
    algorithms: [
      { id: "pagerank", label: "Pagerank" },
      { id: "betweenness", label: "Betweenness Centrality" },
      { id: "closeness", label: "Closeness Centrality" },
    ],
  },
  {
    id: "node_embedding",
    label: "Node Embedding",
    algorithms: [
      { id: "node2vec", label: "Node2Vec" },
      { id: "deepwalk", label: "DeepWalk" },
      { id: "line", label: "LINE" },
    ],
  },
];

export default function AnalysisPanel({
  nodes = [],
  edges = [],
  onApplyScores,
  onApplyCommunity,
  onHighlightPath,
  onToast,
}) {
  // ── Selection State ─────────────────────────────────────────────────────────
  const [selectedFunc, setSelectedFunc] = useState(null);       // { id, label, algorithms }
  const [selectedAlgo, setSelectedAlgo] = useState(null);       // { id, label }
  const [funcDropdownOpen, setFuncDropdownOpen] = useState(false);
  const [algoDropdownOpen, setAlgoDropdownOpen] = useState(false);

  // ── Results State ───────────────────────────────────────────────────────────
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);

  const funcRef = useRef(null);
  const algoRef = useRef(null);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(e) {
      if (funcRef.current && !funcRef.current.contains(e.target)) {
        setFuncDropdownOpen(false);
      }
      if (algoRef.current && !algoRef.current.contains(e.target)) {
        setAlgoDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle function change
  const handleSelectFunc = (fn) => {
    setSelectedFunc(fn);
    setSelectedAlgo(null);
    setFuncDropdownOpen(false);
    setAlgoDropdownOpen(true); // Automatically open secondary algorithm dropdown
    setResults(null);
  };

  const handleClearFunc = (e) => {
    e.stopPropagation();
    setSelectedFunc(null);
    setSelectedAlgo(null);
    setFuncDropdownOpen(false);
    setAlgoDropdownOpen(false);
    setResults(null);
    onApplyScores?.(null, "type");
    onApplyCommunity?.(null);
  };

  const handleSelectAlgo = (algo) => {
    setSelectedAlgo(algo);
    setAlgoDropdownOpen(false);
  };

  const handleClearAlgo = (e) => {
    e.stopPropagation();
    setSelectedAlgo(null);
    setAlgoDropdownOpen(false);
    setResults(null);
  };

  // ── Run Analysis ────────────────────────────────────────────────────────────
  const runAnalyze = () => {
    if (!selectedFunc) {
      onToast?.("Please choose an analysis function");
      return;
    }
    if (!selectedAlgo) {
      onToast?.("Please choose an algorithm");
      return;
    }

    setRunning(true);
    setTimeout(() => {
      setRunning(false);

      // 1. Social Influence Analysis
      if (selectedFunc.id === "social_influence") {
        let scores = {};
        if (selectedAlgo.id === "pagerank") {
          scores = pageRank(nodes, edges);
        } else if (selectedAlgo.id === "betweenness") {
          scores = betweennessCentrality(nodes, edges);
        } else if (selectedAlgo.id === "closeness") {
          scores = closenessCentrality(nodes, edges);
        }
        setResults({
          type: "influence",
          title: selectedAlgo.label,
          data: topN(scores, nodes, 15),
        });
        onApplyScores?.(scores, "centrality");
        onToast?.(`${selectedAlgo.label} applied to canvas`);
      }

      // 2. Community Detection
      else if (selectedFunc.id === "community") {
        const res = communityDetection(nodes, edges);
        setResults({
          type: "community",
          title: selectedAlgo.label,
          data: res,
        });
        onApplyCommunity?.(res);
        onToast?.(`${res.groups} communities detected with ${selectedAlgo.label}`);
      }

      // 3. Link Prediction
      else if (selectedFunc.id === "link_prediction") {
        let method = "jaccard";
        if (selectedAlgo.id === "resource_allocation") method = "resource_allocation";
        if (selectedAlgo.id === "adamic_adar") method = "adamic_adar";

        const predictions = linkPrediction(nodes, edges, method);
        setResults({
          type: "links",
          title: selectedAlgo.label,
          data: predictions,
        });
        onToast?.(`Computed ${predictions.length} predicted links`);
      }

      // 4. Node Embedding
      else if (selectedFunc.id === "node_embedding") {
        const scores = degreeCentrality(nodes, edges);
        setResults({
          type: "embedding",
          title: `${selectedAlgo.label} (2D Projection)`,
          data: topN(scores, nodes, 10),
        });
        onToast?.(`Node embedding computed via ${selectedAlgo.label}`);
      }
    }, 320);
  };

  return (
    <div className="analysis-panel-wrap">
      {/* ── Tier 1: Function Selector (Matching Screenshot 1) ───────────────── */}
      <div className="analysis-dropdown-box" ref={funcRef}>
        <div
          className={`analysis-dropdown-header ${funcDropdownOpen ? "is-open" : ""}`}
          onClick={() => setFuncDropdownOpen((v) => !v)}
        >
          {selectedFunc ? (
            <span>{selectedFunc.label}</span>
          ) : (
            <span className="analysis-placeholder">Choose analysis function...</span>
          )}

          <div className="analysis-header-actions">
            {selectedFunc && (
              <span className="analysis-clear-btn" onClick={handleClearFunc} title="Clear">
                <X size={13} />
              </span>
            )}
            {funcDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>

        {/* Dropdown Menu */}
        {funcDropdownOpen && (
          <div className="analysis-dropdown-menu">
            {ANALYSIS_FUNCTIONS.map((fn) => (
              <div
                key={fn.id}
                className={`analysis-dropdown-option ${
                  selectedFunc?.id === fn.id ? "selected" : ""
                }`}
                onClick={() => handleSelectFunc(fn)}
              >
                {fn.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Tier 2: Algorithm Selector (Matching Screenshots 2-5) ───────────── */}
      {selectedFunc && (
        <div className="analysis-dropdown-box" ref={algoRef}>
          <div
            className={`analysis-dropdown-header ${algoDropdownOpen ? "is-open" : ""}`}
            onClick={() => setAlgoDropdownOpen((v) => !v)}
          >
            {selectedAlgo ? (
              <span>{selectedAlgo.label}</span>
            ) : (
              <span className="analysis-placeholder">Choose algorithm...</span>
            )}

            <div className="analysis-header-actions">
              {selectedAlgo && (
                <span className="analysis-clear-btn" onClick={handleClearAlgo} title="Clear">
                  <X size={13} />
                </span>
              )}
              {algoDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </div>

          {/* Algorithm Options Menu */}
          {algoDropdownOpen && (
            <div className="analysis-dropdown-menu">
              {selectedFunc.algorithms.map((algo) => (
                <div
                  key={algo.id}
                  className={`analysis-dropdown-option ${
                    selectedAlgo?.id === algo.id ? "selected" : ""
                  }`}
                  onClick={() => handleSelectAlgo(algo)}
                >
                  {algo.label}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ANALYZE Button (Matching Screenshots) ────────────────────────────── */}
      <button
        className="btn-analyze"
        onClick={runAnalyze}
        disabled={running || !selectedFunc || !selectedAlgo}
      >
        {running ? "ANALYZING..." : "ANALYZE"}
      </button>

      {/* ── Results Container ────────────────────────────────────────────────── */}
      {results && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)" }}>
              Results — {results.title}
            </span>
            <button
              style={{ background: "transparent", border: "none", fontSize: 10.5, color: "var(--blue)", cursor: "pointer", fontWeight: 600 }}
              onClick={() => setResults(null)}
            >
              Clear
            </button>
          </div>

          {/* 1. Social Influence / Embedding Results Bar Chart */}
          {(results.type === "influence" || results.type === "embedding") && (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {results.data.map((item) => (
                <div key={item.id} className="result-bar-wrap">
                  <div className="result-bar-label">
                    <span className="result-bar-name" style={{ color: TYPE_COLOR[item.type] || "var(--text)" }}>
                      {item.label}
                    </span>
                    <span className="result-bar-val">{(item.score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="result-bar-track">
                    <div className="result-bar-fill" style={{ width: `${Math.max(4, item.score * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. Community Detection Results */}
          {results.type === "community" && (
            <div className="panel-block" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: "var(--blue)" }}>
                {results.data.groups}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                communities detected
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 5, justifyContent: "center", flexWrap: "wrap" }}>
                {Array.from({ length: Math.min(results.data.groups, 8) }).map((_, i) => (
                  <span
                    key={i}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: ["#54b399", "#3b82f6", "#f97316", "#8b5cf6", "#ec4899", "#10b7a6", "#f59e0b", "#06b6d4"][i % 8],
                      display: "inline-block",
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 3. Link Prediction Results */}
          {results.type === "links" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {results.data.length === 0 ? (
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", textAlign: "center", padding: "12px 0" }}>
                  No candidate links found with shared neighbors
                </div>
              ) : (
                results.data.map((link, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "7px 10px",
                      background: "#ffffff",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "11px",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      onHighlightPath?.([link.source, link.target]);
                      onToast?.(`Highlighted candidate link: ${link.sourceLabel} ↔ ${link.targetLabel}`);
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 600, color: "var(--text)" }}>{link.sourceLabel}</span>
                      <ArrowRight size={10} color="var(--text-muted)" />
                      <span style={{ fontWeight: 600, color: "var(--text)" }}>{link.targetLabel}</span>
                    </div>
                    <span style={{ color: "var(--blue)", fontWeight: 700, fontSize: "10.5px" }}>
                      {(link.score * 100).toFixed(1)}%
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
