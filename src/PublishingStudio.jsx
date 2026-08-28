import React, { useEffect, useRef, useState } from "react";
import { PUBLISHING_TEMPLATES } from "./publishing.js";

export default function PublishingStudio({
  isDarkMode,
  onClose,
  onExportHtml,
  onPrint,
  onSettingsChange,
  onUseTemplate,
  settings,
}) {
  const closeRef = useRef(null);
  const [pendingTemplate, setPendingTemplate] = useState(null);

  useEffect(() => closeRef.current?.focus(), []);

  const update = (key, value) => onSettingsChange({ ...settings, [key]: value });

  return (
    <aside
      role="dialog"
      aria-label="Publishing studio"
      aria-modal="false"
      className={`document-inspector publishing-studio ${isDarkMode ? "document-inspector-dark" : ""}`}
      onKeyDown={(event) => event.key === "Escape" && onClose()}
    >
      <div className="inspector-header">
        <div>
          <span className="inspector-eyebrow">Output and templates</span>
          <h2>Publishing studio</h2>
        </div>
        <button ref={closeRef} type="button" onClick={onClose} className="inspector-close" aria-label="Close publishing studio">×</button>
      </div>

      <div className="publishing-body">
        <section aria-labelledby="brand-settings-title">
          <h3 id="brand-settings-title">Document brand</h3>
          <div className="publishing-field">
            <label htmlFor="publishing-organization">Organization name</label>
            <input id="publishing-organization" value={settings.organization} onChange={(event) => update("organization", event.target.value)} />
          </div>
          <div className="publishing-field publishing-color-field">
            <label htmlFor="publishing-accent">Accent color</label>
            <div>
              <input id="publishing-accent" type="color" value={settings.accent} onChange={(event) => update("accent", event.target.value)} />
              <code>{settings.accent.toUpperCase()}</code>
            </div>
          </div>
          <label className="publishing-check">
            <input type="checkbox" checked={settings.includeToc} onChange={(event) => update("includeToc", event.target.checked)} />
            <span><strong>Live table of contents</strong><small>Include linked headings in preview and exports.</small></span>
          </label>
          <div className="publishing-field">
            <label htmlFor="publishing-paper">Paper size</label>
            <select id="publishing-paper" value={settings.paperSize} onChange={(event) => update("paperSize", event.target.value)}>
              <option value="letter">US Letter</option>
              <option value="a4">A4</option>
            </select>
          </div>
        </section>

        <section aria-labelledby="publishing-templates-title">
          <div className="publishing-section-heading">
            <h3 id="publishing-templates-title">Company-ready templates</h3>
            <span>{PUBLISHING_TEMPLATES.length}</span>
          </div>
          <div className="template-list">
            {PUBLISHING_TEMPLATES.map((template) => (
              <article key={template.id}>
                <div><strong>{template.name}</strong><p>{template.description}</p></div>
                {pendingTemplate === template.id ? (
                  <div className="template-confirm">
                    <button type="button" onClick={() => setPendingTemplate(null)}>Cancel</button>
                    <button type="button" onClick={() => onUseTemplate(template.id)}>Replace document</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setPendingTemplate(template.id)}>Use template</button>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="publishing-actions">
        <button type="button" className="publishing-secondary" onClick={onExportHtml}>Download HTML</button>
        <button type="button" className="publishing-primary" onClick={onPrint}>Print or save as PDF</button>
      </div>
    </aside>
  );
}
