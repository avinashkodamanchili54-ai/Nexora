import { verifyScanEntry } from "../api";

export default function CropHistoryPanel({
  history,
  models = [],
  onHistoryUpdated,
  onClear,
}) {
  const handleVerify = async (scanId) => {
    const updated = await verifyScanEntry(scanId, {
      expert_status: "Verified by KVK",
      follow_up_note: "Reviewed and confirmed for field action.",
    });
    onHistoryUpdated(updated);
  };

  const latest = history[0];
  const previous = history[1];

  return (
    <div className="stack-layout">
      <section className="panel-card">
        <div className="section-head">
          <div>
            <h2>AI Models &amp; Evaluation Status</h2>
            <p className="muted">Live MobileNetV2 specialist models available on your local server.</p>
          </div>
        </div>
        <div className="models-grid">
          {models.map((m) => (
            <div key={m.key} className="model-stat-card">
              <div className="library-card-head">
                <strong style={{ textTransform: "uppercase" }}>{m.key}</strong>
                <span className={`sev-badge ${m.loaded ? "sev-none" : "sev-mod"}`}>
                  {m.loaded ? "Loaded" : "Training / Pending"}
                </span>
              </div>
              <p className="muted">{m.classes_count} disease classes</p>
              {m.accuracy != null ? (
                <p className="tip-text">
                  Test Accuracy: {(m.accuracy * 100).toFixed(2)}% · Macro F1: {m.macro_f1?.toFixed(3)}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="panel-card">
        <div className="section-head">
          <div>
            <h2>Crop Health History &amp; Follow-up</h2>
            <p className="muted">
              Reports are cached offline automatically so farmers can review guidance without internet.
            </p>
          </div>
          {history.length > 0 ? (
            <button type="button" className="secondary-btn" onClick={onClear}>
              Clear History
            </button>
          ) : null}
        </div>

        {latest && previous ? (
          <div className="comparison-card">
            <strong>Before vs. Latest Scan Comparison:</strong> Previous scan ({previous.disease_name},{" "}
            {Math.round(previous.confidence * 100)}%) → Latest scan ({latest.disease_name},{" "}
            {Math.round(latest.confidence * 100)}%).
          </div>
        ) : null}

        {history.length === 0 ? (
          <p className="muted">No crop scans recorded yet. Scan a leaf in Step 2 to start tracking.</p>
        ) : (
          <div className="table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Image</th>
                  <th>Diagnosis</th>
                  <th>Confidence</th>
                  <th>Quality</th>
                  <th>Expert Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.scan_id}>
                    <td>{new Date(item.timestamp).toLocaleTimeString()}</td>
                    <td>{item.filename}</td>
                    <td><strong>{item.disease_name}</strong></td>
                    <td>{Math.round(item.confidence * 100)}%</td>
                    <td>{item.quality_score ?? 100}/100</td>
                    <td>
                      <span className={`sev-badge ${item.expert_status === "Verified by KVK" ? "sev-none" : "sev-mod"}`}>
                        {item.expert_status || "Pending Review"}
                      </span>
                    </td>
                    <td>
                      {item.expert_status !== "Verified by KVK" ? (
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => handleVerify(item.scan_id)}
                        >
                          Mark Verified
                        </button>
                      ) : (
                        <span>Confirmed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
