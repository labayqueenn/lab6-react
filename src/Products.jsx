import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from './api/client';

const EMPTY_FORM = { product_name: '', description: '', price: '', quantity: '' };
const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/products');
      setProducts(res.data.data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const reset = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setForm({
      product_name: product.product_name,
      description: product.description || '',
      price: String(product.price),
      quantity: String(product.quantity),
    });
    setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    const price = Number(form.price);
    const quantity = Number(form.quantity);
    if (!form.product_name.trim()) return setError('Product name is required.');
    if (form.price === '' || Number.isNaN(price) || price < 0) return setError('Price must be 0 or more.');
    if (form.quantity === '' || !Number.isInteger(quantity) || quantity < 0) {
      return setError('Quantity must be a whole number, 0 or more.');
    }

    const payload = {
      product_name: form.product_name.trim(),
      description: form.description.trim(),
      price,
      quantity,
    };

    setSaving(true);
    try {
      if (editingId) {
        await api.put('/products/' + editingId, payload);
        setNotice('Product updated.');
      } else {
        await api.post('/products', payload);
        setNotice('Product added.');
      }
      reset();
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (product) => {
    if (!window.confirm('Delete "' + product.product_name + '"?')) return;
    setError('');
    setNotice('');
    try {
      await api.delete('/products/' + product.id);
      if (editingId === product.id) reset();
      setNotice('Product deleted.');
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <main className="content">
      <section className="card">
        <h2>{editingId ? 'Edit product' : 'Add product'}</h2>

        {error && <div className="alert alert-error">{error}</div>}
        {notice && <div className="alert alert-ok">{notice}</div>}

        <form className="product-form" onSubmit={submit}>
          <label className="wide">
            Product name
            <input name="product_name" value={form.product_name} onChange={change} maxLength={100} required />
          </label>
          <label>
            Price (PHP)
            <input type="number" name="price" value={form.price} onChange={change} min="0" step="0.01" required />
          </label>
          <label>
            Quantity
            <input type="number" name="quantity" value={form.quantity} onChange={change} min="0" step="1" required />
          </label>
          <label className="wide">
            Description
            <textarea name="description" value={form.description} onChange={change} rows={3} />
          </label>
          <div className="form-actions wide">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update product' : 'Add product'}
            </button>
            {editingId && (
              <button className="btn btn-light" type="button" onClick={reset}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="card">
        <div className="list-head">
          <h2>Products ({products.length})</h2>
          <button className="btn btn-light" onClick={load} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {loading && products.length === 0 ? (
          <p className="muted">Loading products... the server may take up to a minute to wake up.</p>
        ) : products.length === 0 ? (
          <p className="muted">No products yet. Add your first product above.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product</th>
                  <th>Description</th>
                  <th className="num">Price</th>
                  <th className="num">Qty</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td className="strong">{p.product_name}</td>
                    <td className="desc">{p.description}</td>
                    <td className="num">{peso.format(p.price)}</td>
                    <td className="num">{p.quantity}</td>
                    <td className="actions">
                      <button className="btn btn-small" onClick={() => startEdit(p)}>
                        Edit
                      </button>
                      <button className="btn btn-small btn-danger" onClick={() => remove(p)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}