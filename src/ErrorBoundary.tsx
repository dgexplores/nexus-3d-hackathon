import React from "react"

type State = { hasError: boolean; msg: string }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, msg: "" }
  static getDerivedStateFromError(e: Error): State { return { hasError: true, msg: e.message } }
  componentDidCatch(e: Error, info: React.ErrorInfo) { console.error("NEXUS boundary", e, info) }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "grid", placeItems: "center", background: "#010103", color: "#f1f5f9", padding: 24, textAlign: "center" }}>
          <div>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 11, letterSpacing: "0.2em", opacity: 0.6 }}>NEXUS — RECOVERY</div>
            <div style={{ fontFamily: "Instrument Serif", fontSize: 28, margin: "12px 0" }}>The wormhole flickered.</div>
            <div style={{ color: "#94a3b8", fontSize: 13, maxWidth: 420, margin: "0 auto 18px" }}>{this.state.msg || "WebGL context lost. Try reloading or reducing motion in your OS settings."}</div>
            <button onClick={() => location.reload()} style={{ borderRadius: 999, background: "#fff", color: "#000", border: "none", padding: "10px 18px", fontWeight: 600, cursor: "pointer" }}>Reload</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
