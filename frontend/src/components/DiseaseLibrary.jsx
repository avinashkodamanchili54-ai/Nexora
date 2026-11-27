import { useState } from "react";

export default function DiseaseLibrary({ diseases }) {
  const [query, setQuery] = useState("");

  const filtered = diseases.filter((d) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      d.name.toLowerCase().includes(q) ||
      d.crop.toLowerCase().includes(q) ||
      d.symptoms.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <section className="panel-card">
      <div className="section-head">
        <div>
          <h2>Verified Crop Disease Knowledge Base</h2>
          <p className="muted">Browse verified symptoms, treatments, and preventive farming practices.</p>
        </div>
        <input
          type="search"
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search disease or symptom..."
          aria-label="Search disease knowledge base"
        />
      </div>

      <div className="library-grid">
        {filtered.map((d) => (
          <article key={d.disease_id} className="library-card">
            <div className="library-card-head">
              <h3>{d.name}</h3>
              <span className="meta-pill">{d.severity}</span>
            </div>
            <p className="crop-sub">{d.crop}</p>
            <p className="lib-label">Key Symptoms</p>
            <ul>
              {d.symptoms.slice(0, 2).map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
            <p className="lib-label">Primary Treatment</p>
            <p className="lib-text">{d.treatments[0]}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
