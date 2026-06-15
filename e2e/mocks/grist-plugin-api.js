window.grist = {
  ready: (config) => {
    if (config?.onEditOptions) {
      window.__gristOnEditOptions = config.onEditOptions;
    }
    if (config?.allowSelectBy) {
      window.__gristAllowSelectByCalled = true;
    }
  },
  setSelectedRows: async (rowIds) => {
    window.__gristSelectedRows = rowIds;
  },
  setCursorPos: async (pos) => {
    window.__gristCursorPos = pos;
  },
  mapColumnNames: (data, options) => {
    const mappings = options?.mappings ?? window.__gristCurrentMappings ?? null;
    if (!mappings) return data;
    const remap = (record) => {
      const out = { id: record.id };
      for (const [widgetCol, tableCol] of Object.entries(mappings)) {
        if (typeof tableCol === "string") out[widgetCol] = record[tableCol];
      }
      return out;
    };
    return Array.isArray(data) ? data.map(remap) : remap(data);
  },
  onRecord: (cb) => {
    window.__gristOnRecord = cb;
  },
  onRecords: (cb) => {
    window.__gristOnRecords = (records, mappings) => {
      window.__gristCurrentMappings = mappings;
      cb(records, mappings);
    };
  },
  onOptions: (cb) => {
    window.__gristOnOptions = cb;
  },
  setOption: async (key, value) => {
    window.__gristStoredOptions = { ...(window.__gristStoredOptions || {}), [key]: value };
    window.__gristOnOptions?.(window.__gristStoredOptions);
  },
  setOptions: async (options) => {
    window.__gristStoredOptions = { ...(window.__gristStoredOptions || {}), ...options };
    window.__gristOnOptions?.(window.__gristStoredOptions);
  },
  // Returns the currently selected table ID.
  // Tests can override via window.__gristSelectedTableId.
  getSelectedTableId: async () => window.__gristSelectedTableId || "Table1",
  selectedTable: {
    update: async (record) => {
      window.__gristUpdatedRecord = record;
    },
  },
  docApi: {
    // Stubs for _grist_Tables and _grist_Tables_column metadata tables.
    // Tests can inject column labels via window.__gristColumnLabels = { colId: "label" }.
    // Tests can inject column types via window.__gristColumnTypes = { colId: "Ref:Other" }.
    // Tests can inject arbitrary table rows via window.__gristFetchTableData = { TableId: { id: [], ... } }.
    fetchTable: async (tableId) => {
      if (tableId === "_grist_Tables") {
        const extra = window.__gristExtraTables || {};
        const ids = [1, ...Object.values(extra)];
        const tableIds = [window.__gristSelectedTableId || "Table1", ...Object.keys(extra)];
        return { id: ids, tableId: tableIds };
      }
      if (tableId === "_grist_Tables_column") {
        const labels = window.__gristColumnLabels || {};
        const types = window.__gristColumnTypes || {};
        const widgetOpts = window.__gristWidgetOptions || {};
        const colIds = Object.keys(labels);
        return {
          id: colIds.map((_, i) => i + 1),
          parentId: colIds.map(() => 1),
          colId: colIds,
          label: colIds.map((id) => labels[id]),
          type: colIds.map((id) => types[id] || "Text"),
          widgetOptions: colIds.map((id) => widgetOpts[id] || ""),
        };
      }
      if (window.__gristFetchTableData?.[tableId]) {
        return window.__gristFetchTableData[tableId];
      }
      return {};
    },
  },
};
