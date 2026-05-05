// src/Hooks/useTableOptions.js
import { useState, useEffect } from 'react';
import { getValues, initTables } from '../Api/TableService.js';
import { getTextTableList } from '../Api/Api.js';

/**
 * Loads options for one or more table IDs.
 * Primary: getValues(tableId) from TableService (memory/IndexedDB cache)
 * Fallback: getTextTableList(tableId) from API
 *
 * @param {number[]} tableIds - Array of table IDs to load
 * @returns {Object} - { tables: { [tableId]: [{id, label}] }, loading, error }
 */
export const useTableOptions = (tableIds = []) => {
  const [tables, setTables]   = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!tableIds.length) { setLoading(false); return; }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        await initTables();
      } catch {
        // initTables failure is non-fatal; we'll fall back per table below
      }

      const result = {};

      await Promise.all(
        tableIds.map(async (tableId) => {
          try {
            // ── Primary: TableService memory/IDB cache ──
            const values = getValues(tableId);
            if (values && values.length > 0) {
              result[tableId] = values.map((v) => ({ id: v.textId, label: v.textValue }));
              return;
            }
          } catch {
            // fall through to API
          }

          // ── Fallback: direct API call ──
          try {
            const apiValues = await getTextTableList(tableId);
            result[tableId] = apiValues.map((v) => ({ id: v.textId, label: v.textValue }));
          } catch (err) {
            console.error(`useTableOptions: failed to load table ${tableId}`, err);
            result[tableId] = [];
          }
        })
      );

      setTables(result);
      setLoading(false);
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableIds.join(',')]);

  return { tables, loading, error };
};