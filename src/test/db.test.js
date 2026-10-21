// src/test/db.test.js
// Tests for the IndexedDB data layer using fake-indexeddb.

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { addItem, listItems, getItem, recordSale } from '../lib/db.js';

describe('db – data layer', () => {
  it('adds an item and retrieves it', async () => {
    const id   = await addItem({ nameEn: 'Sugar', nameHi: 'चीनी', unit: 'kg', stock: 10, reorderAt: 2 });
    const item = await getItem(id);

    expect(item).toBeDefined();
    expect(item.nameEn).toBe('Sugar');
    expect(item.nameHi).toBe('चीनी');
    expect(item.unit).toBe('kg');
    expect(item.stock).toBe(10);
    expect(item.reorderAt).toBe(2);
    expect(item.salesLog).toEqual([]);
  });

  it('recordSale reduces stock by exactly 1.5 (no rounding)', async () => {
    const id       = await addItem({ nameEn: 'Mustard Oil', nameHi: 'सरसों का तेल', unit: 'kg', stock: 10, reorderAt: 3 });
    const newStock = await recordSale(id, 1.5);

    expect(newStock).toBe(8.5);

    const item = await getItem(id);
    expect(item.stock).toBe(8.5);
  });

  it('recordSale appends {date, qty} to salesLog with today ISO date', async () => {
    const id   = await addItem({ nameEn: 'Rice', nameHi: 'चावल', unit: 'kg', stock: 20, reorderAt: 4 });
    await recordSale(id, 1.5);

    const item  = await getItem(id);
    const today = new Date();
    const expectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    expect(item.salesLog).toHaveLength(1);
    expect(item.salesLog[0].qty).toBe(1.5);
    expect(item.salesLog[0].date).toBe(expectedDate);
  });

  it('stores 0.5 unrounded', async () => {
    const id = await addItem({ nameEn: 'Loose', nameHi: 'खुला', unit: 'loose', stock: 5, reorderAt: 1 });
    await recordSale(id, 0.5);
    const item = await getItem(id);
    expect(item.stock).toBe(4.5);
    expect(item.salesLog[0].qty).toBe(0.5);
  });

  it('stores 2.25 unrounded', async () => {
    const id = await addItem({ nameEn: 'Dal', nameHi: 'दाल', unit: 'kg', stock: 10, reorderAt: 2 });
    await recordSale(id, 2.25);
    const item = await getItem(id);
    expect(item.stock).toBe(7.75);
    expect(item.salesLog[0].qty).toBe(2.25);
  });

  it('listItems returns all added items', async () => {
    await addItem({ nameEn: 'Biscuit', nameHi: 'बिस्कुट', unit: 'pcs', stock: 50, reorderAt: 10 });
    await addItem({ nameEn: 'Tea', nameHi: 'चाय', unit: 'g', stock: 500, reorderAt: 100 });
    const items = await listItems();
    // At least these two were added (other tests may have added more)
    expect(items.length).toBeGreaterThanOrEqual(2);
  });
});
