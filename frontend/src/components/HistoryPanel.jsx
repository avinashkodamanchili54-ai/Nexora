export default function HistoryPanel({ history, onClear }) {
  return (
    <section className="panel-card">
      <div className="section-head">
        <div>
          <h2>Recent Leaf Scans</h2>
          <p className="muted">Local scan history saved on this device.</p>
        </div>
        {history.length > 0 ? (
          <button type="button" className="secondary-btn" onClick={onClear}>
            Clear History
          </button>
        ) : null}
      </div>

      {history.length === 0 ? (
        <p className="muted">No leaf scans yet. Upload an image in the Diagnose Leaf tab.</p>
      ) : (
        <div className="table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Image</th>
                <th>Mode</th>
                <th>Diagnosis</th>
                <th>Confidence</th>
                <th>Severity</th>
                <th>Language</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.scan_id}>
                  <td>{new Date(item.timestamp).toLocaleTimeString()}</td>
                  <td>{item.filename}</td>
                  <td>{item.crop_mode}</td>
                  <td><strong>{item.disease_name}</strong></td>
                  <td>{(item.confidence * 100).toFixed(0)}%</td>
                  <td>{item.severity}</td>
                  <td>{item.language.toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
