import { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import type { FieldConfig, FieldOption } from '../lib/moduleConfig';
import { api, errorMessage } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const idOf = (value: any) => value && typeof value === 'object' ? value._id : value ?? '';

export default function FormModal({ title, fields, initial, onClose, onSaved, endpoint }: {
  title: string;
  fields: FieldConfig[];
  initial?: any;
  onClose: () => void;
  onSaved: () => void;
  endpoint: string;
}) {
  const { user } = useAuth();
  const [values, setValues] = useState<Record<string, any>>({});
  const [options, setOptions] = useState<Record<string, FieldOption[]>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const start: Record<string, any> = {};
    for (const field of fields) {
      let value = initial?.[field.name] ?? field.defaultValue ?? (field.type === 'boolean' ? false : '');
      if (field.type === 'date' && value) value = new Date(value).toISOString().slice(0, 10);
      if (field.type === 'datetime-local' && value) value = new Date(value).toISOString().slice(0, 16);
      if (field.type === 'csv' && Array.isArray(value)) value = value.join(', ');
      if (field.type === 'json' && typeof value !== 'string') value = JSON.stringify(value ?? [], null, 2);
      if (field.type === 'select') value = idOf(value);
      if (field.type === 'multi-property' && Array.isArray(value)) value = value.map(idOf);
      start[field.name] = value;
    }
    setValues(start);
  }, [fields, initial]);

  useEffect(() => {
    for (const field of fields) {
      if (!field.remoteEndpoint) continue;
      if (field.remoteEndpoint === '__properties') {
        setOptions(current => ({
          ...current,
          [field.name]: (user?.properties || []).map(property => ({
            value: property._id,
            label: `${property.code} — ${property.name}`
          }))
        }));
        continue;
      }
      const remoteEndpoint = field.remoteEndpoint;
      api.get(remoteEndpoint)
        .then(({ data }) => {
          const rows = data.data || data;
          setOptions(current => ({
            ...current,
            [field.name]: rows.map((row: any) => ({
              value: row._id,
              label: (field.remoteLabel || ['name'])
                .map(key => row[key])
                .filter(Boolean)
                .join(' · ') || row._id
            }))
          }));
        })
        .catch(() => setOptions(current => ({ ...current, [field.name]: [] })));
    }
  }, [fields, user]);

  const isEdit = Boolean(initial?._id);
  const propertyOptions = useMemo(() => (user?.properties || []).map(property => ({
    value: property._id,
    label: `${property.code} — ${property.name}`
  })), [user]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body: Record<string, any> = {};
      for (const field of fields) {
        let value = values[field.name];
        if (field.type === 'number' && value !== '') value = Number(value);
        if (field.type === 'csv') value = String(value || '').split(',').map(item => item.trim()).filter(Boolean);
        if (field.type === 'json') value = JSON.parse(value || '[]');
        if ((field.type === 'date' || field.type === 'datetime-local') && value) value = new Date(value).toISOString();
        if (value === '' && !field.required) continue;
        body[field.name] = value;
      }
      if (isEdit) await api.put(`${endpoint}/${initial._id}`, body);
      else await api.post(endpoint, body);
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="form-grid">
          {fields.map(field => (
            <label key={field.name} className={field.type === 'textarea' || field.type === 'json' ? 'full' : ''}>
              <span>{field.label}{field.required ? ' *' : ''}</span>
              {field.type === 'textarea' || field.type === 'json' ? (
                <textarea rows={field.type === 'json' ? 7 : 3} value={values[field.name] ?? ''} placeholder={field.placeholder} onChange={event => setValues(current => ({ ...current, [field.name]: event.target.value }))} />
              ) : field.type === 'select' ? (
                <select value={values[field.name] ?? ''} required={field.required} onChange={event => setValues(current => ({ ...current, [field.name]: event.target.value }))}>
                  <option value="">Select…</option>
                  {(field.options || options[field.name] || []).map(option => <option key={String(option.value)} value={option.value}>{option.label}</option>)}
                </select>
              ) : field.type === 'multi-property' ? (
                <select multiple value={values[field.name] || []} onChange={event => setValues(current => ({ ...current, [field.name]: Array.from(event.target.selectedOptions).map(option => option.value) }))}>
                  {propertyOptions.map(option => <option key={String(option.value)} value={option.value}>{option.label}</option>)}
                </select>
              ) : field.type === 'boolean' ? (
                <input className="check" type="checkbox" checked={Boolean(values[field.name])} onChange={event => setValues(current => ({ ...current, [field.name]: event.target.checked }))} />
              ) : (
                <input type={field.type || 'text'} required={field.required} value={values[field.name] ?? ''} placeholder={field.placeholder} onChange={event => setValues(current => ({ ...current, [field.name]: event.target.value }))} />
              )}
            </label>
          ))}
        </div>
        {error && <div className="alert error">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
          <button disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create record'}</button>
        </div>
      </form>
    </Modal>
  );
}
